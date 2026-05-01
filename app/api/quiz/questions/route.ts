import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(req: NextRequest) {
  const quiz_id = req.nextUrl.searchParams.get("quiz_id");
  if (!quiz_id) return NextResponse.json({ error: "quiz_id required" }, { status: 400, headers: cors });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*, quiz_options(*)")
    .eq("quiz_id", quiz_id)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  return NextResponse.json({ questions: data ?? [] }, { headers: cors });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { quiz_id, question_text, question_type = "single_choice", order_index = 0, options = [] } = body;

  if (!quiz_id || !question_text?.trim()) {
    return NextResponse.json({ ok: false, error: "quiz_id and question_text required" }, { status: 400, headers: cors });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: question, error } = await supabase
    .from("quiz_questions")
    .insert({ quiz_id, question_text, question_type, order_index })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: cors });

  if (options.length > 0) {
    const validOptions = options.filter((o: any) => o.text?.trim());
    if (validOptions.length > 0) {
      await supabase.from("quiz_options").insert(
        validOptions.map((o: any, i: number) => ({
          question_id: question.id,
          option_text: o.text,
          image_url: o.image_url || null,
          product_tags: o.product_tags || null,
          order_index: i,
        }))
      );
    }
  }

  return NextResponse.json({ ok: true, question_id: question.id }, { headers: cors });
}
