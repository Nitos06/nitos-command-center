import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function sb() {
  return createClient(
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
  const shopDomain = req.headers.get("x-shopify-shop-domain") ?? "";

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (secret && hmacHeader) {
    if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
    }
  }

  let checkout: any;
  try {
    checkout = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Must have an email to send anything
  const email = checkout.email;
  if (!email) return NextResponse.json({ ok: true });

  const supabase = sb();

  // Resolve brand_id from shop domain
  const { data: brandSettings } = await supabase
    .from("brand_settings")
    .select("brand_id")
    .eq("shopify_domain", shopDomain)
    .maybeSingle();

  const brandId = brandSettings?.brand_id ?? null;

  // Queue abandoned cart email: trigger 4 hours from now
  const triggerAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const checkoutToken = String(checkout.token ?? checkout.id ?? "");

  const { error } = await supabase.from("automation_queue").upsert(
    {
      brand_id: brandId,
      flow_type: "abandoned_cart",
      email,
      customer_name:
        checkout.billing_address?.name ??
        checkout.shipping_address?.name ??
        checkout.customer?.first_name ??
        null,
      payload: {
        checkout_url: checkout.abandoned_checkout_url ?? checkout.checkout_url,
        line_items: checkout.line_items ?? [],
        total_price: checkout.total_price ?? "0.00",
        checkout_id: checkout.id,
      },
      trigger_at: triggerAt,
      sent: false,
      recovered: false,
      checkout_token: checkoutToken,
    },
    { onConflict: "brand_id,checkout_token", ignoreDuplicates: true }
  );

  if (error) console.error("[checkouts webhook] upsert error:", error.message);

  return NextResponse.json({ ok: true });
}
