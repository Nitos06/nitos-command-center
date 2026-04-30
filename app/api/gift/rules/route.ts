import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, product_title, product_id, variant_id, threshold, label, is_active } = body;
    const supabase = createClient();
    const { data: rule, error } = await supabase
      .from("gift_rules")
      .insert({ brand_id: brandId, product_title, product_id, variant_id, threshold, label, is_active })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ rule });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = await req.json();
    const supabase = createClient();
    await supabase.from("gift_rules").update({ is_active }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const supabase = createClient();
    await supabase.from("gift_rules").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
