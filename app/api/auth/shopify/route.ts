import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Step 1: Redirect merchant to Shopify OAuth consent screen
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const brandId = searchParams.get("brandId");

  if (!shop) {
    return NextResponse.json({ error: "shop parameter required" }, { status: 400 });
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID!;
  const scopes = [
    "read_orders", "write_orders",
    "read_products",
    "read_checkouts", "write_checkouts",
    "read_customers", "write_customers",
    "read_marketing_events", "write_marketing_events",
  ].join(",");

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  // Encode brandId in state so we can retrieve it after callback
  const statePayload = Buffer.from(JSON.stringify({ nonce: state, brandId })).toString("base64url");

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", statePayload);

  const res = NextResponse.redirect(authUrl.toString());
  // Store state in cookie so callback can verify it
  res.cookies.set("shopify_oauth_state", statePayload, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
