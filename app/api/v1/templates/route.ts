import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, requireScope, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "templates:read") && !requireScope(auth, "templates:write")) {
    return forbiddenResponse();
  }

  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query = supabase
    .from("mjml_templates")
    .select("id, name, category, created_at, updated_at")
    .eq("brand_id", auth.brandId)
    .order("updated_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "templates:write")) return forbiddenResponse();

  const supabase = sb();
  const body = await req.json();
  const { name, category, mjml_source } = body;

  if (!name || !mjml_source) {
    return NextResponse.json({ error: "name and mjml_source required" }, { status: 400 });
  }

  // Compile MJML
  let html_compiled: string;
  try {
    const mjml = (await import("mjml")).default;
    const result = mjml(mjml_source, { validationLevel: "soft" });
    html_compiled = result.html;
  } catch (e: any) {
    return NextResponse.json({ error: `MJML compile error: ${e.message}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mjml_templates")
    .upsert(
      {
        brand_id: auth.brandId,
        name,
        category: category ?? "campaign",
        mjml_source,
        html_compiled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_id,name" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ template: data }, { status: 201 });
}
