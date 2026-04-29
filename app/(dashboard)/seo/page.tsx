import { Search, FileText, Wrench, TrendingUp, Bot, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import { FixRequestPanel, ApplyFixButton } from "./fix-request";

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
    { data: allAudits },
  ] = await Promise.all([
    eq(supabase.from("seo_keywords").select("*", { count: "exact" })).eq("is_active", true).order("current_rank", { ascending: true }).limit(20),
    eq(supabase.from("seo_pages").select("*", { count: "exact" })).limit(1),
    eq(supabase.from("seo_audits").select("*")).order("run_at", { ascending: false }).limit(1),
    eq(supabase.from("backlinks").select("*", { count: "exact" })).eq("status", "live").limit(1),
    eq(supabase.from("seo_pages").select("*")).eq("page_type", "blog").order("published_at", { ascending: false }).limit(15),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "seo").order("created_at", { ascending: false }).limit(30),
    eq(supabase.from("seo_audits").select("run_at, overall_score, issues_json")).order("run_at", { ascending: false }).limit(10),
  ]);

  const latest = audits?.[0];
  const fixes: any[] = latest?.issues_json
    ? (Array.isArray(latest.issues_json) ? latest.issues_json : Object.values(latest.issues_json))
    : [];

  const pending  = fixes.filter((f: any) => !f.status || f.status === "pending");
  const applied  = fixes.filter((f: any) => f.status === "applied");
  const errored  = fixes.filter((f: any) => f.status === "error");

  const scoreColor = (score: number | null | undefined) => {
    if (!score) return "text-ink-muted";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const scoreBarColor = (score: number) =>
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-400";

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">SEO</h1>
          <p className="text-xs text-ink-muted mt-1">Rankings · audits · auto-fixes · 18 blog posts/month</p>
        </div>
        <FixRequestPanel brandId={brandId} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Tracked keywords", value: String(kwCount ?? 0) },
          { label: "Pages indexed", value: String(pageCount ?? 0) },
          { label: "Live backlinks", value: String(blCount ?? 0) },
          { label: "Last audit score", value: latest?.overall_score ? `${latest.overall_score}/100` : "—" },
        ].map(k => (
          <div key={k.label} className="card py-3 px-4">
            <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">{k.label}</div>
            <div className="text-xl font-bold text-ink">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Keyword rankings */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Keyword rankings
          </h2>
          {(keywords?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No keywords tracked yet. The SEO agent will auto-discover and add keywords.</p>
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
                        {change !== 0
                          ? <span className={change > 0 ? "text-green-600" : "text-red-500"}>{change > 0 ? "↑" : "↓"}{Math.abs(change)}</span>
                          : <span className="text-ink-subtle">—</span>}
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
              <p className="mt-2 text-xs">Runs every 5 days at 02:00 IL.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 mb-3">
                {[
                  { label: "Technical",          key: "technical_score"    },
                  { label: "Content",            key: "content_score"      },
                  { label: "On-page",            key: "onpage_score"       },
                  { label: "Schema",             key: "schema_score"       },
                  { label: "Core Web Vitals",    key: "cwv_score"          },
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
                          <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-ink-subtle">
                Last run: {new Date(latest.run_at).toLocaleDateString()}
              </div>

              {/* Audit history */}
              {(allAudits?.length ?? 0) > 1 && (
                <div className="mt-3 pt-3 border-t border-surface-border">
                  <div className="text-[10px] text-ink-muted mb-1.5">Score history</div>
                  <div className="flex items-end gap-1 h-8">
                    {allAudits!.slice().reverse().map((a: any, i: number) => (
                      <div
                        key={i}
                        title={`${a.overall_score}/100 — ${new Date(a.run_at).toLocaleDateString()}`}
                        className={`flex-1 rounded-sm ${scoreBarColor(a.overall_score ?? 0)}`}
                        style={{ height: `${((a.overall_score ?? 0) / 100) * 100}%`, opacity: 0.7 + i * 0.03 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fix queue — full audit points */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-500" />
            Audit fix queue
          </h2>
          <div className="flex items-center gap-2 text-xs">
            {pending.length > 0  && <span className="badge-warn">{pending.length} pending</span>}
            {applied.length > 0  && <span className="badge-success">{applied.length} applied</span>}
            {errored.length > 0  && <span className="badge-crit">{errored.length} errors</span>}
          </div>
        </div>

        {fixes.length === 0 ? (
          <p className="text-sm text-ink-muted py-4">No fixes in queue. The SEO agent auto-fixes alts, meta, schema, H1s, internal links, page speed via Shopify theme MCP every 5 days. Use "Request manual fix" above to push one yourself.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fixes.map((fix: any, i: number) => (
              <div key={i} className={`px-3 py-2.5 rounded-xl border text-xs ${
                fix.status === "applied" ? "bg-green-50/10 border-green-500/20"
                : fix.status === "error" ? "bg-red-50/10 border-red-500/20"
                : "bg-surface-tint border-surface-border"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {fix.status === "applied"
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      : fix.status === "error"
                      ? <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      : <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink leading-snug">{fix.title ?? fix.type ?? `Fix #${i + 1}`}</div>
                      {fix.description && <div className="text-ink-muted mt-0.5 leading-relaxed">{fix.description}</div>}
                      {fix.recommendation && fix.recommendation !== fix.description && (
                        <div className="text-ink-subtle mt-0.5 leading-relaxed italic">{fix.recommendation}</div>
                      )}
                      {fix.page_url && <div className="text-ink-subtle mt-0.5 truncate font-mono text-[10px]">{fix.page_url}</div>}
                      {fix.impact && <div className="text-primary-400 text-[10px] mt-0.5">Impact: {fix.impact}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(!fix.status || fix.status === "pending") && (
                      <ApplyFixButton fixIndex={i} brandId={brandId} fixTitle={fix.title ?? fix.type ?? `Fix #${i + 1}`} />
                    )}
                    <span className={
                      fix.status === "applied" ? "badge-success"
                      : fix.status === "error" ? "badge-crit"
                      : "badge-warn"
                    }>{fix.status ?? "pending"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Agent activity */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            Agent activity
          </h2>
          {(agentLogs?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No activity yet. Agent logs appear here as it runs.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {agentLogs!.map((log: any) => (
                <li key={log.id} className="text-xs border-l-2 border-primary-200 pl-2">
                  <div className="text-ink-muted">
                    {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    <span className={log.type === "error" ? "text-red-500" : log.type === "action" || log.type === "manual_fix_request" ? "text-green-600" : "text-ink-muted"}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-ink leading-snug mt-0.5">{log.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Blog posts */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Blog posts ({blogPosts?.length ?? 0})
          </h2>
          {(blogPosts?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">Agent publishes Mon/Wed/Fri at 06:00 — 2k–6.5k words, EEAT-grade, direct to Shopify.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Post</th><th>Published</th><th>Words</th><th>Rank</th></tr>
              </thead>
              <tbody>
                {blogPosts!.map((post: any) => (
                  <tr key={post.id} className="border-t border-surface-border">
                    <td className="py-1.5">
                      <div className="font-medium text-ink text-xs truncate max-w-[200px]">{post.title ?? post.slug}</div>
                      <div className="text-ink-subtle text-[11px] truncate max-w-[200px]">{post.focus_keyword ?? ""}</div>
                    </td>
                    <td className="text-ink-muted text-xs">{post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}</td>
                    <td className="text-ink-muted text-xs">{post.word_count ? `${(post.word_count / 1000).toFixed(1)}k` : "—"}</td>
                    <td className="text-xs">{post.current_rank ?? "—"}</td>
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
