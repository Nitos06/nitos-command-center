import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, entity_type, update_mode, file_url, file_name, file_format } = await req.json();
  if (!brandId || !entity_type) {
    return NextResponse.json({ error: "brandId and entity_type required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("bulk_jobs").insert({
    brand_id:    brandId,
    job_type:    "import",
    entity_type,
    update_mode: update_mode ?? "merge",
    file_url:    file_url ?? null,
    file_name:   file_name ?? null,
    file_format: file_format ?? "csv",
    status:      "pending",
    created_at:  new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Queue agent_log for the import agent to pick up
  await supabase.from("agent_logs").insert({
    agent_name: "bulk-import",
    action:     "import_queued",
    details:    { job_id: data.id, entity_type, update_mode, file_url },
    brand_id:   brandId,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, job: data });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data } = await supabase
    .from("bulk_jobs")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ jobs: data ?? [] });
}
