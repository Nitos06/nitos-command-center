import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("affiliate_outreach")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, name, subject, body, channel } = await req.json();
  if (!brandId || !name || !body) {
    return NextResponse.json({ error: "brandId, name, and body required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("affiliate_outreach")
    .insert({
      brand_id:   brandId,
      name,
      subject:    subject ?? null,
      body,
      channel:    channel ?? "email",
      sent_count: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, template: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, body, subject, increment_sent } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (increment_sent) {
    const { error } = await supabase.rpc("increment_field", {
      table_name: "affiliate_outreach",
      field_name: "sent_count",
      row_id: id,
    });
    // Fallback: manual increment if rpc not available
    if (error) {
      const { data: current } = await supabase
        .from("affiliate_outreach")
        .select("sent_count")
        .eq("id", id)
        .single();
      await supabase
        .from("affiliate_outreach")
        .update({ sent_count: (current?.sent_count ?? 0) + 1 })
        .eq("id", id);
    }
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body !== undefined) updates.body = body;
  if (subject !== undefined) updates.subject = subject;

  const { error } = await supabase.from("affiliate_outreach").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
