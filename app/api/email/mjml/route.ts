import { NextRequest, NextResponse } from "next/server";
import mjml2html from "mjml";
import { createClient } from "@/lib/supabase/server";

// ─── GET: fetch saved templates ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brand_id = searchParams.get("brand_id");
  const category = searchParams.get("category");

  let query = supabase
    .from("mjml_templates")
    .select("id, name, category, mjml_source, preview_html, brand_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (brand_id) query = query.eq("brand_id", brand_id);
  if (category && category !== "all") query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ templates: data ?? [] });
}

// ─── POST: compile MJML or save template ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Save template mode
  if (body.save === true) {
    const { name, category, mjml_source, brand_id } = body;
    if (!name || !mjml_source) {
      return NextResponse.json({ error: "name and mjml_source are required" }, { status: 400 });
    }

    // Compile to HTML for preview storage
    let preview_html: string | null = null;
    try {
      const result = mjml2html(mjml_source, { validationLevel: "soft" });
      preview_html = result.html;
    } catch {
      // preview generation failure is non-fatal
    }

    const { data, error } = await supabase
      .from("mjml_templates")
      .upsert(
        {
          name,
          category: category ?? "campaign",
          mjml_source,
          preview_html,
          brand_id: brand_id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name,brand_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, template: data });
  }

  // Compile MJML mode
  const { mjml } = body;
  if (!mjml || typeof mjml !== "string") {
    return NextResponse.json({ error: "mjml string is required" }, { status: 400 });
  }

  try {
    const result = mjml2html(mjml, { validationLevel: "soft" });
    return NextResponse.json({ html: result.html, errors: result.errors ?? [] });
  } catch (err: any) {
    return NextResponse.json({ html: "", errors: [{ message: err.message }] }, { status: 200 });
  }
}
