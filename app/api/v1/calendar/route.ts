import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, requireScope, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "calendar:read") && !requireScope(auth, "calendar:write")) {
    return forbiddenResponse();
  }

  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const month = searchParams.get("month"); // e.g. "2026-06"

  let query = supabase
    .from("campaign_calendar")
    .select("*, email_campaigns(id, name, status, sent_at)")
    .eq("brand_id", auth.brandId)
    .order("scheduled_date", { ascending: true });

  if (month) {
    const start = `${month}-01`;
    const endDate = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0);
    const end = `${month}-${endDate.getDate().toString().padStart(2, "0")}`;
    query = query.gte("scheduled_date", start).lte("scheduled_date", end);
  } else {
    if (from) query = query.gte("scheduled_date", from);
    if (to) query = query.lte("scheduled_date", to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data });
}

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "calendar:write")) return forbiddenResponse();

  const supabase = sb();
  const body = await req.json();

  // Support bulk creation: { entries: [...] } or single entry
  const entries = body.entries ?? [body];

  const toInsert = entries.map((entry: any) => ({
    brand_id: auth.brandId,
    title: entry.title,
    description: entry.description ?? null,
    scheduled_date: entry.scheduled_date,
    scheduled_time: entry.scheduled_time ?? "10:00:00",
    segment_id: entry.segment_id ?? null,
    status: "planned",
    brief: entry.brief ?? null,
    generated_by: entry.generated_by ?? "ai",
  }));

  const { data, error } = await supabase
    .from("campaign_calendar")
    .insert(toInsert)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data, count: data.length }, { status: 201 });
}
