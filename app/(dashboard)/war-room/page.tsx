import { PageHeader } from "@/components/page-header";
import { formatMoney, formatNumber } from "@/lib/utils";
import { Bot, Zap, AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

const AGENT_META: Record<string, { label: string; category: string; schedule: string }> = {
  "meta-ads":           { label: "Meta Ads",           category: "Ads",      schedule: "Daily 09:00" },
  "ads-multi-platform": { label: "Multi-Platform Ads", category: "Ads",      schedule: "Daily 09:00" },
  "ads-competitor":     { label: "Competitor Intel",   category: "Ads",      schedule: "Sun 04:00"   },
  "hook-mining":        { label: "Hook Mining",         category: "Ads",      schedule: "Daily 11:00" },
  "seo":                { label: "SEO",                 category: "SEO",      schedule: "Every 5d + 4×/wk" },
  "email-marketing":    { label: "Email Marketing",    category: "Email",    schedule: "Mon 07:00"   },
  "social-instagram":   { label: "Instagram",          category: "Social",   schedule: "Daily 08:00" },
  "social-tiktok":      { label: "TikTok",             category: "Social",   schedule: "Daily 10:00" },
  "social-youtube":     { label: "YouTube",            category: "Social",   schedule: "Daily 11:00" },
  "social-pinterest":   { label: "Pinterest",          category: "Social",   schedule: "Daily 12:00" },
  "dm-funnel":          { label: "DM Funnel",          category: "Social",   schedule: "Nightly 01:00" },
  "customer-service":   { label: "Customer Service",   category: "CS",       schedule: "Every 30min" },
  "analytics":          { label: "Analytics",          category: "Ops",      schedule: "Daily 07:00" },
  "advisory":           { label: "Advisory",           category: "Ops",      schedule: "Sun 08:00"   },
  "finance-il":         { label: "Finance (IL)",       category: "Ops",      schedule: "Daily 04:00" },
  "dashboard-bridge":   { label: "Dashboard Bridge",   category: "System",   schedule: "Every 5 min" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Ads:    "bg-sky-50 text-sky-700",
  SEO:    "bg-green-50 text-green-700",
  Email:  "bg-amber-50 text-amber-700",
  Social: "bg-pink-50 text-pink-700",
  CS:     "bg-purple-50 text-purple-700",
  Ops:    "bg-slate-100 text-slate-600",
  System: "bg-gray-100 text-gray-500",
};

const LOG_TYPE_STYLE: Record<string, { dot: string; label: string }> = {
  start:    { dot: "bg-primary-400",  label: "Started"  },
  action:   { dot: "bg-green-400",    label: "Action"   },
  decision: { dot: "bg-amber-400",    label: "Decision" },
  result:   { dot: "bg-sky-400",      label: "Result"   },
  error:    { dot: "bg-red-400",      label: "Error"    },
  complete: { dot: "bg-green-500",    label: "Done"     },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "failed")  return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (status === "running") return <Zap className="w-4 h-4 text-primary-500" />;
  if (status === "partial") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <Clock className="w-4 h-4 text-ink-muted" />;
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    success: "badge-success",
    failed:  "badge-crit",
    partial: "badge-warn",
    running: "badge-primary",
  };
  return <span className={cls[status] ?? "badge-primary"}>{status}</span>;
}

export default async function WarRoomPage() {
  const { supabase, brandId } = await createBrandedClient();

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: runs }, { data: logs }, { data: alerts }, { data: profit }] = await Promise.all([
    eq(supabase
      .from("agent_runs")
      .select("*"))
      .order("started_at", { ascending: false })
      .limit(100),
    eq(supabase
      .from("agent_logs")
      .select("*"))
      .order("created_at", { ascending: false })
      .limit(80),
    eq(supabase
      .from("alerts")
      .select("*"))
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(10),
    eq(supabase
      .from("v_daily_profit")
      .select("net_revenue,ad_spend,net_profit"))
      .gte("date", new Date(Date.now() - 86_400_000).toISOString().slice(0, 10))
      .limit(1)
      .maybeSingle(),
  ]);

  // Latest run per agent
  const latestRun: Record<string, any> = {};
  for (const r of runs ?? []) {
    if (!latestRun[r.agent_name]) latestRun[r.agent_name] = r;
  }

  const knownNames   = Object.keys(AGENT_META);
  const allRunNames = (runs ?? []).map((r: any) => String(r.agent_name));
  const unknownNames = allRunNames.filter((n: string) => !knownNames.includes(n));
  const allAgents: string[] = [...knownNames, ...Array.from(new Set<string>(unknownNames))];

  const runningCount = Object.values(latestRun).filter((r: any) => r.status === "running").length;
  const failedCount  = Object.values(latestRun).filter((r: any) => r.status === "failed").length;
  const totalCost    = (runs ?? []).reduce((s: number, r: any) => s + Number(r.cost_usd ?? 0), 0);

  return (
    <>
      <PageHeader
        title="War Room"
        subtitle="Live feed from every agent running your business"
      />

      {/* Top bar — revenue pulse + agent health */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="card lg:col-span-2">
          <div className="text-xs text-ink-muted mb-1">Today — Revenue / Spend / Profit</div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-xl font-bold text-ink">{formatMoney(profit?.net_revenue)}</span>
            <span className="text-sm text-red-500">-{formatMoney(profit?.ad_spend)}</span>
            <span className="text-sm font-semibold text-green-600">{formatMoney(profit?.net_profit)}</span>
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-ink-muted mb-1">Total agents</div>
          <div className="text-2xl font-bold text-ink">{allAgents.length}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-ink-muted mb-1">Running now</div>
          <div className={`text-2xl font-bold ${runningCount > 0 ? "text-primary-600" : "text-ink"}`}>{runningCount}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-ink-muted mb-1">Failed</div>
          <div className={`text-2xl font-bold ${failedCount > 0 ? "text-red-600" : "text-ink"}`}>{failedCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* LEFT: Agent cards */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="font-semibold text-ink">Agents</h2>
          {allAgents.map((name) => {
            const meta  = AGENT_META[name];
            const run   = latestRun[name];
            const label = meta?.label ?? name;
            const cat   = meta?.category ?? "System";
            const catCls = CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-500";

            return (
              <div key={name} className="card border border-surface-border">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon status={run?.status ?? "idle"} />
                    <div className="min-w-0">
                      <div className="font-medium text-ink text-sm truncate">{label}</div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${catCls}`}>{cat}</span>
                    </div>
                  </div>
                  {run ? <StatusBadge status={run.status} /> : <span className="text-xs text-ink-subtle">idle</span>}
                </div>

                {run ? (
                  <div className="space-y-1">
                    {run.headline && <p className="text-xs text-ink line-clamp-2">{run.headline}</p>}
                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-0.5">
                      <span>{timeAgo(run.started_at)}</span>
                      <span>
                        {run.cost_usd ? `$${Number(run.cost_usd).toFixed(3)}` : ""}
                        {run.tokens_used ? ` · ${formatNumber(run.tokens_used)} tok` : ""}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-muted">{meta?.schedule ?? "—"}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Live feed + Alerts */}
        <div className="xl:col-span-2 space-y-5">

          {/* Alerts */}
          {(alerts?.length ?? 0) > 0 && (
            <div className="card border border-red-200 bg-red-50">
              <h2 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Needs your attention ({alerts!.length})
              </h2>
              <ul className="space-y-2">
                {alerts!.map((a: any) => (
                  <li key={a.id} className="bg-white rounded-xl px-3 py-2 border border-red-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink text-sm">{a.title}</span>
                      <span className={a.severity === "crit" ? "badge-crit" : "badge-warn"}>{a.severity}</span>
                    </div>
                    {a.message && <p className="text-xs text-ink-muted mt-0.5">{a.message}</p>}
                    <p className="text-[11px] text-ink-subtle mt-1">{timeAgo(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Live activity feed */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-600" />
              Live activity feed
            </h2>

            {(logs?.length ?? 0) === 0 ? (
              <div className="text-center py-12 text-ink-muted">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No agent activity yet.</p>
                <p className="text-xs mt-1">Agents will report here as they run.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {(logs ?? []).map((log: any, i: number) => {
                  const style  = LOG_TYPE_STYLE[log.type] ?? { dot: "bg-gray-300", label: log.type };
                  const aLabel = AGENT_META[log.agent_name]?.label ?? log.agent_name;
                  const isLast = i === (logs ?? []).length - 1;

                  return (
                    <div key={log.id} className="flex gap-3">
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center w-5 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${style.dot}`} />
                        {!isLast && <div className="w-px flex-1 bg-surface-border mt-1" />}
                      </div>

                      {/* Content */}
                      <div className={`pb-4 min-w-0 flex-1 ${isLast ? "" : ""}`}>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-ink">{aLabel}</span>
                          <span className="text-[10px] text-ink-muted bg-surface-border px-1.5 py-0.5 rounded-full">{style.label}</span>
                          <span className="text-[11px] text-ink-subtle ml-auto">{timeAgo(log.created_at)}</span>
                        </div>
                        <p className="text-sm text-ink leading-snug">{log.message}</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(log.details).slice(0, 5).map(([k, v]) => (
                              <span key={k} className="text-[11px] text-ink-muted bg-primary-50 px-2 py-0.5 rounded-full">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per-run history table */}
          {(runs?.length ?? 0) > 0 && (
            <div className="card">
              <h2 className="font-semibold text-ink mb-3">Run history</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-ink-muted text-xs">
                    <tr>
                      <th className="py-2 pr-4">Agent</th>
                      <th className="pr-4">When</th>
                      <th className="pr-4">Status</th>
                      <th className="pr-4">Cost</th>
                      <th>Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(runs ?? []).slice(0, 30).map((r: any) => (
                      <tr key={r.id} className="border-t border-surface-border">
                        <td className="py-2 pr-4 font-medium text-ink">
                          {AGENT_META[r.agent_name]?.label ?? r.agent_name}
                        </td>
                        <td className="pr-4 text-ink-muted text-xs whitespace-nowrap">{timeAgo(r.started_at)}</td>
                        <td className="pr-4"><StatusBadge status={r.status} /></td>
                        <td className="pr-4 text-ink-muted text-xs">
                          {r.cost_usd ? `$${Number(r.cost_usd).toFixed(3)}` : "—"}
                        </td>
                        <td className="text-ink-muted text-xs">
                          {r.tokens_used ? formatNumber(r.tokens_used) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
