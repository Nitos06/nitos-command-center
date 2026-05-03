import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ApiAuthResult {
  brandId: string;
  scopes: string[];
  keyId: string;
}

export async function validateApiKey(req: NextRequest): Promise<ApiAuthResult | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  if (!token.startsWith("ek_")) return null;

  const keyHash = createHash("sha256").update(token).digest("hex");
  const supabase = sb();

  const { data: key } = await supabase
    .from("api_keys")
    .select("id, brand_id, scopes, expires_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!key) return null;

  if (key.expires_at && new Date(key.expires_at) < new Date()) return null;

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return {
    brandId: key.brand_id,
    scopes: key.scopes ?? [],
    keyId: key.id,
  };
}

export function requireScope(auth: ApiAuthResult, scope: string): boolean {
  return auth.scopes.includes(scope) || auth.scopes.includes("*");
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Insufficient permissions") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function generateApiKey(): { token: string; hash: string; prefix: string } {
  const random = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join("");
  const token = `ek_live_${random}`;
  const hash = createHash("sha256").update(token).digest("hex");
  const prefix = token.slice(0, 12);
  return { token, hash, prefix };
}
