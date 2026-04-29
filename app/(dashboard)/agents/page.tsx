import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { Bot, Activity, Database } from "lucide-react";
import { RunButton } from "./run-button";

const AGENT_META: Record<string, {
  label: string;
  schedule: string;
  writes: string;
  routineId: string;
}> = {
  "finance-il-reconciliation":        { label: "Finance: Reconciliation",   schedule: "04:00 daily",        writes: "tax_bracket_snapshots, vat_reports",           routineId: "finance-il-reconciliation" },
  "finance-il-profit-watch":          { label: "Finance: Profit Watch",     schedule: "08:00 daily",        writes: "agent_logs → Telegram",                        routineId: "finance-il-profit-watch" },
  "finance-il-monthly":               { label: "Finance: Monthly",          schedule: "1st of month",       writes: "vat_reports, bituach_leumi_payments",          routineId: "finance-il-monthly" },
  "finance-il-telegram-poll":         { label: "Finance: Receipt Scanner",  schedule: "Every 15 min",       writes: "invoice_uploads, expenses",                    routineId: "finance-il-telegram-poll" },
  "reviews-daily":                    { label: "Reviews: Daily",            schedule: "06:00 daily",        writes: "ugc_assets, review_segments, email_sends",     routineId: "reviews-daily" },
  "seo-audit-autofix":                { label: "SEO: Audit + Auto-fix",     schedule: "02:00 every 5 days", writes: "seo_audits, seo_keywords, Shopify theme",      routineId: "seo-audit-autofix" },
  "seo-blog-post":                    { label: "SEO: Blog Post",            schedule: "06:00 Mon/Wed/Fri",  writes: "seo_pages → published to Shopify",             routineId: "seo-blog-post" },
  "email-weekly-campaign":            { label: "Email: Weekly Campaign",    schedule: "07:00 Monday",       writes: "email_campaigns, email_sends",                 routineId: "email-weekly-campaign" },
  "email-monthly-topic-bank":         { label: "Email: Topic Bank",         schedule: "1st of month",       writes: "email_flows",                                  routineId: "email-monthly-topic-bank" },
  "email-deliverability-nightly":     { label: "Email: Deliverability",     schedule: "03:00 daily",        writes: "email_deliverability",                         routineId: "email-deliverability-nightly" },
  "meta-ads-daily":                   { label: "Meta Ads: Adaptive Loop",   schedule: "09:00 daily",        writes: "campaigns, kill_scale_log, creatives",         routineId: "meta-ads-daily" },
  "ads-multi-platform-daily":         { label: "Ads: Multi-Platform",       schedule: "09:00 daily",        writes: "campaigns, ad_insights_daily",                 routineId: "ads-multi-platform-daily" },
  "ads-competitor-weekly":            { label: "Ads: Competitor Research",  schedule: "04:00 Sunday",       writes: "hook_patterns, creatives",                     routineId: "ads-competitor-weekly" },
  "hook-mining-daily":                { label: "Hook Mining",               schedule: "11:00 daily",        writes: "hook_patterns, creatives",                     routineId: "hook-mining-daily" },
  "analytics-daily":                  { label: "Analytics: Daily Sync",     schedule: "07:00 daily",        writes: "shopify_orders sync, agent_logs",              routineId: "analytics-daily" },
  "advisory-weekly":                  { label: "Advisory: Weekly Report",   schedule: "08:00 Sunday",       writes: "agent_logs → Telegram report",                 routineId: "advisory-weekly" },
  "social-instagram-weekly-calendar": { label: "Instagram: Weekly Plan",    schedule: "07:00 Monday",       writes: "social_content_calendar",                      routineId: "social-instagram-weekly-calendar" },
  "social-instagram-daily":           { label: "Instagram: Daily Post",     schedule: "09:00 daily",        writes: "social_posts, social_agent_activity",          routineId: "social-instagram-daily" },
  "social-tiktok-daily":              { label: "TikTok: Daily Post",        schedule: "10:00 daily",        writes: "social_posts, social_agent_activity",          routineId: "social-tiktok-daily" },
  "social-youtube-weekly":            { label: "YouTube: Weekly Video",     schedule: "11:00 Tuesday",      writes: "social_posts (HeyGen video ID)",               routineId: "social-youtube-weekly" },
  "social-pinterest-daily":           { label: "Pinterest: Daily Pins",     schedule: "12:00 daily",        writes: "social_posts × 10-15 pins",                   routineId: "social-pinterest-daily" },
  "social-facebook-post":             { label: "Facebook: Daily Post",      schedule: "11:00 daily",        writes: "social_posts, social_agent_activity",          routineId: "social-facebook-post" },
  "social-facebook-replies":          { label: "Facebook: Replies",         schedule: "17:00 daily",        writes: "social_agent_activity",                        routineId: "social-facebook-replies" },
  "customer-service-poll":            { label: "Customer Service",          schedule: "Every 30 min 9-22",  writes: "cs_tickets, cs_messages",                      routineId: "customer-service-poll" },
  "dm-funnel-nightly":                { label: "DM Funnel",                 schedule: "01:00 daily",        writes: "cs_tickets (instagram_dm)",                    routineId: "dm-funnel-nightly" },
  "dashboard-bridge":                 { label: "Dashboard Bridge",          schedule: "Every 5 min",        writes: "shopify_orders real-time sync",                routineId: "dashboard-bridge" },
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function durationStr(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`;
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { success: "badge-success", failed: "badge-crit", partial: "badge-warn", running: "badge-primary" };
  return <span className={cls[status] ?? "badge-primary"}>{status}</span>;
}

export default async function AgentsPage() {
  const supabase = await createClient();

  const { data: recentRuns } = await supabase
    .from("routine_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);

  const latestByAgent: Record<string, any> = {};
  for (const run of recentRuns ?? []) {
    if (!latestByAgent[run.routine_name]) latestByAgent[run.routine_name] = run;
  }

  const knownNames = Object.keys(AGENT_META);
  const allNames = [
    ...knownNames,
    ...[...new Set((recentRuns ?? []).map((r: any) => r.routine_name as string))].filter(
      (n) => !knownNames.includes(n)
    ),
  ];

  const runningCount = Object.values(latestByAgent).filter((r) => r.status === "running").length;
  const failedCount = Object.values(latestByAgent).filter((r) => r.status === "failed").length;
  const totalCost = (recentRuns ?? []).reduce((s, r: any) => s + Number(r.cost_usd ?? 0), 0);

  return (
    <>
      <PageHeader title="Agents" subtitle="26 routines — Vercel Cron fires them, Claude API runs them, Supabase stores results" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="kpi-label">Total agents</div><div className="kpi-value">{allNames.length}</div></div>
        <div className="card"><div className="kpi-label">Running now</div><div className="kpi-value" style={{ color: runningCount > 0 ? "var(--color-primary)" : undefined }}>{runningCount}</div></div>
        <div className="card"><div className="kpi-label">Failed (last run)</div><div className="kpi-value" style={{ color: failedCount > 0 ? "#dc2626" : undefined }}>{failedCount}</div></div>
        <div className="card"><div className="kpi-label">Cost (last 200 runs)</div><div className="kpi-value">{formatMoney(totalCost, "USD")}</div></div>
      </div>

      <div className="card-warm mb-6 text-sm leading-relaxed">
        <div className="font-medium text-accent-700 mb-1">How it works</div>
        <p className="text-accent-600 text-xs">
          <strong>Vercel Cron</strong> fires each routine on schedule →
          calls <code className="bg-white px-1 rounded">/api/routines/[name]</code> →
          reads <code className="bg-white px-1 rounded">skills/[name]/SKILL.md</code> →
          <strong> Claude API</strong> executes it using <code className="bg-white px-1 rounded">database_query</code> (Supabase SQL) and <code className="bg-white px-1 rounded">http_request</code> (Shopify / Meta / Telegram / DataForSEO / etc.) →
          results written to Supabase → <strong>this app displays them</strong>.
          No PC needed. Click <strong>Run</strong> on any agent to trigger it now.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold text-ink mb-3">Agent status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {allNames.map((name) => {
            const meta = AGENT_META[name];
            const run = latestByAgent[name];
            return (
              <div key={name} className="card border border-surface-border">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink text-sm truncate">{meta?.label ?? name}</div>
                      <div className="text-xs text-ink-muted">{meta?.schedule ?? "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {run ? <StatusBadge status={run.status} /> : <span className="badge-primary opacity-50 text-xs">never run</span>}
                    {meta && <RunButton routine={meta.routineId} />}
                  </div>
                </div>
                {meta?.writes && (
                  <div className="flex items-center gap-1 text-[10px] text-ink-muted mt-0.5">
                    <Database className="w-3 h-3 shrink-0" />
                    <span className="truncate">{meta.writes}</span>
                  </div>
                )}
                {run && (
                  <div className="mt-1.5 space-y-0.5">
                    {run.artifacts?.headline && <p className="text-xs text-ink line-clamp-1">{run.artifacts.headline}</p>}
                    {run.error_summary && <p className="text-xs text-red-600 line-clamp-1">{run.error_summary}</p>}
                    <div className="flex justify-between text-[10px] text-ink-muted pt-0.5">
                      <span>{timeAgo(run.started_at)}</span>
                      <span>{durationStr(run.started_at, run.finished_at)}{run.cost_usd ? ` · ${formatMoney(run.cost_usd, "USD")}` : ""}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          Recent runs
          <span className="text-xs font-normal text-ink-muted">(last 50)</span>
        </h2>
        {(recentRuns?.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-muted">No runs yet. Click "Run" on any agent above to trigger the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-2 pr-4">Agent</th><th className="pr-4">When</th><th className="pr-4">Status</th><th className="pr-4">Duration</th><th>Cost</th></tr>
              </thead>
              <tbody>
                {(recentRuns ?? []).slice(0, 50).map((r: any) => (
                  <tr key={r.id} className="border-t border-surface-border">
                    <td className="py-2 pr-4 font-medium text-ink">{AGENT_META[r.routine_name]?.label ?? r.routine_name}</td>
                    <td className="pr-4 text-ink-muted whitespace-nowrap text-xs">{timeAgo(r.started_at)}</td>
                    <td className="pr-4"><StatusBadge status={r.status} /></td>
                    <td className="pr-4 text-ink-muted text-xs">{durationStr(r.started_at, r.finished_at)}</td>
                    <td className="text-ink-muted text-xs">{r.cost_usd ? formatMoney(r.cost_usd, "USD") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
