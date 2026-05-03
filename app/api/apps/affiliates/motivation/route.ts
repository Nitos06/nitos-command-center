import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("affiliate_motivation")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, title, description, type, threshold, reward, icon } = await req.json();
  if (!brandId || !title || !type) {
    return NextResponse.json({ error: "brandId, title, and type required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("affiliate_motivation")
    .insert({
      brand_id:    brandId,
      title,
      description: description ?? null,
      type,
      threshold:   threshold ?? null,
      reward:      reward ?? null,
      icon:        icon ?? null,
      created_at:  new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}
