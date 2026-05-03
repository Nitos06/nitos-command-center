import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const month = searchParams.get("month");

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  let query = supabase
    .from("campaign_calendar")
    .select("*, email_campaigns(id, name, status, sent_at)")
    .eq("brand_id", brandId)
    .order("scheduled_date", { ascending: true });

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const endDay = new Date(y, m, 0).getDate();
    const end = `${month}-${String(endDay).padStart(2, "0")}`;
    query = query.gte("scheduled_date", start).lte("scheduled_date", end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data });
}

export async function POST(req: NextRequest) {
  const supabase = sb();
  const body = await req.json();
  const { brandId, title, description, scheduled_date, scheduled_time, segment_id, brief } = body;

  if (!brandId || !title || !scheduled_date) {
    return NextResponse.json({ error: "brandId, title, and scheduled_date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campaign_calendar")
    .insert({
      brand_id: brandId,
      title,
      description: description ?? null,
      scheduled_date,
      scheduled_time: scheduled_time ?? "10:00:00",
      segment_id: segment_id ?? null,
      brief: brief ?? null,
      status: "planned",
      generated_by: "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entry: data }, { status: 201 });
}
