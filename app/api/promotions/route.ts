import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(req: NextRequest) {
  const brand_id = req.nextUrl.searchParams.get("brand_id");
  if (!brand_id) return NextResponse.json({ promotions: [] }, { headers: cors });

  const { data, error } = await sb()
    .from("promotions")
    .select("*")
    .eq("brand_id", brand_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ promotions: data ?? [] }, { headers: cors });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { brand_id, name, type = "free_gift", threshold, reward_product_id, reward_product_title, is_active = true } = body;

  if (!brand_id) return NextResponse.json({ ok: false, error: "brand_id required" }, { status: 400, headers: cors });
  if (!threshold) return NextResponse.json({ ok: false, error: "threshold required" }, { status: 400, headers: cors });
  if (!name?.trim()) return NextResponse.json({ ok: false, error: "name required" }, { status: 400, headers: cors });

  const { data, error } = await sb()
    .from("promotions")
    .insert({
      brand_id,
      name,
      type,
      trigger_rules: { min_cart_total: parseFloat(threshold) },
      reward_product_id: reward_product_id || reward_product_title || null,
      is_active,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ ok: true, promotion_id: data.id }, { headers: cors });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, threshold, ...rest } = body;
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400, headers: cors });

  const updates: any = { ...rest };
  if (threshold) updates.trigger_rules = { min_cart_total: parseFloat(threshold) };

  const { error } = await sb().from("promotions").update(updates).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ ok: true }, { headers: cors });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400, headers: cors });

  const { error } = await sb().from("promotions").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ ok: true }, { headers: cors });
}
