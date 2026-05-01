import { createClient } from "@/lib/supabase/client";
import QuizEmbedWidget from "./quiz-embed-widget";

interface Props {
  params: Promise<{ quiz_id: string }>;
  searchParams: Promise<{ brand_id?: string }>;
}

export default async function QuizEmbedPage({ params, searchParams }: Props) {
  const { quiz_id } = await params;
  const { brand_id = "" } = await searchParams;
  const supabase = createClient();

  // Fetch quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quiz_id)
    .single();

  // Fetch questions with options
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*, quiz_options(*)")
    .eq("quiz_id", quiz_id)
    .order("order_index", { ascending: true });

  if (!quiz) {
    return (
      <div style={{ textAlign: "center", padding: 40, fontFamily: "system-ui" }}>
        <p style={{ color: "#6b7280" }}>Quiz not found.</p>
      </div>
    );
  }

  return (
    <QuizEmbedWidget
      quiz={quiz}
      questions={questions ?? []}
      brandId={brand_id}
    />
  );
}
