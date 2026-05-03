import { createBrandedClient } from "@/lib/supabase/branded-query";
import QuizAnalytics from "./quiz-analytics";

export default async function AnalyticsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { data: quizzes },
    { data: responses },
  ] = await Promise.all([
    eq(supabase.from("quizzes").select("id,name")).order("created_at", { ascending: false }),
    eq(supabase.from("quiz_responses").select("*")).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }),
  ]);

  return (
    <QuizAnalytics
      brandId={brandId ?? ""}
      quizzes={quizzes ?? []}
      responses={responses ?? []}
    />
  );
}
