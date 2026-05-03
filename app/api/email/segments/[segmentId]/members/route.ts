import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ segmentId: string }> }) {
  const { segmentId } = await params;
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  const { data, error, count } = await supabase
    .from("segment_memberships")
    .select("contact_id, joined_at, email_contacts(id, email, name, rfm_score, total_orders, total_spent)", { count: "exact" })
    .eq("segment_id", segmentId)
    .is("left_at", null)
    .order("joined_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ members: data, total: count });
}
