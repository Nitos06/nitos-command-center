import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { code, brand_id, page, referrer } = await req.json();
    if (!code) return NextResponse.json({ ok: false });

    const supabase = createClient();

    // Find affiliate by code
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, brand_id")
      .eq("code", code)
      .maybeSingle();

    if (!affiliate) return NextResponse.json({ ok: false, error: "Affiliate not found" });

    // Record click
    await supabase.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      brand_id: brand_id || affiliate.brand_id,
      ip: req.headers.get("x-forwarded-for") || "",
      user_agent: req.headers.get("user-agent") || "",
      clicked_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" }
  });
}
