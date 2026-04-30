import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { brandId, url, issue, priority, fixIndex } = body;
  if (!brandId || !issue) return NextResponse.json({ error: "brandId and issue required" }, { status: 400 });

  // Insert as a manual fix request into seo_audits issues or a dedicated table
  const { error } = await supabase.from("agent_logs").insert({
    brand_id: brandId,
    agent_name: "seo",
    type: "manual_fix_request",
    message: `[MANUAL FIX REQUEST] ${priority?.toUpperCase() ?? "MEDIUM"}: ${issue}${url ? ` — URL: ${url}` : ""}${fixIndex != null ? ` (audit fix #${fixIndex})` : ""}`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also queue the seo-audit-autofix routine for next run pickup
  await supabase.from("routine_runs").insert({
    routine_name: "seo-audit-autofix",
    started_at: new Date().toISOString(),
    status: "queued",
    artifacts: { manual_fix: issue, url, priority },
  }).select();

  return NextResponse.json({ ok: true });
}
