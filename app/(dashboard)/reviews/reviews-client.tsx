"use client";

import { useState, useMemo } from "react";
import {
  Star, Search, Filter, Download, Check, X, MessageSquare, Gift, Share2,
  Trash2, Upload, Image as ImageIcon, Video, ChevronDown, ChevronRight,
  Copy, CheckCircle2, Loader2, Plus, Settings, Zap, RefreshCw, Eye,
  HelpCircle, Send, Bot, ExternalLink,
} from "lucide-react";

interface Props {
  brandId: string;
  reviews: any[];
  pending: any[];
  qa: any[];
  imports: any[];
  ugcAssets: any[];
  requestSettings: any;
}

/* ── Helpers ─────────────────────────────────── */
function Stars({ rating, size = "sm" }: { rating: number; size?: "xs" | "sm" | "md" }) {
  const sz = size === "xs" ? "w-3 h-3" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? "fill-amber-400 text-amber-400" : "text-surface-border"}`} />
      ))}
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "success" | "warn" | "error" | "default" | "info" }) {
  const cls = {
    success: "bg-green-100 text-green-700",
    warn: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    default: "bg-surface-tint text-ink-muted",
  }[variant];
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="btn-outline text-xs px-2 py-1 flex items-center gap-1"
    >
      {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ── Sub-components ──────────────────────────── */

function ReviewsTab({ reviews, pending, brandId }: { reviews: any[]; pending: any[]; brandId: string }) {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => reviews.filter(r => {
    if (search && !`${r.author_name} ${r.title} ${r.body} ${r.product_title}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (ratingFilter && r.rating !== ratingFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  }), [reviews, search, ratingFilter, statusFilter]);

  const approved = reviews.filter(r => r.status === "approved");
  const avgRating = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;
  const fiveStar = approved.length ? Math.round(approved.filter(r => r.rating === 5).length / approved.length * 100) : 0;
  const withMedia = approved.length ? Math.round(approved.filter(r => r.photos?.length || r.video_url).length / approved.length * 100) : 0;
  const verified = approved.length ? Math.round(approved.filter(r => r.verified_purchase).length / approved.length * 100) : 0;

  async function action(id: string, act: string) {
    setSaving(true);
    await fetch("/api/reviews/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: act, brandId }) });
    setSaving(false);
  }

  async function submitReply(id: string) {
    if (!replyText.trim()) return;
    setSaving(true);
    await fetch("/api/reviews/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reply: replyText, brandId }) });
    setSaving(false);
    setReplyId(null);
    setReplyText("");
  }

  function exportCsv() {
    const rows = filtered.map(r => [r.author_name, r.product_title, r.rating, r.title, r.body, r.status, r.created_at].join(","));
    const blob = new Blob([["Name,Product,Rating,Title,Body,Status,Date", ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "reviews.csv"; a.click();
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Avg rating", value: avgRating.toFixed(1) },
          { label: "Total", value: reviews.length },
          { label: "5-star %", value: `${fiveStar}%` },
          { label: "Verified %", value: `${verified}%` },
          { label: "With media %", value: `${withMedia}%` },
        ].map(s => (
          <div key={s.label} className="card py-2.5 px-3 text-center">
            <div className="text-lg font-bold text-ink">{s.value}</div>
            <div className="text-[10px] text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…" className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div className="flex items-center gap-1">
          {[null, 5, 4, 3, 2, 1].map(r => (
            <button key={r ?? "all"} onClick={() => setRatingFilter(r)} className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs border transition-colors ${ratingFilter === r ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted hover:border-ink-muted"}`}>
              {r ? <><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{r}</> : "All"}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          {selected.size > 0 && (
            <>
              <button onClick={() => { selected.forEach(id => action(id, "approve")); setSelected(new Set()); }} className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1 text-green-600 border-green-300">
                <Check className="w-3 h-3" /> Approve ({selected.size})
              </button>
              <button onClick={() => { selected.forEach(id => action(id, "reject")); setSelected(new Set()); }} className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1 text-red-600 border-red-300">
                <X className="w-3 h-3" /> Reject ({selected.size})
              </button>
            </>
          )}
          {pending.length > 0 && (
            <button onClick={() => pending.forEach(p => action(p.id, "approve"))} className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Approve all pending ({pending.length})
            </button>
          )}
          <button onClick={exportCsv} className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-ink-muted text-xs border-b border-surface-border">
            <tr>
              <th className="py-2 pr-2 w-8">
                <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())} />
              </th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Rating</th>
              <th className="py-2 pr-3">Review</th>
              <th className="py-2 pr-3">Media</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-10 text-center text-ink-muted text-xs">No reviews match your filters.</td></tr>
            )}
            {filtered.map(r => (
              <>
                <tr key={r.id} className="border-t border-surface-border hover:bg-surface-tint/40 transition-colors">
                  <td className="py-2 pr-2">
                    <input type="checkbox" className="rounded" checked={selected.has(r.id)} onChange={e => setSelected(s => { const n = new Set(s); e.target.checked ? n.add(r.id) : n.delete(r.id); return n; })} />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-ink text-xs leading-snug">{r.author_name || "Anonymous"}</div>
                    {r.verified_purchase && <Badge variant="success">Verified</Badge>}
                  </td>
                  <td className="py-2 pr-3 text-xs text-ink-muted max-w-[140px] truncate">{r.product_title || "—"}</td>
                  <td className="py-2 pr-3"><Stars rating={r.rating} size="xs" /></td>
                  <td className="py-2 pr-3 max-w-[200px]">
                    {r.title && <div className="text-xs font-medium text-ink truncate">{r.title}</div>}
                    <div className="text-[11px] text-ink-muted truncate">{r.body}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1">
                      {r.photos?.length > 0 && <span className="flex items-center gap-0.5 text-[10px] text-ink-muted"><ImageIcon className="w-3 h-3" />{r.photos.length}</span>}
                      {r.video_url && <span className="flex items-center gap-0.5 text-[10px] text-ink-muted"><Video className="w-3 h-3" />1</span>}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-ink-muted whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "error" : "warn"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      {r.status !== "approved" && (
                        <button onClick={() => action(r.id, "approve")} title="Approve" className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                      )}
                      {r.status !== "rejected" && (
                        <button onClick={() => action(r.id, "reject")} title="Reject" className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => { setReplyId(replyId === r.id ? null : r.id); setReplyText(""); }} title="Reply" className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"><MessageSquare className="w-3.5 h-3.5" /></button>
                      <button onClick={() => action(r.id, "reward")} title="Send reward coupon" className="p-1 rounded hover:bg-amber-100 text-amber-600 transition-colors"><Gift className="w-3.5 h-3.5" /></button>
                      <button onClick={() => action(r.id, "share")} title="Share to social" className="p-1 rounded hover:bg-purple-100 text-purple-600 transition-colors"><Share2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => action(r.id, "delete")} title="Delete" className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
                {replyId === r.id && (
                  <tr key={`reply-${r.id}`} className="bg-blue-50/30">
                    <td colSpan={9} className="py-2 px-4">
                      <div className="flex items-start gap-2">
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply…" rows={2} className="flex-1 px-3 py-2 rounded-lg bg-white border border-blue-200 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                        <div className="flex flex-col gap-1">
                          <button onClick={() => submitReply(r.id)} disabled={saving || !replyText.trim()} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send
                          </button>
                          <button onClick={() => setReplyId(null)} className="btn-outline text-xs px-3 py-1.5">Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Auto-publish config */}
      <div className="card flex items-center justify-between gap-4 p-3">
        <div>
          <div className="text-xs font-medium text-ink">Auto-publish reviews</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Automatically approve reviews with rating ≥ threshold</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-ink-muted">
            Min rating:
            <select className="px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
              {[4, 3, 5].map(v => <option key={v} value={v}>{v} stars</option>)}
            </select>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      </div>
    </div>
  );
}

function QATab({ qa, brandId }: { qa: any[]; brandId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "unanswered">("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const filtered = qa.filter(q => filter === "all" || !q.answer);

  async function submitAnswer(id: string) {
    const text = answerTexts[id];
    if (!text?.trim()) return;
    setSaving(id);
    await fetch("/api/reviews/qa-answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, answer: text, brandId }) });
    setSaving(null);
    setAnswerTexts(p => ({ ...p, [id]: "" }));
  }

  async function aiAnswer(id: string, question: string) {
    setAiLoading(id);
    try {
      const res = await fetch("/api/cs/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question, brandId }) });
      const data = await res.json();
      setAnswerTexts(p => ({ ...p, [id]: data.reply || "" }));
    } finally {
      setAiLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-ink text-sm">Questions & Answers</h2>
        <div className="flex items-center gap-1 ml-auto">
          {(["all", "unanswered"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-xs border transition-colors ${filter === f ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>
              {f === "all" ? "All" : "Unanswered"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-10 text-center text-sm text-ink-muted"><HelpCircle className="w-8 h-8 mx-auto mb-2 text-ink-subtle" />No questions yet.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <div key={q.id} className="card p-0 overflow-hidden">
              <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="w-full flex items-start gap-3 p-3 text-left hover:bg-surface-tint/40 transition-colors">
                <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink">{q.question}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-2">
                    <span>{q.customer_name || "Customer"}</span>
                    <span>·</span>
                    <span>{q.product_title || "—"}</span>
                    <span>·</span>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                    {!q.answer && <Badge variant="warn">Unanswered</Badge>}
                    {q.answer && <Badge variant="success">Answered</Badge>}
                  </div>
                </div>
                {expanded === q.id ? <ChevronDown className="w-4 h-4 text-ink-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-ink-muted flex-shrink-0" />}
              </button>
              {expanded === q.id && (
                <div className="border-t border-surface-border px-4 py-3 space-y-3">
                  {q.answer && (
                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-2.5">
                      <div className="text-[10px] text-green-600 font-semibold mb-1">Merchant answer</div>
                      <div className="text-xs text-ink">{q.answer}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] text-ink-muted mb-1.5 font-medium">{q.answer ? "Update answer" : "Write answer"}</div>
                    <textarea value={answerTexts[q.id] || ""} onChange={e => setAnswerTexts(p => ({ ...p, [q.id]: e.target.value }))} rows={3} placeholder="Type your answer…" className="w-full px-3 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none" />
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => submitAnswer(q.id)} disabled={saving === q.id || !answerTexts[q.id]?.trim()} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                        {saving === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Answer
                      </button>
                      <button onClick={() => aiAnswer(q.id, q.question)} disabled={aiLoading === q.id} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                        {aiLoading === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />} AI Answer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestSettingsTab({ settings, brandId }: { settings: any; brandId: string }) {
  const [form, setForm] = useState({
    enabled: settings?.enabled ?? true,
    send_after_days: settings?.send_after_days ?? 7,
    reminder_after_days: settings?.reminder_after_days ?? "",
    channel: settings?.channel ?? "email",
    email_subject: settings?.email_subject ?? "How was your order? Leave a review!",
    email_body: settings?.email_body ?? "Hi {{customer_name}},\n\nThanks for your recent purchase. We'd love to hear what you think!\n\n{{review_link}}\n\nThank you!",
    reward_enabled: settings?.reward_enabled ?? false,
    reward_type: settings?.reward_type ?? "discount_pct",
    reward_value: settings?.reward_value ?? 10,
    reward_min_rating: settings?.reward_min_rating ?? 4,
    auto_publish: settings?.auto_publish ?? true,
    auto_publish_min_rating: settings?.auto_publish_min_rating ?? 4,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    await fetch("/api/reviews/request-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, brandId }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function testSend() {
    setTestSending(true);
    await fetch("/api/reviews/test-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandId }) });
    setTestSending(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-ink">Review Requests</div>
            <div className="text-[11px] text-ink-muted">Send post-purchase review requests automatically</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => set("enabled", e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Send after (days)</label>
            <input type="number" value={form.send_after_days} onChange={e => set("send_after_days", +e.target.value)} min={1} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Reminder after (days, optional)</label>
            <input type="number" value={form.reminder_after_days} onChange={e => set("reminder_after_days", e.target.value)} min={1} placeholder="No reminder" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-ink-muted block mb-1.5">Channel</label>
          <div className="flex gap-2">
            {["email", "sms", "both"].map(c => (
              <button key={c} onClick={() => set("channel", c)} className={`flex-1 py-1.5 rounded-lg text-xs border font-medium capitalize transition-colors ${form.channel === c ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Email subject</label>
          <input value={form.email_subject} onChange={e => set("email_subject", e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
        </div>

        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Email body <span className="text-ink-subtle">(supports {"{{customer_name}}"}, {"{{review_link}}"})</span></label>
          <textarea value={form.email_body} onChange={e => set("email_body", e.target.value)} rows={6} className="w-full px-2.5 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none font-mono resize-none" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="text-xs font-semibold text-ink">Reward for Reviews</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Enable reward coupons</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.reward_enabled} onChange={e => set("reward_enabled", e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
          {form.reward_enabled && (
            <div className="space-y-2 pt-1 border-t border-surface-border">
              <div>
                <label className="text-[10px] text-ink-muted block mb-1">Reward type</label>
                <select value={form.reward_type} onChange={e => set("reward_type", e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                  <option value="discount_pct">Discount %</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_product">Free product</option>
                </select>
              </div>
              {form.reward_type !== "free_product" && (
                <div>
                  <label className="text-[10px] text-ink-muted block mb-1">Value ({form.reward_type === "discount_pct" ? "%" : "$"})</label>
                  <input type="number" value={form.reward_value} onChange={e => set("reward_value", +e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
                </div>
              )}
              <div>
                <label className="text-[10px] text-ink-muted block mb-1">Minimum rating to receive reward</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => set("reward_min_rating", v)} className={`flex-1 py-1 rounded-lg text-xs border font-medium transition-colors ${form.reward_min_rating === v ? "bg-amber-100 border-amber-300 text-amber-700" : "border-surface-border text-ink-muted"}`}>{v}★</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <div className="text-xs font-semibold text-ink">Auto-publish</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Auto-approve reviews above threshold</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.auto_publish} onChange={e => set("auto_publish", e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
          {form.auto_publish && (
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Minimum rating to auto-approve</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => set("auto_publish_min_rating", v)} className={`flex-1 py-1 rounded-lg text-xs border font-medium transition-colors ${form.auto_publish_min_rating === v ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>{v}★</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save settings"}
          </button>
          <button onClick={testSend} disabled={testSending} className="btn-outline text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
            {testSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Test send
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportTab({ imports, brandId }: { imports: any[]; brandId: string }) {
  const [source, setSource] = useState<"judgeme" | "csv" | "amazon" | "etsy" | "aliexpress">("judgeme");
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  async function startImport() {
    setImporting(true); setProgress(0);
    const form = new FormData();
    form.append("source", source); form.append("brandId", brandId);
    if (apiKey) form.append("apiKey", apiKey);
    if (file) form.append("file", file);
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 300);
    await fetch("/api/reviews/import", { method: "POST", body: form });
    clearInterval(interval); setProgress(100);
    setTimeout(() => { setImporting(false); setProgress(0); }, 1500);
  }

  const SOURCES = [
    { id: "judgeme", label: "Judge.me", needsKey: true },
    { id: "csv", label: "CSV file", needsKey: false },
    { id: "amazon", label: "Amazon", needsKey: false },
    { id: "etsy", label: "Etsy", needsKey: false },
    { id: "aliexpress", label: "AliExpress", needsKey: false },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card space-y-4">
        <div className="text-xs font-semibold text-ink">Import Reviews</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SOURCES.map(s => (
            <button key={s.id} onClick={() => setSource(s.id)} className={`py-2 px-3 rounded-lg text-xs border font-medium transition-colors ${source === s.id ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted hover:border-ink-muted"}`}>
              {s.label}
            </button>
          ))}
        </div>
        {SOURCES.find(s => s.id === source)?.needsKey && (
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Judge.me API key</label>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="jm_…" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
          </div>
        )}
        <div>
          <label className="text-[10px] text-ink-muted block mb-1.5">File upload {source !== "judgeme" ? "" : "(optional — or use API key)"}</label>
          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${file ? "border-primary-400 bg-primary-50/30" : "border-surface-border hover:border-ink-muted"}`}>
            <Upload className="w-6 h-6 text-ink-muted" />
            <span className="text-xs text-ink-muted">{file ? file.name : "Drop file here or click to browse"}</span>
            <input type="file" accept=".csv,.json,.xlsx" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        {importing && (
          <div className="space-y-1">
            <div className="text-[10px] text-ink-muted">Importing…</div>
            <div className="w-full bg-surface-border rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        <button onClick={startImport} disabled={importing || (!apiKey && !file && source === "judgeme")} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
          {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {importing ? "Importing…" : "Start import"}
        </button>
      </div>

      <div className="card">
        <div className="text-xs font-semibold text-ink mb-3">Import history</div>
        {imports.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted"><RefreshCw className="w-6 h-6 mx-auto mb-2 text-ink-subtle" />No imports yet.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-ink-muted text-[10px] border-b border-surface-border">
              <tr><th className="py-1.5">Source</th><th>Date</th><th>Total</th><th>Imported</th><th>Failed</th><th>Status</th></tr>
            </thead>
            <tbody>
              {imports.map((imp: any) => (
                <tr key={imp.id} className="border-t border-surface-border">
                  <td className="py-1.5 capitalize text-ink">{imp.source}</td>
                  <td className="text-ink-muted">{new Date(imp.created_at).toLocaleDateString()}</td>
                  <td>{imp.total ?? 0}</td>
                  <td className="text-green-600">{imp.imported ?? 0}</td>
                  <td className="text-red-500">{imp.failed ?? 0}</td>
                  <td><Badge variant={imp.status === "done" ? "success" : imp.status === "error" ? "error" : "warn"}>{imp.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UGCTab({ ugcAssets, brandId }: { ugcAssets: any[]; brandId: string }) {
  const [filter, setFilter] = useState<"all" | "photo" | "video" | "high_quality" | "unused">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => ugcAssets.filter(a => {
    if (filter === "photo") return a.type !== "video";
    if (filter === "video") return a.type === "video";
    if (filter === "high_quality") return (a.quality_score ?? 0) >= 8;
    if (filter === "unused") return !a.used_in_ads;
    return true;
  }), [ugcAssets, filter]);

  async function exportToMeta() {
    setExporting(true);
    await fetch("/api/ugc/export-meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], brandId }) });
    setExporting(false); setSelected(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "All" },
          { id: "photo", label: "Photos" },
          { id: "video", label: "Videos" },
          { id: "high_quality", label: "High quality (≥8)" },
          { id: "unused", label: "Unused in ads" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-3 py-1 rounded-lg text-xs border transition-colors ${filter === f.id ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={exportToMeta} disabled={exporting} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
              {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
              Export {selected.size} to Meta Ads
            </button>
          )}
          <span className="text-xs text-ink-muted">{filtered.length} assets</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-12 text-center text-sm text-ink-muted"><ImageIcon className="w-10 h-10 mx-auto mb-2 text-ink-subtle" />No assets match the filter.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(asset => (
            <div key={asset.id} className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selected.has(asset.id) ? "border-primary-500 ring-2 ring-primary-500/30" : "border-surface-border"}`} onClick={() => setSelected(s => { const n = new Set(s); n.has(asset.id) ? n.delete(asset.id) : n.add(asset.id); return n; })}>
              {asset.type === "video" ? (
                <div className="aspect-square bg-surface-tint flex flex-col items-center justify-center gap-1">
                  <Video className="w-8 h-8 text-ink-muted" />
                  <span className="text-[10px] text-ink-muted">Video</span>
                </div>
              ) : (
                <img src={asset.url} alt="" className="aspect-square object-cover w-full" loading="lazy" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="flex items-end justify-between">
                  <div>
                    <Stars rating={asset.review_rating ?? 0} size="xs" />
                    <span className="text-white text-[10px] font-semibold">{asset.quality_score ?? "?"}/10</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {asset.used_in_ads && <span className="text-[9px] bg-green-500 text-white px-1 rounded-full">In ads</span>}
                    {selected.has(asset.id) && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                  </div>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); fetch("/api/ugc/export-meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [asset.id], brandId }) }); }} className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="Export to Meta">
                <ExternalLink className="w-3 h-3 text-blue-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetsTab({ brandId }: { brandId: string }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";
  const shopifySnippet = `{% comment %} Reviews Widget — paste in theme.liquid before </body> {% endcomment %}
<script src="${appUrl}/api/widgets/reviews.js?shop={{ shop.permanent_domain }}&brand=${brandId}" defer></script>`;
  const richSnippet = `<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "{{ product.title }}",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{ product.metafields.reviews.rating }}",
    "reviewCount": "{{ product.metafields.reviews.count }}"
  }
}
</script>`;

  const WIDGETS = [
    { id: "star_badge", label: "Star badge", desc: "Compact star rating for product cards" },
    { id: "carousel", label: "Review carousel", desc: "Scrollable carousel of top reviews" },
    { id: "full_block", label: "Full reviews block", desc: "Complete reviews section with filters" },
    { id: "photo_gallery", label: "Photo gallery", desc: "Grid of customer photos" },
    { id: "review_page", label: "Review page", desc: "Dedicated /reviews page embed" },
  ];

  const [minRating, setMinRating] = useState(4);
  const [numReviews, setNumReviews] = useState(10);
  const [accentColor, setAccentColor] = useState("#7C3AED");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-ink">Widget types</div>
          {WIDGETS.map(w => {
            const embedCode = `<div data-reviews-widget="${w.id}" data-brand="${brandId}" data-min-rating="${minRating}" data-count="${numReviews}" data-color="${accentColor}"></div>`;
            return (
              <div key={w.id} className="card p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-ink">{w.label}</div>
                    <div className="text-[11px] text-ink-muted">{w.desc}</div>
                  </div>
                  <Eye className="w-4 h-4 text-ink-muted" />
                </div>
                <div className="bg-surface-tint rounded-lg p-2 font-mono text-[10px] text-ink-muted break-all">{embedCode}</div>
                <CopyButton text={embedCode} />
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="text-xs font-semibold text-ink">Widget customization</div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Min rating to show</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setMinRating(v)} className={`flex-1 py-1 rounded-lg text-xs border font-medium transition-colors ${minRating === v ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>{v}★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Number of reviews to show</label>
              <input type="number" value={numReviews} onChange={e => setNumReviews(+e.target.value)} min={1} max={50} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Accent color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-surface-border" />
                <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none font-mono" />
              </div>
            </div>
          </div>

          <div className="card space-y-2">
            <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" />Shopify theme.liquid install</div>
            <p className="text-[11px] text-ink-muted">Paste this snippet in your theme.liquid before the closing body tag:</p>
            <div className="bg-surface-tint rounded-lg p-2.5 font-mono text-[10px] text-ink-muted whitespace-pre-wrap break-all">{shopifySnippet}</div>
            <CopyButton text={shopifySnippet} />
          </div>

          <div className="card space-y-2">
            <div className="text-xs font-semibold text-ink">Rich snippets (JSON-LD for SEO)</div>
            <p className="text-[11px] text-ink-muted">Add to product.liquid to enable star ratings in Google search results:</p>
            <div className="bg-surface-tint rounded-lg p-2.5 font-mono text-[10px] text-ink-muted whitespace-pre-wrap">{richSnippet}</div>
            <CopyButton text={richSnippet} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────── */
const TABS = [
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "qa", label: "Q&A", icon: HelpCircle },
  { id: "settings", label: "Request Settings", icon: Settings },
  { id: "import", label: "Import", icon: Upload },
  { id: "ugc", label: "UGC Assets", icon: ImageIcon },
  { id: "widgets", label: "Widgets", icon: Eye },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ReviewsClient({ brandId, reviews, pending, qa, imports, ugcAssets, requestSettings }: Props) {
  const [tab, setTab] = useState<TabId>("reviews");

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? "bg-primary-500/15 text-primary-400 border border-primary-500/20" : "text-ink-muted hover:text-ink border border-transparent hover:border-surface-border"}`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
              {t.id === "reviews" && pending.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 rounded-full">{pending.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "reviews" && <ReviewsTab reviews={reviews} pending={pending} brandId={brandId} />}
      {tab === "qa" && <QATab qa={qa} brandId={brandId} />}
      {tab === "settings" && <RequestSettingsTab settings={requestSettings} brandId={brandId} />}
      {tab === "import" && <ImportTab imports={imports} brandId={brandId} />}
      {tab === "ugc" && <UGCTab ugcAssets={ugcAssets} brandId={brandId} />}
      {tab === "widgets" && <WidgetsTab brandId={brandId} />}
    </>
  );
}
