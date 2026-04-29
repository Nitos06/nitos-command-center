import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { MousePointerClick } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function CroPage() {
  const { supabase, brandId } = await createBrandedClient();

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: pages, count: pageCount }, { data: tests }, { data: audits }] = await Promise.all([
    eq(supabase.from("cro_pages").select("*", { count: "exact" })).limit(10),
    eq(supabase.from("ab_tests").select("*")).order("started_at", { ascending: false }).limit(10),
    eq(supabase.from("cro_audits").select("*")).order("run_at", { ascending: false }).limit(5),
  ]);

  const running = tests?.filter((t: any) => t.status === "running").length ?? 0;
  const completed = tests?.filter((t: any) => t.status === "completed").length ?? 0;
  const lastAudit = audits?.[0];

  return (
    <>
      <PageHeader title="CRO" subtitle="Landing-page health, A/B tests, funnel leaks" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Pages tracked" value={String(pageCount ?? 0)} />
        <Kpi label="Running tests" value={String(running)} />
        <Kpi label="Completed tests" value={String(completed)} />
        <Kpi label="Latest LP health" value={lastAudit?.overall_score ? String(lastAudit.overall_score) + "/100" : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3">A/B tests</h2>
          {(tests?.length ?? 0) === 0 ? (
            <EmptyState icon={MousePointerClick} title="No tests yet" hint="Create an A/B test once you have a hypothesis." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted">
                <tr><th className="py-2">Name</th><th>Metric</th><th>Status</th><th>Winner</th><th>Lift</th></tr>
              </thead>
              <tbody>
                {tests!.map((t: any) => (
                  <tr key={t.id} className="border-t border-surface-border">
                    <td className="py-2 font-medium text-ink">{t.name}</td>
                    <td className="text-ink-muted">{t.metric ?? "—"}</td>
                    <td><span className={t.status === "running" ? "badge-primary" : t.status === "completed" ? "badge-success" : "badge-warn"}>{t.status}</span></td>
                    <td className="text-ink-muted">{t.winner ?? "—"}</td>
                    <td className="text-ink-muted">{t.uplift_pct ? Number(t.uplift_pct).toFixed(1) + "%" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
