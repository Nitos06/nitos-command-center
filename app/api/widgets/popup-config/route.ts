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

  if (!brandId) {
    return NextResponse.json({ ok: false, config: null }, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    });
  }

  const { data: config } = await sb()
    .from("popup_configs")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();

  // Return defaults if no config yet (so the widget can still show)
  const result = config ?? {
    is_active: false,
    headline: "Get 10% off your first order",
    subtext: "Join our list for exclusive deals.",
    style: "popup",
    delay_seconds: 8,
    cooldown_days: 7,
    bg_color: "#ffffff",
    accent_color: "#6366f1",
    show_name_field: true,
    button_text: "Subscribe & save",
  };

  return NextResponse.json({ ok: true, config: result }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}

// ── CRUD for dashboard ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand_id, ...fields } = body;
    if (!brand_id) return NextResponse.json({ ok: false, error: "brand_id required" }, { status: 400 });

    const { data, error } = await sb()
      .from("popup_configs")
      .upsert({ brand_id, ...fields, updated_at: new Date().toISOString() }, { onConflict: "brand_id" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, config: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
