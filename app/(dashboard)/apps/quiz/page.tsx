import { createBrandedClient } from "@/lib/supabase/branded-query";
import QuizBuilder from "./quiz-builder";

export default async function QuizPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: quizzes },
    { data: questions },
  ] = await Promise.all([
    eq(supabase.from("quizzes").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("quiz_questions").select("*")).order("position", { ascending: true }),
  ]);

  return (
    <QuizBuilder
      brandId={brandId ?? ""}
      quizzes={quizzes ?? []}
      questions={questions ?? []}
    />
  );
}
