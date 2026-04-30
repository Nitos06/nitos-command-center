import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, name, subject, segment_id, scheduled_at, status } = await req.json();
  if (!brandId || !name) return NextResponse.json({ error: "brandId and name required" }, { status: 400 });

  const { data, error } = await supabase.from("email_campaigns").insert({
    brand_id:     brandId,
    name,
    subject:      subject ?? null,
    segment_id:   segment_id ?? null,
    scheduled_at: scheduled_at ?? null,
    status:       status ?? "draft",
    created_at:   new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, campaign: data });
}
