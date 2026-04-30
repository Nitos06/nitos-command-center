import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const { data } = await supabase.from("review_qa").select("*").eq("brand_id", brandId).order("created_at", { ascending: false });
  return NextResponse.json({ qa: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, questionId, answer } = await req.json();

  if (questionId && answer) {
    // Answering existing question
    const { error } = await supabase.from("review_qa")
      .update({ answer, answered_at: new Date().toISOString(), is_published: true })
      .eq("id", questionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Creating a new Q&A entry (from customer)
  const { product_id, question, asked_by, asked_email } = await req.json().catch(() => ({}));
  const { data, error } = await supabase.from("review_qa").insert({
    brand_id:   brandId,
    product_id: product_id ?? null,
    question,
    asked_by:   asked_by ?? null,
    asked_email:asked_email ?? null,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, qa: data });
}
