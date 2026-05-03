import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const search = searchParams.get("search");
  const source = searchParams.get("source");
  const subscribed = searchParams.get("subscribed");
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  let query = supabase
    .from("email_contacts")
    .select("*", { count: "exact" })
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }
  if (source) query = query.eq("source", source);
  if (subscribed === "true") query = query.eq("subscribed", true);
  if (subscribed === "false") query = query.eq("subscribed", false);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contacts: data, total: count });
}

export async function POST(req: NextRequest) {
  const supabase = sb();
  const body = await req.json();
  const { brandId, email, name, source, tags, custom_properties } = body;

  if (!brandId || !email) {
    return NextResponse.json({ error: "brandId and email required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_contacts")
    .upsert(
      {
        brand_id: brandId,
        email: email.toLowerCase().trim(),
        name: name ?? null,
        source: source ?? "manual",
        tags: tags ?? [],
        custom_properties: custom_properties ?? {},
        subscribed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_id,email" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log event
  await supabase.from("contact_events").insert({
    brand_id: brandId,
    contact_id: data.id,
    email: data.email,
    event_type: "subscribed",
    event_data: { source: source ?? "manual" },
  });

  return NextResponse.json({ contact: data }, { status: 201 });
}
