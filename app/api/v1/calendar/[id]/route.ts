import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, requireScope, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "calendar:write")) return forbiddenResponse();

  const supabase = sb();
  const body = await req.json();

  const allowedFields = ["title", "description", "scheduled_date", "scheduled_time", "segment_id", "status", "brief", "campaign_id"];
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("campaign_calendar")
    .update(updates)
    .eq("id", id)
    .eq("brand_id", auth.brandId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entry: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "calendar:write")) return forbiddenResponse();

  const supabase = sb();

  const { error } = await supabase
    .from("campaign_calendar")
    .delete()
    .eq("id", id)
    .eq("brand_id", auth.brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
