import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { project_name, niche, client_name, brand_id } = body;

  const { data: build, error } = await supabase
    .from("builds")
    .insert({
      brand_id: brand_id ?? null,
      project_name: project_name ?? "New Brand",
      niche: niche ?? null,
      client_name: client_name ?? null,
      stage: "market-research",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("agent_logs").insert({
    brand_id: brand_id ?? null,
    agent_name: "brand-creator",
    type: "action",
    message: `Build started: "${project_name ?? "New Brand"}" · Stage: market-research`,
  });

  return NextResponse.json({ ok: true, buildId: build.id }, { status: 201 });
}
