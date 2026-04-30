import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, source, file_url, api_key } = await req.json();
  if (!brandId || !source) return NextResponse.json({ error: "brandId and source required" }, { status: 400 });

  const { data, error } = await supabase.from("review_imports").insert({
    brand_id:   brandId,
    source,
    file_url:   file_url ?? null,
    status:     "pending",
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Queue for reviews agent to process
  await supabase.from("agent_logs").insert({
    agent_name: "reviews",
    action:     "import_queued",
    details:    { import_id: data.id, source, file_url, api_key: api_key ? "[provided]" : null },
    brand_id:   brandId,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, import: data });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data } = await supabase.from("review_imports").select("*").eq("brand_id", brandId).order("created_at", { ascending: false });
  return NextResponse.json({ imports: data ?? [] });
}
