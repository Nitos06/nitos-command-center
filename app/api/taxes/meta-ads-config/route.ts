import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { brandId, adAccountId, accessToken, pixelId } = await req.json();
    const supabase = createClient();
    await supabase.from("brand_settings").upsert({
      brand_id: brandId,
      meta_ad_account_id: adAccountId,
      meta_access_token: accessToken,
      meta_pixel_id: pixelId,
    }, { onConflict: "brand_id" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
