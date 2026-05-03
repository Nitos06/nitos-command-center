import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const WEBHOOK_TOPICS = [
  { topics: ["orders/paid", "orders/created", "orders/fulfilled", "orders/cancelled"], path: "/api/webhooks/shopify/orders" },
  { topics: ["refunds/create"], path: "/api/webhooks/shopify/orders" },
  { topics: ["checkouts/create", "checkouts/update"], path: "/api/webhooks/shopify/checkouts" },
  { topics: ["customers/create", "customers/update", "customers/delete"], path: "/api/webhooks/shopify/customers" },
];

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyHmac(params: URLSearchParams, secret: string): boolean {
  const hmac = params.get("hmac") ?? "";
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key !== "hmac") pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const message = pairs.join("&");
  const computed = crypto.createHmac("sha256", secret).update(message).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
  } catch {
    return false;
  }
}

async function registerWebhooks(shop: string, accessToken: string) {
  const results: { topic: string; ok: boolean }[] = [];
  for (const group of WEBHOOK_TOPICS) {
    for (const topic of group.topics) {
      const res = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${APP_URL}${group.path}`,
            format: "json",
          },
        }),
      });
      results.push({ topic, ok: res.ok });
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop") ?? "";
  const code = searchParams.get("code") ?? "";
  const state = searchParams.get("state") ?? "";

  // Verify state matches cookie
  const cookieState = req.cookies.get("shopify_oauth_state")?.value ?? "";
  if (!state || state !== cookieState) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  // Verify HMAC signature from Shopify
  const secret = process.env.SHOPIFY_CLIENT_SECRET!;
  if (!verifyHmac(searchParams, secret)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  // Decode brandId from state
  let brandId: string | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    brandId = decoded.brandId ?? null;
  } catch {
    // state without brandId is fine — will create/find brand by shop domain
  }

  // Exchange code for permanent access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: secret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }

  const { access_token } = await tokenRes.json();
  const supabase = sb();

  // If no brandId, try to find brand by shop domain, or use first brand
  if (!brandId) {
    const { data: settings } = await supabase
      .from("brand_settings")
      .select("brand_id")
      .eq("shopify_domain", shop)
      .maybeSingle();
    brandId = settings?.brand_id ?? null;

    if (!brandId) {
      const { data: brands } = await supabase.from("brands").select("id").limit(1).maybeSingle();
      brandId = brands?.id ?? null;
    }
  }

  if (!brandId) {
    return NextResponse.json({ error: "No brand found. Create a brand first." }, { status: 400 });
  }

  // Save access token to connections table
  await supabase.from("connections").upsert({
    brand_id: brandId,
    platform: "shopify",
    account_ref: shop,
    access_token,
    status: "connected",
    connected_at: new Date().toISOString(),
  }, { onConflict: "brand_id,platform,account_ref" });

  // Save shopify_domain to brand_settings for webhook resolution
  await supabase.from("brand_settings").upsert({
    brand_id: brandId,
    shopify_domain: shop,
    updated_at: new Date().toISOString(),
  }, { onConflict: "brand_id" });

  // Register all webhooks on the store
  await registerWebhooks(shop, access_token);

  // Clear the state cookie and redirect to dashboard
  const redirectUrl = new URL("/emails-sms", APP_URL);
  redirectUrl.searchParams.set("shopify_connected", "1");
  const res = NextResponse.redirect(redirectUrl.toString());
  res.cookies.delete("shopify_oauth_state");

  return res;
}
