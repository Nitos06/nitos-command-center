import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("brand_id", brandId)
    .eq("app_name", "bulk-editor")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, config } = await req.json();
  if (!brandId || !config) return NextResponse.json({ error: "brandId and config required" }, { status: 400 });

  const { data, error } = await supabase
    .from("app_settings")
    .upsert(
      { brand_id: brandId, app_name: "bulk-editor", config, updated_at: new Date().toISOString() },
      { onConflict: "brand_id,app_name" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, settings: data });
}
