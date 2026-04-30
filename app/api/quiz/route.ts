import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, title, description, email_gate, email_gate_pos, cta_text, result_type, questions } = await req.json();
  if (!brandId || !title) return NextResponse.json({ error: "brandId and title required" }, { status: 400 });

  const { data: quiz, error } = await supabase.from("quizzes").insert({
    brand_id:       brandId,
    title,
    description:    description ?? null,
    email_gate:     email_gate ?? true,
    email_gate_pos: email_gate_pos ?? "before_results",
    cta_text:       cta_text ?? "See your results",
    result_type:    result_type ?? "product",
    is_active:      false,
    total_starts:   0,
    total_completions: 0,
    created_at:     new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (questions?.length && quiz) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: question } = await supabase.from("quiz_questions").insert({
        quiz_id:       quiz.id,
        brand_id:      brandId,
        question_text: q.question_text ?? q.text,
        question_type: q.question_type ?? "single",
        sort_order:    i,
        required:      true,
      }).select().single();

      if (question && q.options?.length) {
        await supabase.from("quiz_options").insert(
          q.options.map((o: any, j: number) => ({
            question_id: question.id,
            option_text: o.text ?? o,
            sort_order:  j,
          }))
        );
      }
    }
  }

  return NextResponse.json({ ok: true, quiz });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId, ...updates } = await req.json();
  const { error } = await supabase.from("quizzes").update(updates).eq("id", quizId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await req.json();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
