import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, entity_type, format, fields, schedule, filter } = await req.json();
  if (!brandId || !entity_type) {
    return NextResponse.json({ error: "brandId and entity_type required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("bulk_jobs").insert({
    brand_id:    brandId,
    job_type:    "export",
    entity_type,
    file_format: format ?? "csv",
    update_mode: "ignore",
    status:      "pending",
    created_at:  new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("agent_logs").insert({
    agent_name: "bulk-export",
    action:     "export_queued",
    details:    { job_id: data.id, entity_type, format, fields, schedule, filter },
    brand_id:   brandId,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, job: data });
}
