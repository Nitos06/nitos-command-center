import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const eventType = searchParams.get("type");

  let query = supabase
    .from("contact_events")
    .select("*")
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (eventType) query = query.eq("event_type", eventType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data });
}
