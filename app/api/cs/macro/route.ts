import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data } = await supabase.from("cs_macros").select("*").eq("brand_id", brandId).order("usage_count", { ascending: false });
  return NextResponse.json({ macros: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, name, shortcut, body, channel, tags } = await req.json();
  if (!brandId || !name || !body) return NextResponse.json({ error: "brandId, name and body required" }, { status: 400 });

  const { data, error } = await supabase.from("cs_macros").insert({
    brand_id: brandId, name, shortcut: shortcut ?? null, body, channel: channel ?? null,
    tags: tags ?? [], created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, macro: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { macroId } = await req.json();
  const { error } = await supabase.from("cs_macros").delete().eq("id", macroId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
