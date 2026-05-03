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

    // ── Email Marketing: log event + update contact + trigger segmentation ──
    if (brandId && order.email) {
      const svc = sbService();
      // Upsert into email_contacts
      const { data: contact } = await svc.from("email_contacts").upsert({
        brand_id: brandId,
        email: order.email.toLowerCase().trim(),
        name: order.billing_address?.name ?? order.customer?.first_name ?? null,
        source: "checkout",
        subscribed: true,
        shopify_customer_id: order.customer?.id ? String(order.customer.id) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "brand_id,email" }).select("id").maybeSingle();

      const contactId = contact?.id;

      // Log contact event
      if (contactId) {
        await svc.from("contact_events").insert({
          brand_id: brandId,
          contact_id: contactId,
          email: order.email,
          event_type: "order_placed",
          event_data: {
            order_id: order.id,
            order_number: order.order_number,
            total: order.total_price,
            currency: order.currency,
          },
        });

        // Update contact order stats
        await svc.from("email_contacts")
          .update({ last_order_at: new Date().toISOString() })
          .eq("id", contactId);

        // Trigger segment re-evaluation (async, non-blocking)
        import("@/lib/segmentation/evaluate").then(({ evaluateContactForSegments }) => {
          evaluateContactForSegments(brandId, contactId).catch(() => {});
        });
      }

      // Queue post-purchase flow
      const { data: ppFlow } = await svc.from("email_flows")
        .select("id")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .ilike("name", "%post purchase%")
        .maybeSingle();

      if (ppFlow) {
        const { data: firstStep } = await svc.from("email_flow_steps")
          .select("id")
          .eq("flow_id", ppFlow.id)
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle();

        await svc.from("automation_queue").insert({
          brand_id: brandId,
          flow_type: "post_purchase",
          flow_id: ppFlow.id,
          current_step_id: firstStep?.id ?? null,
          email: order.email,
          customer_name: order.billing_address?.name ?? order.customer?.first_name,
          contact_id: contactId,
          payload: { order_number: order.order_number, total_price: order.total_price },
          trigger_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour delay
          sent: false,
          recovered: false,
        });
      }
    }
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
