import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, source, reviews } = await req.json();
  if (!brandId || !source || !Array.isArray(reviews) || !reviews.length) {
    return NextResponse.json({ error: "brandId, source, and reviews[] required" }, { status: 400 });
  }

  const rows = reviews.map((r: any) => ({
    brand_id:      brandId,
    source,
    author_name:   r.author_name,
    rating:        r.rating,
    title:         r.title ?? null,
    body:          r.body ?? null,
    product_title: r.product_title ?? null,
    photos:        r.photos ?? null,
    status:        "pending",
    created_at:    r.created_at ?? new Date().toISOString(),
  }));

  const { data, error } = await supabase.from("reviews").insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, imported: data?.length ?? 0 });
}
