import { PageHeader } from "@/components/page-header";
import { HelpCircle } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import QuizClient from "./quiz-client";

export default async function QuizPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [
    { data: quizzes },
    { data: responses },
  ] = await Promise.all([
    eq(supabase.from("quizzes").select("*, quiz_questions(id)")).order("created_at", { ascending: false }),
    eq(supabase.from("quiz_responses").select("*")).gte("created_at", since30.toISOString()),
  ]);

  const totalResponses = responses?.length ?? 0;
  const withEmail = responses?.filter((r: any) => r.email).length ?? 0;
  const emailCapRate = totalResponses > 0 ? (withEmail / totalResponses) * 100 : 0;
  const withPurchase = responses?.filter((r: any) => r.converted).length ?? 0;
  const convRate = totalResponses > 0 ? (withPurchase / totalResponses) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Quiz"
        subtitle="Product recommendation quizzes — replacing Octane AI / RevenueHunt"
      />
      <QuizClient brandId={brandId ?? ""} quizzes={quizzes ?? []} responses={responses ?? []} />
    </>
  );
}
