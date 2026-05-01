import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brand_id");

  const supabase = createClient();
  let query = supabase.from("gift_rules").select("*").eq("is_active", true).order("created_at");
  if (brandId) query = query.eq("brand_id", brandId);

  const { data: rules } = await query;

  return NextResponse.json({ ok: true, rules: rules ?? [] }, {
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}
