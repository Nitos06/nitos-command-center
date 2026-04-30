import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    brandId, sender_name, sender_email, reply_to,
    primary_color, footer_text, logo_url, unsubscribe_text,
  } = await req.json();

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { error } = await supabase.from("brand_settings").upsert({
    brand_id:         brandId,
    sender_name,
    ses_sender_email: sender_email,
    reply_to,
    brand_color:      primary_color,
    footer_text,
    logo_url,
    unsubscribe_text,
    updated_at:       new Date().toISOString(),
  }, { onConflict: "brand_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
