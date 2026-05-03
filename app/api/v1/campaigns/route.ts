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
  if (!requireScope(auth, "campaigns:read") && !requireScope(auth, "campaigns:write")) {
    return forbiddenResponse();
  }

  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") ?? 50);

  let query = supabase
    .from("email_campaigns")
    .select("*")
    .eq("brand_id", auth.brandId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ campaigns: data });
}

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "campaigns:write")) return forbiddenResponse();

  const supabase = sb();
  const body = await req.json();

  const { name, subject, preview_text, segment_id, scheduled_at, mjml_source, html_compiled, calendar_entry_id } = body;

  if (!name || !subject) {
    return NextResponse.json({ error: "name and subject required" }, { status: 400 });
  }

  // Compile MJML if provided and no html_compiled
  let html = html_compiled;
  if (mjml_source && !html) {
    try {
      const mjml = (await import("mjml")).default;
      const result = mjml(mjml_source, { validationLevel: "soft" });
      html = result.html;
    } catch (e: any) {
      return NextResponse.json({ error: `MJML compile error: ${e.message}` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("email_campaigns")
    .insert({
      brand_id: auth.brandId,
      name,
      subject,
      preview_text: preview_text ?? null,
      segment_id: segment_id ?? null,
      scheduled_for: scheduled_at ?? null,
      mjml_source: mjml_source ?? null,
      html_compiled: html ?? null,
      calendar_entry_id: calendar_entry_id ?? null,
      status: scheduled_at ? "scheduled" : "scheduled",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update calendar entry if linked
  if (calendar_entry_id) {
    await supabase
      .from("campaign_calendar")
      .update({ campaign_id: data.id, status: "content_ready", updated_at: new Date().toISOString() })
      .eq("id", calendar_entry_id);
  }

  return NextResponse.json({ campaign: data }, { status: 201 });
}
