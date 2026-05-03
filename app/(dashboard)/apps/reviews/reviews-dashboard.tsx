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
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "xs" | "sm" | "md" }) {
  const sz = size === "xs" ? "w-3 h-3" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
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
    default: "bg-gray-100 text-gray-600",
  }[variant];
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

export default function ReviewsDashboard({ brandId, reviews, pending }: Props) {
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
    await fetch("/api/apps/reviews/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: act, brandId }) });
    setSaving(false);
  }

  async function submitReply(id: string) {
    if (!replyText.trim()) return;
    setSaving(true);
    await fetch("/api/apps/reviews/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reply: replyText, brandId }) });
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
      {/* How it works */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⭐</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">How Reviews & UGC works</div>
            <div className="text-xs text-gray-500">Configure → connect → live on store</div>
          </div>
          <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Full pipeline</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">① Configure</div>
            <div className="text-xs text-gray-700">Review requests send automatically after every fulfilled Shopify order. Customize the email template in Request Settings. Set minimum star rating for auto-publish.</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">② Connect</div>
            <div className="text-xs text-gray-700">The review widget embeds on your product pages via the Shopify theme extension. Review request emails are sent via Amazon SES.</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">③ Viral Loop</div>
            <div className="text-xs text-gray-700">5-star reviews with media are flagged as UGC assets and queued for Meta lookalike export. Customer info stored for ad creation. Segment auto-pushed to email app.</div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Avg rating", value: avgRating.toFixed(1) },
          { label: "Total", value: reviews.length },
          { label: "5-star %", value: `${fiveStar}%` },
          { label: "Verified %", value: `${verified}%` },
          { label: "With media %", value: `${withMedia}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 py-2.5 px-3 text-center">
            <div className="text-lg font-bold text-gray-900">{s.value}</div>
            <div className="text-[10px] text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…" className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>
        <div className="flex items-center gap-1">
          {[null, 5, 4, 3, 2, 1].map(r => (
            <button key={r ?? "all"} onClick={() => setRatingFilter(r)} className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs border transition-colors ${ratingFilter === r ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {r ? <><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{r}</> : "All"}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none">
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          {selected.size > 0 && (
            <>
              <button onClick={() => { selected.forEach(id => action(id, "approve")); setSelected(new Set()); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-green-300 text-xs text-green-600 hover:bg-green-50">
                <Check className="w-3 h-3" /> Approve ({selected.size})
              </button>
              <button onClick={() => { selected.forEach(id => action(id, "reject")); setSelected(new Set()); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-300 text-xs text-red-600 hover:bg-red-50">
                <X className="w-3 h-3" /> Reject ({selected.size})
              </button>
            </>
          )}
          {pending.length > 0 && (
            <button onClick={() => pending.forEach(p => action(p.id, "approve"))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              <Zap className="w-3 h-3" /> Approve all pending ({pending.length})
            </button>
          )}
          <button onClick={exportCsv} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-gray-500 text-xs border-b border-gray-200">
            <tr>
              <th className="py-2 px-3 w-8">
                <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())} />
              </th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Rating</th>
              <th className="py-2 pr-3">Review</th>
              <th className="py-2 pr-3">Media</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-10 text-center text-gray-400 text-xs">No reviews match your filters.</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/40 transition-colors">
                <td className="py-2 px-3">
                  <input type="checkbox" className="rounded" checked={selected.has(r.id)} onChange={e => setSelected(s => { const n = new Set(s); e.target.checked ? n.add(r.id) : n.delete(r.id); return n; })} />
                </td>
                <td className="py-2 pr-3">
                  <div className="font-medium text-gray-900 text-xs leading-snug">{r.author_name || "Anonymous"}</div>
                  {r.verified_purchase && <Badge variant="success">Verified</Badge>}
                </td>
                <td className="py-2 pr-3 text-xs text-gray-500 max-w-[140px] truncate">{r.product_title || "—"}</td>
                <td className="py-2 pr-3"><Stars rating={r.rating} size="xs" /></td>
                <td className="py-2 pr-3 max-w-[200px]">
                  {r.title && <div className="text-xs font-medium text-gray-900 truncate">{r.title}</div>}
                  <div className="text-[11px] text-gray-500 truncate">{r.body}</div>
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-1">
                    {r.photos?.length > 0 && <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><ImageIcon className="w-3 h-3" />{r.photos.length}</span>}
                    {r.video_url && <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Video className="w-3 h-3" />1</span>}
                  </div>
                </td>
                <td className="py-2 pr-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="py-2 pr-3">
                  <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "error" : "warn"}>
                    {r.status}
                  </Badge>
                </td>
                <td className="py-2 pr-3">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Auto-publish config */}
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-4 p-3">
        <div>
          <div className="text-xs font-medium text-gray-900">Auto-publish reviews</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Automatically approve reviews with rating ≥ threshold</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Min rating:
            <select className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none">
              {[4, 3, 5].map(v => <option key={v} value={v}>{v} stars</option>)}
            </select>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      </div>
    </div>
  );
}
