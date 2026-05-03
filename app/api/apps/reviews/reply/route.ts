import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, reply, brandId } = await req.json();
  if (!id || !reply || !brandId) {
    return NextResponse.json({ error: "id, reply, and brandId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("reviews")
    .update({ reply, replied_at: new Date().toISOString() })
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
