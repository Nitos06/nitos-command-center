import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { formatMoney, formatNumber } from "@/lib/utils";
import { Bot, Activity } from "lucide-react";

// Display metadata for every known agent
const AGENT_META: Record<string, { label: string; schedule: string }> = {
  "meta-ads":           { label: "Meta Ads",           schedule: "Daily 09:00" },
  "ads-multi-platform": { label: "Multi-Platform Ads", schedule: "Daily 09:00" },
  "ads-competitor":     { label: "Competitor Intel",   schedule: "Sun 04:00" },
  "hook-mining":        { label: "Hook Mining",        schedule: "Daily 11:00" },
  "seo":                { label: "SEO",                schedule: "Every 5d + 4×/wk blog" },
  "email-marketing":    { label: "Email Marketing",    schedule: "Mon 07:00 + monthly" },
  "social-instagram":   { label: "Instagram",          schedule: "Daily 08:00 + 14:00" },
  "social-tiktok":      { label: "TikTok",             schedule: "Daily 10:00" },
  "social-youtube":     { label: "YouTube",            schedule: "Daily 11:00" },
  "social-pinterest":   { label: "Pinterest",          schedule: "Daily 12:00" },
  "dm-funnel":          { label: "DM Funnel",          schedule: "Event + 01:00 nightly" },
  "customer-service":   { label: "Customer Service",   schedule: "Every 30min, 09–22" },
  "analytics":          { label: "Analytics",          schedule: "Daily 07:00" },
  "advisory":           { label: "Advisory",           schedule: "Sun 08:00" },
  "finance-il":         { label: "Finance (IL)",       schedule: "Daily + monthly" },
  "dashboard-bridge":   { label: "Dashboard Bridge",   schedule: "Every 5 min" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function durationStr(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60_000)}m`;
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

export default async function AgentsPage() {
  const supabase = await createClient();

  const { data: recentRuns } = await supabase
    .from("routine_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);

  // Latest run per agent (first occurrence = most recent)
  const latestByAgent: Record<string, any> = {};
  for (const run of recentRuns ?? []) {
    if (!latestByAgent[run.routine_name]) {
      latestByAgent[run.routine_name] = run;
    }
  }

  // Merge known agents + any unknown agents that have actually run
  const knownNames = Object.keys(AGENT_META);
  const unknownNames = [
    ...new Set((recentRuns ?? []).map((r: any) => r.routine_name as string)),
  ].filter((n) => !knownNames.includes(n));
  const allAgentNames = [...knownNames, ...unknownNames];

  // Summary stats
  const runningCount = Object.values(latestByAgent).filter((r) => r.status === "running").length;
  const failedCount  = Object.values(latestByAgent).filter((r) => r.status === "failed").length;
  const totalCostUsd = (recentRuns ?? []).reduce((s, r: any) => s + Number(r.cost_usd ?? 0), 0);
  const totalRuns    = recentRuns?.length ?? 0;

  // Feed: last 50 runs
  const feed = (recentRuns ?? []).slice(0, 50);

  return (
    <>
      <PageHeader
        title="Agents"
        subtitle="Live status of every agent running your business"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="kpi-label">Total agents</div>
          <div className="kpi-value">{allAgentNames.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Running now</div>
          <div className="kpi-value" style={{ color: runningCount > 0 ? "var(--color-primary)" : undefined }}>
            {runningCount}
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Failed (last run)</div>
          <div className="kpi-value" style={{ color: failedCount > 0 ? "#dc2626" : undefined }}>
            {failedCount}
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Total cost (last 200 runs)</div>
          <div className="kpi-value">{formatMoney(totalCostUsd, "USD")}</div>
          <div className="text-xs text-ink-subtle mt-1">{totalRuns} runs logged</div>
        </div>
      </div>

      {/* Agent status grid */}
      <div className="mb-6">
        <h2 className="font-semibold text-ink mb-3">Agent status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {allAgentNames.map((name) => {
            const meta = AGENT_META[name];
            const run  = latestByAgent[name];
            const label    = meta?.label    ?? name;
            const schedule = meta?.schedule ?? "—";

            return (
              <div key={name} className="card border border-surface-border">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink text-sm truncate">{label}</div>
                      <div className="text-xs text-ink-muted truncate">{schedule}</div>
                    </div>
                  </div>
                  {run ? (
                    <StatusBadge status={run.status} />
                  ) : (
                    <span className="badge-primary text-xs opacity-50">never run</span>
                  )}
                </div>

                {run ? (
                  <div className="space-y-1">
                    {run.artifacts?.headline && (
                      <p className="text-xs text-ink font-medium line-clamp-2">
                        {run.artifacts.headline}
                      </p>
                    )}
                    {run.error_summary && (
                      <p className="text-xs text-red-600 line-clamp-2">{run.error_summary}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                      <span>{timeAgo(run.started_at)}</span>
                      <span>
                        {formatMoney(run.cost_usd ?? 0, "USD")}
                        {run.tokens_used ? ` · ${formatNumber(run.tokens_used)} tok` : ""}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">No runs recorded yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity feed */}
      <div className="card">
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          Recent activity
          <span className="text-xs font-normal text-ink-muted">(last 50 runs)</span>
        </h2>

        {feed.length === 0 ? (
          <p className="text-sm text-ink-muted">No agent runs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted">
                <tr>
                  <th className="py-2 pr-4">Agent</th>
                  <th className="pr-4">When</th>
                  <th className="pr-4">Status</th>
                  <th className="pr-4">Duration</th>
                  <th className="pr-4">Tokens</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((r: any) => {
                  const label = AGENT_META[r.routine_name]?.label ?? r.routine_name;
                  return (
                    <tr key={r.id} className="border-t border-surface-border">
                      <td className="py-2 pr-4 font-medium text-ink">{label}</td>
                      <td className="pr-4 text-ink-muted whitespace-nowrap">
                        {timeAgo(r.started_at)}
                      </td>
                      <td className="pr-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="pr-4 text-ink-muted">
                        {durationStr(r.started_at, r.finished_at)}
                      </td>
                      <td className="pr-4 text-ink-muted">
                        {r.tokens_used ? formatNumber(r.tokens_used) : "—"}
                      </td>
                      <td className="text-ink-muted">
                        {r.cost_usd ? formatMoney(r.cost_usd, "USD") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
