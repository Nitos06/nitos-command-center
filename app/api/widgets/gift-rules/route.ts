import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brand_id");

  let query = sb()
    .from("gift_rules")
    .select("*")
    .eq("is_active", true)
    .order("created_at");

  if (brandId) query = query.eq("brand_id", brandId);

  const { data: rules } = await query;

  return NextResponse.json({ ok: true, rules: rules ?? [] }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
