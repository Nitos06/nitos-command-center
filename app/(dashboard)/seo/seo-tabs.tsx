"use client";

import { useState } from "react";
import {
  TrendingUp, Wrench, Lightbulb, Bot, FileText,
  AlertCircle, CheckCircle2, Clock, Info, Plus, ExternalLink,
} from "lucide-react";
import { ApplyFixButton } from "./fix-request";

const TABS = ["Site Audit", "Fixes", "Improvements", "Agent Log", "Blog Posts"] as const;
type Tab = typeof TABS[number];

const gaugeColor = (score: number) =>
  score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
const scoreColor = (score: number | null | undefined) => {
  if (!score) return "text-gray-400";
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};
const scoreBarColor = (score: number) =>
  score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";

interface Props {
  brandId: string | null;
  healthScore: number | null;
  errors: any[];
  warnings: any[];
  notices: any[];
  fixes: any[];
  issuesByCategory: Record<string, any[]>;
  latest: any;
  allAudits: any[];
  pendingFixes: any[];
  keywords: any[];
  missingMeta: any[];
  totalMissingAlt: number;
  agentLogs: any[];
  blogPosts: any[];
  seoPages: any[];
}

function CircleGauge({ score, color }: { score: number; color: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="70" y="70" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="70" y="92" textAnchor="middle" fontSize="11" fill="#94a3b8">/ 100</text>
      </svg>
      <span className="text-xs text-ink-muted">Site Health Score</span>
    </div>
  );
}

function severityBadge(s: string) {
  if (s === "error" || s === "high") return <span className="badge-crit text-[10px]">Error</span>;
  if (s === "warning" || s === "medium") return <span className="badge-warn text-[10px]">Warning</span>;
  return <span className="badge-neutral text-[10px]">Notice</span>;
}

function fixStatusBadge(s: string) {
  if (s === "fixed" || s === "applied") return <span className="badge-success text-[10px]">Fixed</span>;
  if (s === "ignored") return <span className="badge-neutral text-[10px]">Ignored</span>;
  return <span className="badge-warn text-[10px]">Pending</span>;
}

// ─── Site Audit Tab ───────────────────────────────────────────────────────────

function SiteAuditTab({ healthScore, errors, warnings, notices, fixes, issuesByCategory, latest, allAudits, brandId }: any) {
  return (
    <div className="space-y-6">
      {/* Health + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center justify-center py-6">
          {healthScore != null ? (
            <CircleGauge score={healthScore} color={gaugeColor(healthScore)} />
          ) : (
            <div className="text-center py-4">
              <div className="text-ink-muted text-sm">No audits yet</div>
              <div className="text-xs text-ink-subtle mt-1">Runs every 5 days at 02:00 IL</div>
            </div>
          )}
          {latest && (
            <div className="text-xs text-ink-subtle mt-2">
              Last run: {new Date(latest.run_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-ink">Issues Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <div className="text-2xl font-bold text-red-600">{errors.length}</div>
              <div className="text-xs text-red-500 mt-0.5">Errors</div>
              <div className="text-[10px] text-red-400">Critical</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{warnings.length}</div>
              <div className="text-xs text-amber-500 mt-0.5">Warnings</div>
              <div className="text-[10px] text-amber-400">Important</div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{notices.length}</div>
              <div className="text-xs text-blue-500 mt-0.5">Notices</div>
              <div className="text-[10px] text-blue-400">Minor</div>
            </div>
          </div>

          <h4 className="font-medium text-ink text-sm mt-2">By Category</h4>
          <div className="space-y-2">
            {Object.entries(issuesByCategory).map(([cat, items]: [string, any]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-xs text-ink">{cat}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${items.length === 0 ? "bg-green-400" : items.length < 3 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: items.length === 0 ? "100%" : `${Math.min(100, items.length * 20)}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-muted w-4 text-right">{items.length}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Score history mini-chart */}
          {(allAudits?.length ?? 0) > 1 && (
            <div className="pt-2 border-t border-surface-border">
              <div className="text-[10px] text-ink-muted mb-1.5">Score history</div>
              <div className="flex items-end gap-1 h-8">
                {allAudits.slice().reverse().map((a: any, i: number) => (
                  <div
                    key={i}
                    title={`${a.overall_score}/100 — ${new Date(a.run_at).toLocaleDateString()}`}
                    className={`flex-1 rounded-sm ${a.overall_score >= 75 ? "bg-green-400" : a.overall_score >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ height: `${((a.overall_score ?? 0) / 100) * 100}%`, opacity: 0.6 + i * 0.04 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-issue table */}
      <div className="card">
        <h3 className="font-semibold text-ink mb-3">All Issues</h3>
        {fixes.length === 0 ? (
          <p className="text-sm text-ink-muted py-4">No issues found. The SEO agent will auto-discover issues on next audit run.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-ink-muted border-b border-surface-border">
                <tr>
                  <th className="pb-2 pr-4">Issue</th>
                  <th className="pb-2 pr-4">Pages Affected</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {fixes.map((fix: any, i: number) => (
                  <tr key={i} className="border-t border-surface-border">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-ink leading-snug">{fix.title ?? fix.type ?? `Issue #${i + 1}`}</div>
                      {fix.description && <div className="text-ink-subtle mt-0.5 max-w-xs">{fix.description}</div>}
                      {fix.page_url && <div className="text-ink-subtle font-mono text-[10px] mt-0.5 truncate max-w-xs">{fix.page_url}</div>}
                    </td>
                    <td className="py-2 pr-4 text-ink-muted">{fix.pages_affected ?? (fix.page_url ? 1 : "—")}</td>
                    <td className="py-2 pr-4">{severityBadge(fix.severity ?? fix.priority ?? "notice")}</td>
                    <td className="py-2 pr-4">{fixStatusBadge(fix.status ?? "pending")}</td>
                    <td className="py-2">
                      {(!fix.status || fix.status === "pending") && (
                        <ApplyFixButton fixIndex={i} brandId={brandId} fixTitle={fix.title ?? fix.type ?? `Fix #${i + 1}`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fixes Tab ────────────────────────────────────────────────────────────────

function FixesTab({ fixes, pendingFixes, brandId }: any) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const queue = fixes.filter((f: any) => !f.status || f.status === "pending" || f.status === "queued" || f.status === "in_progress");
  const done = fixes.filter((f: any) => f.status === "applied" || f.status === "fixed" || f.status === "done");

  async function submitFix(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/seo/fix-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId, url, description, priority }),
    });
    setLoading(false);
    setSubmitted(true);
    setUrl("");
    setDescription("");
    setPriority("medium");
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Fix queue */}
      <div className="card">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-500" />
          Fix Queue ({queue.length} pending)
        </h3>
        {queue.length === 0 ? (
          <p className="text-sm text-ink-muted">No pending fixes. Agent auto-fixes alts, meta, schema, H1s, internal links, and page speed every 5 days.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map((fix: any, i: number) => (
              <div key={i} className="px-3 py-2.5 rounded-xl border border-surface-border bg-surface-tint text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink">{fix.title ?? fix.type ?? `Fix #${i + 1}`}</div>
                    {fix.page_url && <div className="text-ink-subtle font-mono text-[10px] mt-0.5 truncate">{fix.page_url}</div>}
                    {fix.description && <div className="text-ink-muted mt-0.5">{fix.description}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge-${fix.priority === "high" ? "crit" : fix.priority === "medium" ? "warn" : "neutral"} text-[10px]`}>
                      {fix.priority ?? "medium"}
                    </span>
                    <span className="badge-warn text-[10px]">{fix.status ?? "queued"}</span>
                    <ApplyFixButton fixIndex={i} brandId={brandId} fixTitle={fix.title ?? `Fix #${i + 1}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual fix request form */}
      <div className="card">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary-500" />
          Add Manual Fix Request
        </h3>
        {submitted && (
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4" /> Fix request submitted to the SEO agent!
          </div>
        )}
        <form onSubmit={submitFix} className="space-y-3 max-w-lg">
          <div>
            <label className="label">Page URL</label>
            <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourstore.com/products/..." required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be fixed?" required />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button className="btn-primary gap-1.5" type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit Fix Request"}
          </button>
        </form>
      </div>

      {/* Completed fixes */}
      {done.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-ink mb-3">Completed Fixes ({done.length})</h3>
          <table className="w-full text-xs">
            <thead className="text-left text-ink-muted border-b border-surface-border">
              <tr>
                <th className="pb-2 pr-4">Issue</th>
                <th className="pb-2 pr-4">URL</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {done.map((fix: any, i: number) => (
                <tr key={i} className="border-t border-surface-border">
                  <td className="py-2 pr-4 font-medium text-ink">{fix.title ?? fix.type ?? `Fix #${i + 1}`}</td>
                  <td className="py-2 pr-4 font-mono text-[10px] text-ink-subtle truncate max-w-[200px]">{fix.page_url ?? "—"}</td>
                  <td className="py-2"><span className="badge-success text-[10px]">Fixed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Improvements Tab ─────────────────────────────────────────────────────────

function ImprovementsTab({ keywords, missingMeta, totalMissingAlt, seoPages }: any) {
  const opportunities = keywords.filter((k: any) => k.current_rank && k.current_rank > 1 && k.current_rank <= 20);
  const speedIssues = seoPages?.filter((p: any) => p.lcp_ms > 2500 || p.cls_score > 0.1) ?? [];
  const internalLinkSuggestions = seoPages?.filter((p: any) => (p.internal_links_in ?? 0) < 2) ?? [];

  return (
    <div className="space-y-6">
      {/* Keyword opportunities */}
      <div className="card">
        <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          Keyword Opportunities
        </h3>
        {opportunities.length === 0 ? (
          <p className="text-sm text-ink-muted">No keyword opportunities identified yet. Rankings appear as the agent tracks keywords.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-ink-muted border-b border-surface-border">
              <tr>
                <th className="pb-2 pr-4">Keyword</th>
                <th className="pb-2 pr-4">Position</th>
                <th className="pb-2 pr-4">Volume</th>
                <th className="pb-2 pr-4">Difficulty</th>
                <th className="pb-2 pr-4">Potential Clicks</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.slice(0, 20).map((k: any) => (
                <tr key={k.id} className="border-t border-surface-border">
                  <td className="py-2 pr-4 font-medium text-ink">{k.keyword}</td>
                  <td className="py-2 pr-4">
                    <span className={`font-semibold ${k.current_rank <= 3 ? "text-green-600" : k.current_rank <= 10 ? "text-amber-500" : "text-ink-muted"}`}>
                      #{k.current_rank}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">{k.search_volume?.toLocaleString() ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {k.difficulty != null ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 bg-surface-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${k.difficulty > 70 ? "bg-red-400" : k.difficulty > 40 ? "bg-amber-400" : "bg-green-400"}`}
                            style={{ width: `${k.difficulty}%` }}
                          />
                        </div>
                        <span>{k.difficulty}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {k.search_volume && k.current_rank
                      ? Math.round((k.search_volume * (1 / k.current_rank)) * 0.3).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2">
                    <button className="btn-outline text-[10px] py-1 px-2">Optimize</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Missing meta + alt grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Missing Meta Descriptions ({missingMeta.length})
          </h3>
          {missingMeta.length === 0 ? (
            <p className="text-sm text-ink-muted">All pages have meta descriptions.</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {missingMeta.slice(0, 20).map((p: any) => (
                <li key={p.id} className="text-xs text-ink-muted truncate font-mono border-l-2 border-amber-300 pl-2 py-0.5">
                  {p.url ?? p.slug ?? p.title ?? p.id}
                </li>
              ))}
              {missingMeta.length > 20 && <li className="text-xs text-ink-subtle">+{missingMeta.length - 20} more…</li>}
            </ul>
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-ink flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Missing Alt Tags
          </h3>
          <div className="text-3xl font-bold text-ink">{totalMissingAlt}</div>
          <p className="text-xs text-ink-muted">images across {missingMeta.length} pages are missing alt attributes. The SEO agent will auto-fix these on next run.</p>
        </div>
      </div>

      {/* Internal linking + page speed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Internal Linking Suggestions
          </h3>
          {internalLinkSuggestions.length === 0 ? (
            <p className="text-sm text-ink-muted">All tracked pages have sufficient internal links.</p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {internalLinkSuggestions.slice(0, 10).map((p: any) => (
                <li key={p.id} className="text-xs border-l-2 border-blue-300 pl-2 py-0.5">
                  <div className="font-medium text-ink truncate">{p.title ?? p.url ?? p.slug}</div>
                  <div className="text-ink-muted">{p.internal_links_in ?? 0} internal links pointing to it</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Page Speed Issues
          </h3>
          {speedIssues.length === 0 ? (
            <p className="text-sm text-ink-muted">No Core Web Vitals issues detected on tracked pages.</p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {speedIssues.slice(0, 10).map((p: any) => (
                <li key={p.id} className="text-xs border-l-2 border-red-300 pl-2 py-0.5">
                  <div className="font-medium text-ink truncate">{p.title ?? p.url ?? p.slug}</div>
                  <div className="text-ink-muted">
                    {p.lcp_ms > 2500 && `LCP: ${(p.lcp_ms / 1000).toFixed(1)}s`}
                    {p.cls_score > 0.1 && ` CLS: ${p.cls_score}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Log Tab ────────────────────────────────────────────────────────────

function AgentLogTab({ agentLogs }: any) {
  return (
    <div className="card">
      <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary-500" />
        Agent Activity Timeline
      </h3>
      {agentLogs.length === 0 ? (
        <p className="text-sm text-ink-muted py-4">No activity yet. Agent logs appear here as seo-audit and seo-blogs agents run.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-surface-border" />
          <ul className="space-y-4 max-h-[600px] overflow-y-auto pl-8">
            {agentLogs.map((log: any) => (
              <li key={log.id} className="relative text-xs">
                <div
                  className={`absolute -left-[26px] w-3 h-3 rounded-full border-2 border-surface mt-0.5 ${
                    log.type === "error" ? "bg-red-400"
                    : log.type === "action" || log.type === "fix" ? "bg-green-400"
                    : "bg-primary-400"
                  }`}
                />
                <div className="flex items-center gap-2 text-ink-muted mb-0.5">
                  <span>{new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-ink-subtle">·</span>
                  <span className={
                    log.type === "error" ? "text-red-500 font-medium"
                    : log.type === "action" || log.type === "fix" || log.type === "manual_fix_request" ? "text-green-600 font-medium"
                    : "text-ink-muted"
                  }>{log.agent_name ?? "seo"} · {log.type}</span>
                  {log.url && (
                    <>
                      <span className="text-ink-subtle">·</span>
                      <span className="font-mono text-[10px] text-ink-subtle truncate max-w-[200px]">{log.url}</span>
                    </>
                  )}
                </div>
                <div className="text-ink leading-snug">{log.message}</div>
                {log.details && (
                  <div className="mt-0.5 text-ink-subtle leading-relaxed">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</div>
                )}
                {log.result && (
                  <div className="mt-0.5 text-emerald-600 text-[10px]">{log.result}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Blog Posts Tab ───────────────────────────────────────────────────────────

function BlogPostsTab({ blogPosts, brandId }: any) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function requestPost() {
    setLoading(true);
    await fetch("/api/seo/blog-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId }),
    });
    setLoading(false);
    setRequested(true);
    setTimeout(() => setRequested(false), 4000);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Blog Posts ({blogPosts.length})
        </h3>
        <div className="flex items-center gap-2">
          {requested && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Blog post requested!
            </span>
          )}
          <button onClick={requestPost} disabled={loading} className="btn-primary text-xs gap-1.5">
            {loading ? "Requesting…" : <><Plus className="w-3.5 h-3.5" /> Request New Post</>}
          </button>
        </div>
      </div>

      {blogPosts.length === 0 ? (
        <p className="text-sm text-ink-muted">Agent publishes Mon/Wed/Fri at 06:00 — 2k–6.5k words, EEAT-grade, direct to Shopify.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-left text-ink-muted border-b border-surface-border">
            <tr>
              <th className="pb-2 pr-4">Title</th>
              <th className="pb-2 pr-4">Target Keyword</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Words</th>
              <th className="pb-2 pr-4">Published</th>
              <th className="pb-2 pr-4">GSC Clicks</th>
              <th className="pb-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {blogPosts.map((post: any) => {
              const status = post.status ?? (post.published_at ? "published" : "draft");
              return (
                <tr key={post.id} className="border-t border-surface-border">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-ink truncate max-w-[220px]">{post.title ?? post.slug}</div>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted truncate max-w-[120px]">{post.focus_keyword ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={
                      status === "published" ? "badge-success text-[10px]"
                      : status === "scheduled" ? "badge-primary text-[10px]"
                      : "badge-neutral text-[10px]"
                    }>{status}</span>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">{post.word_count ? `${(post.word_count / 1000).toFixed(1)}k` : "—"}</td>
                  <td className="py-2 pr-4 text-ink-muted">{post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}</td>
                  <td className="py-2 pr-4 text-ink-muted">{post.gsc_clicks?.toLocaleString() ?? "—"}</td>
                  <td className="py-2">
                    {post.url ? (
                      <a href={post.url} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function SeoTabs(props: Props) {
  const [tab, setTab] = useState<Tab>("Site Audit");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-surface-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t}
            {t === "Site Audit" && props.errors.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">{props.errors.length}</span>
            )}
            {t === "Agent Log" && props.agentLogs.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5">{props.agentLogs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Site Audit" && (
        <SiteAuditTab
          healthScore={props.healthScore}
          errors={props.errors}
          warnings={props.warnings}
          notices={props.notices}
          fixes={props.fixes}
          issuesByCategory={props.issuesByCategory}
          latest={props.latest}
          allAudits={props.allAudits}
          brandId={props.brandId}
        />
      )}
      {tab === "Fixes" && (
        <FixesTab fixes={props.fixes} pendingFixes={props.pendingFixes} brandId={props.brandId} />
      )}
      {tab === "Improvements" && (
        <ImprovementsTab
          keywords={props.keywords}
          missingMeta={props.missingMeta}
          totalMissingAlt={props.totalMissingAlt}
          seoPages={props.seoPages}
        />
      )}
      {tab === "Agent Log" && <AgentLogTab agentLogs={props.agentLogs} />}
      {tab === "Blog Posts" && <BlogPostsTab blogPosts={props.blogPosts} brandId={props.brandId} />}
    </div>
  );
}
