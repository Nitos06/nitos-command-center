import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, brandId } = await req.json();
  if (!id || !action || !brandId) {
    return NextResponse.json({ error: "id, action, and brandId required" }, { status: 400 });
  }

  if (action === "approve" || action === "reject") {
    const status = action === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("brand_id", brandId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status });
  }

  if (action === "reward" || action === "share") {
    const eventType = action === "reward" ? "review_reward" : "review_share";
    const { error } = await supabase.from("app_events").insert({
      brand_id:   brandId,
      event_type: eventType,
      ref_id:     id,
      payload:    { review_id: id },
      processed:  false,
      created_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, event: eventType });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
