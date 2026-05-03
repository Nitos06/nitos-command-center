import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateApiKey } from "@/lib/api-auth";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, key_prefix, name, scopes, last_used_at, created_at, expires_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ keys: data });
}

export async function POST(req: NextRequest) {
  const supabase = sb();
  const body = await req.json();
  const { brandId, name, scopes } = body;

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { token, hash, prefix } = generateApiKey();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      brand_id: brandId,
      key_hash: hash,
      key_prefix: prefix,
      name: name ?? "default",
      scopes: scopes ?? ["campaigns:write", "calendar:write", "templates:write", "flows:read", "*"],
    })
    .select("id, key_prefix, name, scopes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the full token only once — it cannot be retrieved again
  return NextResponse.json({ key: { ...data, token } }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("keyId");
  const brandId = searchParams.get("brandId");

  if (!keyId || !brandId) return NextResponse.json({ error: "keyId and brandId required" }, { status: 400 });

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
