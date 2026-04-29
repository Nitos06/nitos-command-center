import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { Search, FileText, Wrench, TrendingUp, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function SeoPage() {
  const { supabase, brandId } = await createBrandedClient();

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: keywords, count: kwCount },
    { data: pages, count: pageCount },
    { data: audits },
    { data: backlinks, count: blCount },
    { data: blogPosts },
    { data: agentLogs },
  ] = await Promise.all([
    eq(supabase.from("seo_keywords").select("*", { count: "exact" })).eq("is_active", true).order("current_rank", { ascending: true }).limit(15),
    eq(supabase.from("seo_pages").select("*", { count: "exact" })).limit(1),
    eq(supabase.from("seo_audits").select("*")).order("run_at", { ascending: false }).limit(1),
    eq(supabase.from("backlinks").select("*", { count: "exact" })).eq("status", "live").limit(1),
    eq(supabase.from("seo_pages").select("*")).eq("page_type", "blog").order("published_at", { ascending: false }).limit(10),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "seo").order("created_at", { ascending: false }).limit(20),
  ]);

  const latest = audits?.[0];
  const fixes: any[] = latest?.issues_json ? (Array.isArray(latest.issues_json) ? latest.issues_json : []) : [];
  const pendingFixes = fixes.filter((f: any) => f.status === "pending" || !f.status);
  const appliedFixes = fixes.filter((f: any) => f.status === "applied");

  const scoreColor = (score: number | null | undefined) => {
    if (!score) return "text-ink-muted";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <>
      <PageHeader title="SEO" subtitle="Rankings · audits · auto-fixes · 18 blog posts/month" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Tracked keywords" value={String(kwCount ?? 0)} />
        <Kpi label="Pages indexed" value={String(pageCount ?? 0)} />
        <Kpi label="Live backlinks" value={String(blCount ?? 0)} />
        <Kpi label="Last audit score" value={latest?.overall_score ? `${latest.overall_score}/100` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Keyword rankings */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Keyword rankings
          </h2>
          {(keywords?.length ?? 0) === 0 ? (
            <EmptyState icon={Search} title="No keywords tracked" hint="Add keywords to track from Settings → SEO, or run /seo audit." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Keyword</th><th>Volume</th><th>Rank</th><th>Target</th><th>Change</th></tr>
              </thead>
              <tbody>
                {keywords!.map((k: any) => {
                  const change = k.rank_change ?? 0;
                  return (
                    <tr key={k.id} className="border-t border-surface-border">
                      <td className="py-1.5 font-medium text-ink text-xs">{k.keyword}</td>
                      <td className="text-ink-muted text-xs">{k.search_volume?.toLocaleString() ?? "—"}</td>
                      <td className="text-xs font-semibold">{k.current_rank ?? "—"}</td>
                      <td className="text-ink-muted text-xs">{k.target_rank ?? "—"}</td>
                      <td className="text-xs">
                        {change !== 0 ? (
                          <span className={change > 0 ? "text-green-600" : "text-red-500"}>
                            {change > 0 ? "↑" : "↓"}{Math.abs(change)}
                          </span>
                        ) : <span className="text-ink-subtle">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Audit scores */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3">Latest audit</h2>
          {!latest ? (
            <div className="text-sm text-ink-muted">
              <p>No audits yet.</p>
              <p className="mt-2 text-xs">Runs every 5 days at 02:00 IL, or trigger with <code className="bg-surface-tint px-1 rounded">/seo audit</code>.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 mb-3">
                {[
                  { label: "Technical", key: "technical_score" },
                  { label: "Content", key: "content_score" },
                  { label: "On-page", key: "onpage_score" },
                  { label: "Schema", key: "schema_score" },
                  { label: "Core Web Vitals", key: "cwv_score" },
                  { label: "AI readiness (GEO)", key: "ai_readiness_score" },
                ].map(({ label, key }) => {
                  const score = latest[key];
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-muted">{label}</span>
                        <span className={`font-semibold ${scoreColor(score)}`}>{score ?? "—"}/100</span>
                      </div>
                      {score != null && (
                        <div className="h-1 bg-surface-tint rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-ink-subtle">
                Last run: {new Date(latest.run_at).toLocaleDateString()}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Fix queue */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              Fix queue
            </h2>
            <div className="flex items-center gap-2 text-xs">
              {pendingFixes.length > 0 && (
                <span className="badge-warn">{pendingFixes.length} pending</span>
              )}
              {appliedFixes.length > 0 && (
                <span className="badge-success">{appliedFixes.length} applied</span>
              )}
            </div>
          </div>
          {fixes.length === 0 ? (
            <EmptyState icon={Wrench} title="No fixes queued" hint="Run /seo audit — agent auto-fixes alts, meta, schema, H1s, internal links via Shopify theme MCP." />
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {fixes.slice(0, 20).map((fix: any, i: number) => (
                <li key={i} className={`px-3 py-2 rounded-xl border text-xs ${fix.status === "applied" ? "bg-green-50 border-green-200" : fix.status === "error" ? "bg-red-50 border-red-200" : "bg-surface-tint border-surface-border"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-ink leading-snug flex-1 min-w-0 truncate">{fix.title ?? fix.type ?? "Fix"}</div>
                    <span className={fix.status === "applied" ? "badge-success" : fix.status === "error" ? "badge-crit" : "badge-warn"}>
                      {fix.status ?? "pending"}
                    </span>
                  </div>
                  {fix.description && (
                    <div className="text-ink-muted mt-0.5 line-clamp-2">{fix.description}</div>
                  )}
                  {fix.page_url && (
                    <div className="text-ink-subtle mt-0.5 truncate">{fix.page_url}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agent activity */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            Agent activity
          </h2>
          {(agentLogs?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No activity yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {agentLogs!.map((log: any) => (
                <li key={log.id} className="text-xs border-l-2 border-primary-200 pl-2">
                  <div className="text-ink-muted">
                    {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    <span className={log.type === "error" ? "text-red-500" : log.type === "action" ? "text-green-600" : "text-ink-muted"}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-ink leading-snug mt-0.5">{log.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Blog posts */}
      <div className="card">
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Blog posts
        </h2>
        {(blogPosts?.length ?? 0) === 0 ? (
          <EmptyState icon={FileText} title="No blog posts yet" hint="Agent publishes 18 posts/month (Mon/Wed/Fri/Sun at 06:00) — 2k–6.5k words, EEAT-grade, direct to Shopify." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted text-xs">
              <tr><th className="py-1.5">Post</th><th>Published</th><th>Words</th><th>Rank</th><th>Traffic</th></tr>
            </thead>
            <tbody>
              {blogPosts!.map((post: any) => (
                <tr key={post.id} className="border-t border-surface-border">
                  <td className="py-1.5">
                    <div className="font-medium text-ink text-xs">{post.title ?? post.slug}</div>
                    <div className="text-ink-subtle text-[11px] truncate max-w-[280px]">{post.focus_keyword ?? ""}</div>
                  </td>
                  <td className="text-ink-muted text-xs">{post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}</td>
                  <td className="text-ink-muted text-xs">{post.word_count ? `${(post.word_count / 1000).toFixed(1)}k` : "—"}</td>
                  <td className="text-xs">{post.current_rank ?? "—"}</td>
                  <td className="text-ink-muted text-xs">{post.monthly_clicks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
