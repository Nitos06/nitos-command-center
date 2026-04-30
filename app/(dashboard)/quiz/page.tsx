import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatPct } from "@/lib/utils";
import { HelpCircle, CheckCircle2 } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

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
        action={
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            New quiz
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Active quizzes" value={String(quizzes?.filter((q: any) => q.is_active).length ?? 0)} />
        <Kpi label="Responses (30d)" value={String(totalResponses)} />
        <Kpi label="Email capture rate" value={formatPct(emailCapRate)} hint="Emails collected / completions" />
        <Kpi label="Purchase conversion" value={formatPct(convRate)} />
      </div>

      {(quizzes?.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={HelpCircle}
            title="No quizzes yet"
            hint="Build a product recommendation quiz — captures email before showing results, tags Shopify customers, triggers personalized follow-up flows."
          />
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {["Skin type quiz", "Goals & needs quiz", "Product finder quiz"].map((example) => (
              <div key={example} className="p-3 rounded-xl bg-surface-tint border border-surface-border text-sm">
                <div className="font-medium text-ink">{example}</div>
                <div className="text-xs text-ink-muted mt-1">5–8 questions · email gate · product match</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes!.map((quiz: any) => {
            const quizResponses = responses?.filter((r: any) => r.quiz_id === quiz.id) ?? [];
            const quizEmails = quizResponses.filter((r: any) => r.email).length;
            const quizConv = quizResponses.filter((r: any) => r.converted).length;

            return (
              <div key={quiz.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-ink">{quiz.title}</div>
                    <div className="text-xs text-ink-muted">{quiz.quiz_questions?.length ?? 0} questions</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-ink">{quizResponses.length} responses</div>
                      <div className="text-ink-muted">{quizEmails} emails · {quizConv} purchases</div>
                    </div>
                    <span className={quiz.is_active ? "badge-success" : "badge-warn"}>{quiz.is_active ? "active" : "draft"}</span>
                  </div>
                </div>
                {quiz.embed_url && (
                  <div className="text-xs text-ink-subtle font-mono bg-surface-tint rounded px-2 py-1 truncate">
                    {quiz.embed_url}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
