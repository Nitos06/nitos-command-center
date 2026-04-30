"use client";

import { useState, useMemo } from "react";
import {
  Mail, MessageSquare, Phone, Instagram, Facebook, Send, Tag, Flag,
  User, ShoppingBag, RefreshCw, Percent, Slash, Plus, Trash2, Settings,
  BarChart2, Star, ChevronRight, ChevronDown, Lock, Unlock, Check, X,
  Loader2, CheckCircle2, Clock, AlertTriangle, Edit2, Zap, Bot,
  Globe, Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ── Interfaces ─────────────────────────────── */
interface Props {
  brandId: string;
  tickets: any[];
  messages: any[];
  macros: any[];
  rules: any[];
  faq: any[];
  stats: {
    open: number;
    resolved_today: number;
    avg_response_min: number;
    csat_avg: number;
    sla_breached: number;
  };
}

/* ── Helpers ─────────────────────────────────── */
const CHANNEL_ICON: Record<string, React.ElementType> = {
  email: Mail, chat: MessageSquare, sms: Phone, whatsapp: Phone,
  instagram: Instagram, facebook: Facebook, default: MessageSquare,
};

function ChannelIcon({ channel, className = "w-3.5 h-3.5" }: { channel: string; className?: string }) {
  const Icon = CHANNEL_ICON[channel] ?? CHANNEL_ICON.default;
  return <Icon className={className} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = { urgent: "bg-red-100 text-red-700", high: "bg-amber-100 text-amber-700", normal: "bg-blue-100 text-blue-700", low: "bg-surface-tint text-ink-muted" }[priority] ?? "bg-surface-tint text-ink-muted";
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{priority}</span>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-surface-border"}`} />)}
    </div>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

/* ── Inbox tab ──────────────────────────────── */
function InboxTab({ tickets, brandId, macros }: { tickets: any[]; brandId: string; macros: any[] }) {
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isNote, setIsNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [macroQuery, setMacroQuery] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const CHANNELS = ["all", "email", "chat", "sms", "whatsapp", "instagram", "facebook"];
  const STATUSES = ["open", "pending", "resolved", "closed"];

  const filteredTickets = useMemo(() => tickets.filter(t => {
    if (channelFilter !== "all" && t.channel !== channelFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  }), [tickets, channelFilter, statusFilter]);

  const selectedTicket = tickets.find(t => t.id === selected);
  const ticketMessages = selectedTicket ? [
    { role: "customer", body: selectedTicket.first_message || selectedTicket.subject, ts: selectedTicket.created_at },
    ...(selectedTicket.replies ?? []),
  ] : [];

  const filteredMacros = macros.filter(m => !macroQuery || m.name.toLowerCase().includes(macroQuery.toLowerCase()));

  async function send(close = false) {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    await fetch("/api/cs/reply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: selected, body: replyText, isNote, brandId, close }),
    });
    setSending(false); setReplyText(""); setShowMacros(false);
    if (close) setSelected(null);
  }

  async function shopifyAction(action: string) {
    await fetch("/api/cs/shopify-action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ticketId: selected, brandId }),
    });
  }

  function applyMacro(macro: any) {
    let body = macro.body ?? "";
    if (selectedTicket) {
      body = body.replace(/\{\{customer\.name\}\}/g, selectedTicket.customer_name ?? "there")
                 .replace(/\{\{order\.number\}\}/g, selectedTicket.order_number ?? "#—");
    }
    setReplyText(body); setShowMacros(false); setMacroQuery("");
  }

  return (
    <div className="flex gap-3 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Left sidebar: filters */}
      <div className="w-44 flex-shrink-0 space-y-2">
        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold px-1">Channel</div>
        {CHANNELS.map(c => {
          const count = tickets.filter(t => c === "all" ? true : t.channel === c).length;
          return (
            <button key={c} onClick={() => setChannelFilter(c)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${channelFilter === c ? "bg-primary-500/15 text-primary-400" : "text-ink-muted hover:text-ink hover:bg-surface-tint"}`}>
              <ChannelIcon channel={c} className="w-3 h-3 flex-shrink-0" />
              <span className="capitalize flex-1 text-left">{c === "all" ? "All channels" : c}</span>
              {count > 0 && <span className="text-[10px] bg-surface-border text-ink-muted px-1.5 rounded-full">{count}</span>}
            </button>
          );
        })}
        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold px-1 pt-2">Status</div>
        {STATUSES.map(s => {
          const count = tickets.filter(t => t.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors capitalize ${statusFilter === s ? "bg-primary-500/15 text-primary-400" : "text-ink-muted hover:text-ink hover:bg-surface-tint"}`}>
              {s}
              {count > 0 && <span className="ml-auto text-[10px] bg-surface-border text-ink-muted px-1.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Center: ticket list */}
      <div className="w-72 flex-shrink-0 overflow-y-auto space-y-1 border-r border-surface-border pr-3">
        {filteredTickets.length === 0 && (
          <div className="py-10 text-center text-xs text-ink-muted">No tickets match this filter.</div>
        )}
        {filteredTickets.map(t => {
          const slaBreached = t.sla_deadline && new Date(t.sla_deadline) < new Date();
          return (
            <button key={t.id} onClick={() => setSelected(t.id)} className={`w-full text-left p-2.5 rounded-xl transition-colors border ${selected === t.id ? "bg-primary-50/50 border-primary-200" : "bg-transparent border-transparent hover:bg-surface-tint"}`}>
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <ChannelIcon channel={t.channel} className="w-3 h-3 text-ink-muted flex-shrink-0" />
                  <span className="text-xs font-medium text-ink truncate max-w-[130px]">{t.customer_name || t.customer_email || "Unknown"}</span>
                </div>
                <span className="text-[10px] text-ink-subtle whitespace-nowrap">{relTime(t.created_at)}</span>
              </div>
              <div className="text-[11px] text-ink truncate mb-1">{t.subject || "(no subject)"}</div>
              <div className="text-[10px] text-ink-muted truncate mb-1.5">{t.first_message_snippet || "…"}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <PriorityBadge priority={t.priority ?? "normal"} />
                {slaBreached && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />SLA</span>}
                {t.tags?.slice(0, 2).map((tag: string) => <span key={tag} className="text-[10px] bg-surface-tint text-ink-muted px-1.5 py-0.5 rounded-full">{tag}</span>)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: ticket detail */}
      <div className="flex-1 overflow-hidden flex gap-3">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">Select a ticket to view</div>
        ) : (
          <>
            {/* Message thread */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div>
                  <div className="text-sm font-semibold text-ink">{selectedTicket.subject || "(no subject)"}</div>
                  <div className="text-[11px] text-ink-muted flex items-center gap-2">
                    <ChannelIcon channel={selectedTicket.channel} className="w-3 h-3" />
                    <span className="capitalize">{selectedTicket.channel}</span>
                    <span>·</span>
                    <PriorityBadge priority={selectedTicket.priority ?? "normal"} />
                    {selectedTicket.assigned_to && <span>· Assigned: {selectedTicket.assigned_to}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <select className="px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                    {["normal","high","urgent","low"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select className="px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" defaultValue="">
                    <option value="">Assign to…</option>
                    <option>Me</option>
                    <option>Support Team</option>
                  </select>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {ticketMessages.map((msg: any, i: number) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === "agent" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.role === "agent" ? "bg-primary-500 text-white" : "bg-surface-tint text-ink-muted"}`}>
                      {msg.role === "agent" ? "A" : "C"}
                    </div>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.is_note ? "bg-amber-50 border border-amber-200 text-amber-900" : msg.role === "agent" ? "bg-primary-500/15 text-ink" : "bg-surface-tint text-ink"}`}>
                      {msg.is_note && <div className="text-[10px] text-amber-600 font-semibold mb-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" />Internal note</div>}
                      {msg.body}
                      <div className="text-[10px] text-ink-muted mt-1">{new Date(msg.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <div className="flex-shrink-0 border-t border-surface-border pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => setIsNote(false)} className={`px-2.5 py-1 rounded-lg border transition-colors ${!isNote ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>
                    <Unlock className="w-3 h-3 inline mr-1" />Reply
                  </button>
                  <button onClick={() => setIsNote(true)} className={`px-2.5 py-1 rounded-lg border transition-colors ${isNote ? "bg-amber-100 border-amber-300 text-amber-700" : "border-surface-border text-ink-muted"}`}>
                    <Lock className="w-3 h-3 inline mr-1" />Note
                  </button>
                  <div className="relative ml-2">
                    <button onClick={() => setShowMacros(!showMacros)} className="btn-outline text-xs px-2 py-1 flex items-center gap-1">
                      <Slash className="w-3 h-3" /> Macro
                    </button>
                    {showMacros && (
                      <div className="absolute bottom-full mb-1 left-0 w-64 bg-white border border-surface-border rounded-xl shadow-lg z-20 p-2">
                        <input value={macroQuery} onChange={e => setMacroQuery(e.target.value)} placeholder="Search macros…" className="w-full px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none mb-1" autoFocus />
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {filteredMacros.length === 0 ? <div className="text-xs text-ink-muted px-2 py-2">No macros found</div> : filteredMacros.map(m => (
                            <button key={m.id} onClick={() => applyMacro(m)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-tint text-xs text-ink transition-colors">
                              <span className="text-ink-muted mr-1">/</span>{m.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px] text-ink-muted">
                      Tags:
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && tagInput) { setTags(t => [...t, tagInput]); setTagInput(""); } }} placeholder="add tag…" className="px-2 py-0.5 rounded bg-surface-tint border border-surface-border text-[11px] w-20 focus:outline-none" />
                    </label>
                    {tags.map(tag => <span key={tag} className="text-[10px] bg-surface-tint text-ink-muted px-1.5 py-0.5 rounded-full flex items-center gap-1">{tag}<button onClick={() => setTags(t => t.filter(x => x !== tag))}><X className="w-2.5 h-2.5" /></button></span>)}
                  </div>
                </div>
                <textarea
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); if (e.target.value.includes("/")) setShowMacros(true); }}
                  placeholder={isNote ? "Internal note (not visible to customer)…" : "Reply to customer…"}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border text-xs text-ink focus:outline-none resize-none ${isNote ? "bg-amber-50 border-amber-200 focus:ring-amber-300" : "bg-surface-tint border-surface-border focus:ring-1 focus:ring-primary-400"}`}
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => send(false)} disabled={sending || !replyText.trim()} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                    {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send
                  </button>
                  <button onClick={() => send(true)} disabled={sending || !replyText.trim()} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                    <CheckCircle2 className="w-3 h-3" /> Send & Close
                  </button>
                </div>
              </div>
            </div>

            {/* Customer sidebar */}
            <div className="w-60 flex-shrink-0 overflow-y-auto space-y-3">
              <div className="card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500/15 text-primary-500 flex items-center justify-center font-bold text-sm">
                    {(selectedTicket.customer_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink">{selectedTicket.customer_name || "Unknown"}</div>
                    <div className="text-[10px] text-ink-muted">{selectedTicket.customer_email || "—"}</div>
                  </div>
                </div>
                <div className="space-y-1 text-[11px]">
                  {[
                    ["Handle", selectedTicket.customer_handle || "—"],
                    ["Total orders", selectedTicket.total_orders ?? "—"],
                    ["Lifetime value", selectedTicket.lifetime_value ? `$${selectedTicket.lifetime_value}` : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-ink-muted">{k}</span>
                      <span className="font-medium text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-3 space-y-2">
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold flex items-center gap-1.5"><ShoppingBag className="w-3 h-3" />Last orders</div>
                {(selectedTicket.recent_orders ?? []).length === 0 ? (
                  <div className="text-xs text-ink-muted">No orders found.</div>
                ) : (
                  (selectedTicket.recent_orders ?? []).slice(0, 3).map((o: any, i: number) => (
                    <div key={i} className="text-xs border-b border-surface-border pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium text-ink">#{o.order_number}</span>
                        <span className="text-ink-muted">{o.total_price ? `$${o.total_price}` : "—"}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">{o.fulfillment_status || o.financial_status || "—"}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="card p-3 space-y-1.5">
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2">Shopify Actions</div>
                {[
                  { label: "Issue Refund", icon: RefreshCw, action: "refund" },
                  { label: "Cancel Order", icon: X, action: "cancel" },
                  { label: "Generate Discount", icon: Percent, action: "discount" },
                ].map(a => (
                  <button key={a.action} onClick={() => shopifyAction(a.action)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border border-surface-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors">
                    <a.icon className="w-3 h-3" /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Macros tab ─────────────────────────────── */
function MacrosTab({ macros, brandId }: { macros: any[]; brandId: string }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", shortcut: "", body: "", channel: "all" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const VARS = ["{{customer.name}}", "{{order.number}}", "{{order.total}}", "{{shop.name}}"];

  async function save() {
    if (!form.name || !form.body) return;
    setSaving(true);
    await fetch("/api/cs/macros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, brandId }) });
    setSaving(false); setSaved(true); setCreating(false); setForm({ name: "", shortcut: "", body: "", channel: "all" });
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Response Macros</div>
        <button onClick={() => setCreating(!creating)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
          <Plus className="w-3 h-3" /> New Macro
        </button>
      </div>

      {creating && (
        <div className="card space-y-3">
          <div className="text-xs font-semibold text-ink">New macro</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Refund Approved" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Shortcut (e.g. /refund)</label>
              <input value={form.shortcut} onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))} placeholder="/refund" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Channel</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                <option value="all">All channels</option>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Insert variable</label>
              <div className="flex flex-wrap gap-1">
                {VARS.map(v => <button key={v} onClick={() => setForm(f => ({ ...f, body: f.body + v }))} className="text-[10px] bg-surface-tint border border-surface-border text-ink-muted px-1.5 py-0.5 rounded hover:border-ink-muted transition-colors font-mono">{v}</button>)}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Body</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} placeholder="Hi {{customer.name}}, your order #{{order.number}} has been…" className="w-full px-2.5 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name || !form.body} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : <Check className="w-3 h-3" />} Save
            </button>
            <button onClick={() => setCreating(false)} className="btn-outline text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-ink-muted text-xs border-b border-surface-border">
            <tr><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Shortcut</th><th className="py-2 pr-4">Channel</th><th className="py-2 pr-4">Used</th><th className="py-2">Preview</th></tr>
          </thead>
          <tbody>
            {macros.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-xs text-ink-muted">No macros yet. Create one above.</td></tr>}
            {macros.map((m: any) => (
              <tr key={m.id} className="border-t border-surface-border hover:bg-surface-tint/40 transition-colors">
                <td className="py-2 pr-4 text-xs font-medium text-ink">{m.name}</td>
                <td className="py-2 pr-4 font-mono text-xs text-ink-muted">{m.shortcut || "—"}</td>
                <td className="py-2 pr-4 text-xs text-ink-muted capitalize">{m.channel || "all"}</td>
                <td className="py-2 pr-4 text-xs text-ink-muted">{m.usage_count ?? 0}×</td>
                <td className="py-2 text-[11px] text-ink-muted max-w-[200px] truncate">{m.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Rules tab ──────────────────────────────── */
function RulesTab({ rules, brandId }: { rules: any[]; brandId: string }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "ticket_created",
    logic: "and" as "and" | "or",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
    actions: [{ type: "assign_tag", value: "" }],
  });
  const [saving, setSaving] = useState(false);

  function addCondition() { setForm(f => ({ ...f, conditions: [...f.conditions, { field: "subject", operator: "contains", value: "" }] })); }
  function removeCondition(i: number) { setForm(f => ({ ...f, conditions: f.conditions.filter((_, j) => j !== i) })); }
  function setCondition(i: number, k: string, v: string) { setForm(f => ({ ...f, conditions: f.conditions.map((c, j) => j === i ? { ...c, [k]: v } : c) })); }
  function addAction() { setForm(f => ({ ...f, actions: [...f.actions, { type: "assign_tag", value: "" }] })); }
  function removeAction(i: number) { setForm(f => ({ ...f, actions: f.actions.filter((_, j) => j !== i) })); }
  function setAction(i: number, k: string, v: string) { setForm(f => ({ ...f, actions: f.actions.map((a, j) => j === i ? { ...a, [k]: v } : a) })); }

  async function save() {
    setSaving(true);
    await fetch("/api/cs/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, brandId }) });
    setSaving(false); setCreating(false);
  }

  const FIELDS = ["subject", "channel", "tag", "customer_email", "body"];
  const OPERATORS = ["contains", "equals", "starts_with", "ends_with", "not_contains"];
  const ACTION_TYPES = ["assign_tag", "set_priority", "assign_to", "send_macro", "close_ticket"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Automation Rules</div>
        <button onClick={() => setCreating(!creating)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
          <Plus className="w-3 h-3" /> New Rule
        </button>
      </div>

      {creating && (
        <div className="card space-y-4">
          <div className="text-xs font-semibold text-ink">New rule</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Rule name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tag urgent orders" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Trigger</label>
              <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                <option value="ticket_created">Ticket created</option>
                <option value="message_received">Message received</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider">Conditions</span>
              <div className="flex gap-1">
                {(["and", "or"] as const).map(l => (
                  <button key={l} onClick={() => setForm(f => ({ ...f, logic: l }))} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border transition-colors ${form.logic === l ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>{l}</button>
                ))}
              </div>
            </div>
            {form.conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select value={c.field} onChange={e => setCondition(i, "field", e.target.value)} className="px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                  {FIELDS.map(f => <option key={f}>{f}</option>)}
                </select>
                <select value={c.operator} onChange={e => setCondition(i, "operator", e.target.value)} className="px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                  {OPERATORS.map(op => <option key={op}>{op}</option>)}
                </select>
                <input value={c.value} onChange={e => setCondition(i, "value", e.target.value)} placeholder="value…" className="flex-1 px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
                <button onClick={() => removeCondition(i)} className="p-1 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={addCondition} className="btn-outline text-xs px-2.5 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add condition</button>
          </div>

          <div>
            <div className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider mb-2">Actions</div>
            {form.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select value={a.type} onChange={e => setAction(i, "type", e.target.value)} className="px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
                  {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
                {a.type !== "close_ticket" && (
                  <input value={a.value} onChange={e => setAction(i, "value", e.target.value)} placeholder="value…" className="flex-1 px-2 py-1 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
                )}
                <button onClick={() => removeAction(i)} className="p-1 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={addAction} className="btn-outline text-xs px-2.5 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add action</button>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save rule
            </button>
            <button onClick={() => setCreating(false)} className="btn-outline text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rules.length === 0 && !creating && <div className="card py-8 text-center text-xs text-ink-muted">No automation rules yet.</div>}
        {rules.map((r: any) => (
          <div key={r.id} className="card p-3 flex items-start gap-3">
            <Zap className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-ink">{r.name}</span>
                <span className="text-[10px] bg-surface-tint text-ink-muted px-1.5 py-0.5 rounded">on {(r.trigger || "").replace(/_/g, " ")}</span>
                <span className="text-[10px] text-ink-subtle">· {r.times_fired ?? 0}× fired</span>
              </div>
              <div className="text-[11px] text-ink-muted">{JSON.stringify(r.conditions ?? [])}</div>
              <div className="text-[11px] text-ink-muted">→ {JSON.stringify(r.actions ?? [])}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" defaultChecked={r.active} className="sr-only peer" onChange={async e => {
                await fetch("/api/cs/rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, active: e.target.checked }) });
              }} />
              <div className="w-8 h-4 bg-surface-border rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CSAT tab ───────────────────────────────── */
function CSATTab({ tickets, stats }: { tickets: any[]; stats: Props["stats"] }) {
  const responses = tickets.filter(t => t.csat_score != null);
  const responseRate = tickets.length ? Math.round(responses.length / tickets.length * 100) : 0;
  const distData = [1,2,3,4,5].map(s => ({ star: `${s}★`, count: responses.filter(t => t.csat_score === s).length }));
  const COLORS = ["#EF4444","#F97316","#EAB308","#22C55E","#10B981"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-ink mb-1">{stats.csat_avg ? stats.csat_avg.toFixed(1) : "—"}</div>
          <Stars rating={Math.round(stats.csat_avg ?? 0)} />
          <div className="text-[11px] text-ink-muted mt-1">Average CSAT</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-ink">{responses.length}</div>
          <div className="text-[11px] text-ink-muted mt-1">Total responses</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-ink">{responseRate}%</div>
          <div className="text-[11px] text-ink-muted mt-1">Response rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs font-semibold text-ink mb-3">Score distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distData} barSize={28}>
              <XAxis dataKey="star" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {distData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-y-auto max-h-64">
          <div className="text-xs font-semibold text-ink mb-3">CSAT comments</div>
          {responses.filter(t => t.csat_comment).length === 0 ? (
            <div className="text-xs text-ink-muted">No comments yet.</div>
          ) : (
            <div className="space-y-2">
              {responses.filter(t => t.csat_comment).map((t: any) => (
                <div key={t.id} className="border-b border-surface-border pb-2 last:border-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Stars rating={t.csat_score} />
                    <span className="text-[10px] text-ink-muted">{new Date(t.updated_at || t.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-ink">{t.csat_comment}</div>
                  <div className="text-[10px] text-ink-muted mt-0.5">Ticket #{t.id?.slice(0,8)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Analytics tab ──────────────────────────── */
function AnalyticsTab({ tickets, stats }: { tickets: any[]; stats: Props["stats"] }) {
  const thisWeek = tickets.filter(t => {
    const d = new Date(t.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= weekAgo;
  }).length;

  const resolved = tickets.filter(t => t.status === "resolved").length;
  const resolutionRate = tickets.length ? Math.round(resolved / tickets.length * 100) : 0;

  const channelCounts = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.channel || "unknown"] = (acc[t.channel || "unknown"] || 0) + 1;
    return acc;
  }, {});
  const channelData = Object.entries(channelCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#7C3AED","#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6"];

  const revenueImpact = tickets.reduce((s, t) => s + (t.revenue_impact ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tickets this week", value: String(thisWeek) },
          { label: "Avg first response", value: stats.avg_response_min ? `${Math.round(stats.avg_response_min)} min` : "—" },
          { label: "Resolution rate", value: `${resolutionRate}%` },
          { label: "Revenue driven", value: revenueImpact ? `$${revenueImpact.toLocaleString()}` : "—" },
        ].map(k => (
          <div key={k.label} className="card py-3 px-4 text-center">
            <div className="text-xl font-bold text-ink">{k.value}</div>
            <div className="text-[11px] text-ink-muted mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs font-semibold text-ink mb-3">Channel breakdown</div>
          {channelData.length === 0 ? (
            <div className="text-xs text-ink-muted">No data yet.</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={channelData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {channelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {channelData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize text-ink-muted">{d.name}</span>
                    <span className="ml-auto font-medium text-ink">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="text-xs font-semibold text-ink mb-3">SLA status</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted text-xs">SLA breached</span>
              <span className="font-bold text-red-600">{stats.sla_breached}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted text-xs">Open tickets</span>
              <span className="font-bold text-ink">{stats.open}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted text-xs">Resolved today</span>
              <span className="font-bold text-green-600">{stats.resolved_today}</span>
            </div>
            {stats.sla_breached > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {stats.sla_breached} ticket{stats.sla_breached !== 1 ? "s" : ""} exceeded SLA targets
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Settings tab ───────────────────────────── */
function SettingsTab({ brandId }: { brandId: string }) {
  const [sla, setSla] = useState({ urgent: 30, high: 120, normal: 480, low: 1440 });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiTone, setAiTone] = useState("friendly");
  const [soPs, setSoPs] = useState("");
  const [bizHours, setBizHours] = useState({ start: "09:00", end: "22:00", tz: "Asia/Jerusalem" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";

  async function save() {
    setSaving(true);
    await fetch("/api/cs/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sla, aiEnabled, aiTone, soPs, bizHours, brandId }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-500" />SLA Targets (minutes)</div>
          {(["urgent","high","normal","low"] as const).map(p => (
            <div key={p} className="flex items-center gap-3">
              <span className="text-xs text-ink-muted capitalize w-14">{p}</span>
              <input type="number" value={sla[p]} onChange={e => setSla(s => ({ ...s, [p]: +e.target.value }))} min={1} className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
              <span className="text-xs text-ink-muted">min</span>
            </div>
          ))}
        </div>

        <div className="card space-y-3">
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-500" />Business Hours</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Opens at</label>
              <input type="time" value={bizHours.start} onChange={e => setBizHours(b => ({ ...b, start: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Closes at</label>
              <input type="time" value={bizHours.end} onChange={e => setBizHours(b => ({ ...b, end: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Timezone</label>
            <select value={bizHours.tz} onChange={e => setBizHours(b => ({ ...b, tz: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none">
              {["Asia/Jerusalem","Europe/London","America/New_York","America/Los_Angeles","UTC"].map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-primary-500" />AI Agent</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Enable AI agent</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiEnabled} onChange={e => setAiEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
          {aiEnabled && (
            <>
              <div>
                <label className="text-[10px] text-ink-muted block mb-1">Tone</label>
                <div className="flex gap-2">
                  {["friendly","professional","concise"].map(t => (
                    <button key={t} onClick={() => setAiTone(t)} className={`flex-1 py-1 rounded-lg text-xs border font-medium capitalize transition-colors ${aiTone === t ? "bg-primary-500/15 border-primary-500/30 text-primary-400" : "border-surface-border text-ink-muted"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-ink-muted block mb-1">SOPs summary (what the agent should know)</label>
                <textarea value={soPs} onChange={e => setSoPs(e.target.value)} rows={4} placeholder="e.g. Our return policy is 30 days. Free shipping over $50. Never offer > 20% discount without manager approval…" className="w-full px-2.5 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none resize-none" />
              </div>
            </>
          )}
        </div>

        <div className="card space-y-2">
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-primary-500" />Chat Widget</div>
          <p className="text-[11px] text-ink-muted">Embed on any website page before the closing body tag:</p>
          <div className="bg-surface-tint rounded-lg p-2.5 font-mono text-[10px] text-ink-muted break-all">{`<script src="${appUrl}/api/chat-widget.js?brand=${brandId}" defer></script>`}</div>
          <button onClick={() => navigator.clipboard.writeText(`<script src="${appUrl}/api/chat-widget.js?brand=${brandId}" defer></script>`)} className="btn-outline text-xs px-2.5 py-1 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Copy snippet
          </button>
          <div className="flex items-center gap-2 text-xs text-ink-muted pt-2 border-t border-surface-border">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            Email connected · Chat widget active
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────── */
const TABS = [
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "macros", label: "Macros", icon: Slash },
  { id: "rules", label: "Rules", icon: Zap },
  { id: "csat", label: "CSAT", icon: Star },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];

export function GorgiasClient({ brandId, tickets, messages, macros, rules, faq, stats }: Props) {
  const [tab, setTab] = useState<TabId>("inbox");
  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <>
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Open", value: stats.open, warn: stats.open > 20 },
          { label: "Resolved today", value: stats.resolved_today, good: true },
          { label: "Avg response", value: stats.avg_response_min ? `${Math.round(stats.avg_response_min)}m` : "—", warn: stats.avg_response_min > 60 },
          { label: "CSAT", value: stats.csat_avg ? `${stats.csat_avg.toFixed(1)}/5` : "—" },
          { label: "SLA breached", value: stats.sla_breached, warn: stats.sla_breached > 0 },
        ].map(k => (
          <div key={k.label} className={`card py-2.5 px-3 text-center ${(k as any).warn && String(k.value) !== "0" && String(k.value) !== "—" ? "border-red-200" : (k as any).good ? "border-green-200" : ""}`}>
            <div className={`text-xl font-bold ${(k as any).warn && String(k.value) !== "0" ? "text-red-600" : (k as any).good ? "text-green-600" : "text-ink"}`}>{k.value}</div>
            <div className="text-[11px] text-ink-muted">{k.label}</div>
          </div>
        ))}
      </div>

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
              {t.id === "inbox" && openCount > 0 && (
                <span className="ml-1 bg-primary-500 text-white text-[9px] font-bold px-1.5 rounded-full">{openCount}</span>
              )}
              {t.id === "inbox" && stats.sla_breached > 0 && (
                <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">{stats.sla_breached}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "inbox" && <InboxTab tickets={tickets} brandId={brandId} macros={macros} />}
      {tab === "macros" && <MacrosTab macros={macros} brandId={brandId} />}
      {tab === "rules" && <RulesTab rules={rules} brandId={brandId} />}
      {tab === "csat" && <CSATTab tickets={tickets} stats={stats} />}
      {tab === "analytics" && <AnalyticsTab tickets={tickets} stats={stats} />}
      {tab === "settings" && <SettingsTab brandId={brandId} />}
    </>
  );
}
