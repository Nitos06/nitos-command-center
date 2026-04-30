import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, ...config } = await req.json();
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { error } = await supabase.from("cart_drawer_config").upsert({
    brand_id: brandId, ...config, updated_at: new Date().toISOString(),
  }, { onConflict: "brand_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data } = await supabase.from("cart_drawer_config").select("*").eq("brand_id", brandId).maybeSingle();
  return NextResponse.json({ config: data });
}
