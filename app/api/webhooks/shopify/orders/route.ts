import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notify } from "@/lib/notifications";
import crypto from "crypto";

function sbService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyShopifyHmac(body: string, hmacHeader: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmacHeader));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shopDomain = req.headers.get("x-shopify-shop-domain") ?? "";

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (secret && hmacHeader) {
    if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
    }
  }

  let order: any;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();

  // Resolve brand_id from shop domain
  const { data: brandSettings } = await supabase
    .from("brand_settings")
    .select("brand_id")
    .eq("shopify_domain", shopDomain)
    .maybeSingle();

  const brandId = brandSettings?.brand_id ?? null;

  if (topic === "orders/paid" || topic === "orders/created") {
    // Mark any pending abandoned-cart automation as recovered (email should NOT send)
    if (order.email) {
      await sbService()
        .from("automation_queue")
        .update({ recovered: true })
        .eq("flow_type", "abandoned_cart")
        .eq("email", order.email)
        .eq("sent", false);
    }

    await supabase.from("shopify_orders").upsert({
      brand_id: brandId,
      shopify_order_id: String(order.id),
      order_number: order.order_number,
      customer_email: order.email,
      customer_name: order.billing_address?.name ?? order.customer?.first_name,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_price: order.total_price,
      subtotal_price: order.subtotal_price,
      currency: order.currency,
      line_items: order.line_items,
      created_at_shopify: order.created_at,
    }, { onConflict: "shopify_order_id" });
  }

  if (topic === "orders/fulfilled") {
    await supabase.from("shopify_orders")
      .update({ fulfilled_at: order.updated_at })
      .eq("shopify_order_id", String(order.id));

    // Queue review request via reviews agent (handled by reviews routine which polls daily)
    // We log the event so the reviews agent can pick it up
    if (brandId) {
      await supabase.from("agent_logs").insert({
        brand_id: brandId,
        agent_name: "reviews",
        type: "info",
        message: `Order ${order.order_number} fulfilled — review request queued for ${order.email}`,
      });
    }
  }

  if (topic === "orders/cancelled") {
    await supabase.from("shopify_orders")
      .update({ financial_status: "cancelled", cancelled_at: order.cancelled_at })
      .eq("shopify_order_id", String(order.id));
  }

  if (topic === "refunds/create") {
    await notify({
      title: "Refund created",
      message: `Order #${order.order_number} · ${order.currency} ${order.transactions?.[0]?.amount ?? "—"}`,
      level: "warn",
      channels: ["telegram"],
    });
  }

  return NextResponse.json({ ok: true });
}
