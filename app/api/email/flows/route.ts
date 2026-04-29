import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { flowId, isActive, brandId } = await req.json();
  if (!flowId || !brandId) return NextResponse.json({ error: "flowId and brandId required" }, { status: 400 });

  const { error } = await supabase
    .from("email_flows")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", flowId)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
