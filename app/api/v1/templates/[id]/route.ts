import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, requireScope, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();

  const supabase = sb();

  const { data, error } = await supabase
    .from("mjml_templates")
    .select("*")
    .eq("id", id)
    .eq("brand_id", auth.brandId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  return NextResponse.json({ template: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "templates:write")) return forbiddenResponse();

  const supabase = sb();
  const body = await req.json();
  const { name, category, mjml_source } = body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (name) updates.name = name;
  if (category) updates.category = category;

  if (mjml_source) {
    try {
      const mjml = (await import("mjml")).default;
      const result = mjml(mjml_source, { validationLevel: "soft" });
      updates.mjml_source = mjml_source;
      updates.html_compiled = result.html;
    } catch (e: any) {
      return NextResponse.json({ error: `MJML compile error: ${e.message}` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("mjml_templates")
    .update(updates)
    .eq("id", id)
    .eq("brand_id", auth.brandId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ template: data });
}
