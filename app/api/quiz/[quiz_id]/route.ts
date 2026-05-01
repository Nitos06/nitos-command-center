import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ quiz_id: string }> }) {
  const { quiz_id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: quiz, error: qErr } = await supabase
    .from("quizzes")
    .select("id, title, description, brand_id, is_active, settings")
    .eq("id", quiz_id)
    .single();

  if (qErr || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404, headers: cors });
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question_text, question_type, order_index, quiz_options(id, option_text, image_url, product_tags)")
    .eq("quiz_id", quiz_id)
    .order("order_index", { ascending: true });

  return NextResponse.json(
    { quiz, questions: questions ?? [] },
    { headers: { ...cors, "Cache-Control": "public, max-age=60" } }
  );
}
