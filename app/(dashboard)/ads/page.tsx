import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { Megaphone, Zap, Target, Bot, TrendingUp } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

const PIPELINE_STAGES = ["concept", "generated", "approved", "testing", "winner", "killed"] as const;

export default async function AdsPage() {
  const { supabase, brandId } = await createBrandedClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: campaigns },
    { data: spend },
    { data: creatives },
    { data: killLog },
    { data: hookPatterns },
    { data: agentDecisions },
  ] = await Promise.all([
    eq(supabase.from("v_campaign_performance").select("*")).order("total_spend", { ascending: false }).limit(10),
    eq(supabase.from("v_daily_ad_spend").select("*")).gte("date", sinceIso),
    eq(supabase.from("creatives").select("*")).order("created_at", { ascending: false }).limit(20),
    supabase.from("kill_scale_log").select("*").order("at", { ascending: false }).limit(8),
    eq(supabase.from("hook_patterns").select("*")).order("avg_score", { ascending: false }).limit(8),
    eq(supabase.from("agent_decisions").select("*")).order("created_at", { ascending: false }).limit(10),
  ]);

  const agg = (spend ?? []).reduce(
    (a: any, r: any) => ({
      spend: a.spend + Number(r.total_ad_spend ?? 0),
      revenue: a.revenue + Number(r.platform_attributed_revenue ?? 0),
      clicks: a.clicks + Number(r.clicks ?? 0),
      conversions: a.conversions + Number(r.conversions ?? 0),
    }),
    { spend: 0, revenue: 0, clicks: 0, conversions: 0 }
  );
  const roas = agg.spend > 0 ? agg.revenue / agg.spend : null;
  const cpa = agg.conversions > 0 ? agg.spend / agg.conversions : null;

  // Group creatives by pipeline stage
  const byStage = (creatives ?? []).reduce((acc: Record<string, any[]>, c: any) => {
    const stage = c.status ?? "concept";
    acc[stage] = [...(acc[stage] ?? []), c];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      <PageHeader title="Ads" subtitle="Meta · All paid platforms · 30 days · Gemini hook analysis" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Ad spend (30d)" value={formatMoney(agg.spend)} />
        <Kpi label="Attributed revenue" value={formatMoney(agg.revenue)} hint="Per-platform attribution" />
        <Kpi label="ROAS" value={roas ? roas.toFixed(2) + "×" : "—"} />
        <Kpi label="CPA" value={cpa ? formatMoney(cpa) : "—"} />
      </div>

      {/* Creative pipeline */}
      <div className="card mb-4">
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Creative lab pipeline
        </h2>
        {(creatives?.length ?? 0) === 0 ? (
          <EmptyState icon={Zap} title="No creatives yet" hint="The hook-mining agent generates concepts from competitor analysis and pushes them here." />
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {PIPELINE_STAGES.map((stage) => {
              const items = byStage[stage] ?? [];
              const stageColor = stage === "winner" ? "bg-green-50 border-green-200" : stage === "killed" ? "bg-red-50 border-red-200" : stage === "testing" ? "bg-amber-50 border-amber-200" : "bg-surface-tint border-surface-border";
              return (
                <div key={stage}>
                  <div className="text-xs font-semibold text-ink-muted capitalize mb-1.5 flex items-center justify-between">
                    <span>{stage}</span>
                    <span className="w-5 h-5 rounded-full bg-surface-tint text-ink text-[10px] flex items-center justify-center font-bold">{items.length}</span>
                  </div>
                  <div className="space-y-1.5 min-h-[60px]">
                    {items.slice(0, 4).map((c: any) => (
                      <div key={c.id} className={`px-2 py-1.5 rounded-lg border text-xs ${stageColor}`}>
                        <div className="font-medium text-ink truncate">{c.concept || "Untitled"}</div>
                        <div className="text-ink-muted text-[10px]">{c.type} · {c.format_tag ?? "?"}</div>
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div className="text-[10px] text-ink-muted px-2">+{items.length - 4} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Hook patterns (Gemini-analyzed) */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Hook patterns
          </h2>
          {(hookPatterns?.length ?? 0) === 0 ? (
            <EmptyState icon={TrendingUp} title="No hook data yet" hint="Hook-mining agent analyzes competitor videos with Gemini and surfaces winning patterns." />
          ) : (
            <ul className="space-y-2">
              {hookPatterns!.map((h: any) => (
                <li key={h.id} className="px-3 py-2 rounded-xl bg-surface-tint border border-surface-border">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-ink text-xs capitalize">{h.hook_type}</div>
                    <div className="text-xs font-semibold text-primary-600">{h.avg_score?.toFixed(1) ?? "—"}/10</div>
                  </div>
                  <div className="text-ink-muted text-xs mt-0.5">{h.pattern ?? h.description}</div>
                  <div className="text-ink-subtle text-[10px] mt-0.5">
                    {h.emotion && <span className="mr-2">🎯 {h.emotion}</span>}
                    {h.usage_count != null && <span>{h.usage_count} uses</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agent decisions */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            Agent decisions
          </h2>
          {(agentDecisions?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No decisions logged yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {agentDecisions!.map((d: any) => (
                <li key={d.id} className="text-xs border-l-2 border-primary-200 pl-2">
                  <div className="text-ink-muted">
                    {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    <span className={d.action === "kill" ? "text-red-500" : d.action === "scale" ? "text-green-600" : "text-primary-600"}>
                      {d.action}
                    </span>
                  </div>
                  <div className="text-ink leading-snug mt-0.5">{d.reason ?? d.rationale}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Kill / Scale log */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            Kill / Scale log
          </h2>
          {(killLog?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No actions logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {killLog!.map((k: any) => (
                <li key={k.id} className="px-3 py-2 rounded-xl border border-surface-border">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${k.action === "kill" ? "text-red-500" : "text-green-600"}`}>
                      {k.action?.toUpperCase()}
                    </span>
                    <span className="text-xs text-ink-muted">{new Date(k.at).toLocaleDateString()}</span>
                  </div>
                  {k.reason && <div className="text-xs text-ink-muted mt-1">{k.reason}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top campaigns */}
      <div className="card">
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Top campaigns (30d)
        </h2>
        {(campaigns?.length ?? 0) === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" hint="Connect Meta Ads in Settings → Connections, then data flows here automatically." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted text-xs">
              <tr>
                <th className="py-1.5">Campaign</th><th>Platform</th><th>Phase</th><th>Spend</th><th>Revenue</th><th>ROAS</th><th>CPA</th>
              </tr>
            </thead>
            <tbody>
              {campaigns!.map((c: any) => (
                <tr key={c.campaign_id} className="border-t border-surface-border">
                  <td className="py-1.5 font-medium text-ink text-xs">{c.name}</td>
                  <td className="text-ink-muted text-xs">{c.platform}</td>
                  <td><span className="badge-primary">{c.phase}</span></td>
                  <td className="text-ink-muted text-xs">{formatMoney(c.total_spend)}</td>
                  <td className="text-ink-muted text-xs">{formatMoney(c.total_revenue)}</td>
                  <td className="text-xs font-semibold">{c.roas ? Number(c.roas).toFixed(2) + "×" : "—"}</td>
                  <td className="text-ink-muted text-xs">{c.avg_cpa ? formatMoney(c.avg_cpa) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
