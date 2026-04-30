import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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

  let customer: any;
  try {
    customer = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: brandSettings } = await supabase
    .from("brand_settings")
    .select("brand_id")
    .eq("shopify_domain", shopDomain)
    .maybeSingle();

  const brandId = brandSettings?.brand_id ?? null;

  if (topic === "customers/create" || topic === "customers/update") {
    await supabase.from("shopify_customers").upsert({
      brand_id: brandId,
      shopify_customer_id: String(customer.id),
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      orders_count: customer.orders_count,
      total_spent: customer.total_spent,
      tags: customer.tags,
      accepts_marketing: customer.accepts_marketing,
      created_at_shopify: customer.created_at,
      updated_at_shopify: customer.updated_at,
    }, { onConflict: "shopify_customer_id" });
  }

  if (topic === "customers/delete") {
    await supabase.from("shopify_customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("shopify_customer_id", String(customer.id));
  }

  return NextResponse.json({ ok: true });
}
