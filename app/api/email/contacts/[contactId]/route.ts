import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const supabase = sb();

  const { data: contact, error } = await supabase
    .from("email_contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // Get segment memberships
  const { data: memberships } = await supabase
    .from("segment_memberships")
    .select("segment_id, joined_at, segments(name)")
    .eq("contact_id", contactId)
    .is("left_at", null);

  // Get recent events
  const { data: events } = await supabase
    .from("contact_events")
    .select("*")
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ contact, segments: memberships ?? [], events: events ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const supabase = sb();
  const body = await req.json();

  const allowedFields = ["name", "subscribed", "tags", "custom_properties"];
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("email_contacts")
    .update(updates)
    .eq("id", contactId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.subscribed === false) {
    await supabase.from("contact_events").insert({
      brand_id: data.brand_id,
      contact_id: contactId,
      email: data.email,
      event_type: "unsubscribed",
    });
  }

  return NextResponse.json({ contact: data });
}
