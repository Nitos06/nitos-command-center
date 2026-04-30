"use client";

import { useState, useRef } from "react";
import {
  Mail, MessageSquare, Smartphone, CheckCircle2, Clock, Tag,
  Send, X, Plus, Trash2, Copy, Bot, Star,
  ToggleLeft, ToggleRight, Search, Zap, Settings, BarChart2,
  AlertCircle, MessageCircle, Instagram, Facebook, RefreshCw,
  Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  brandId: string;
  tickets: any[];
  macros: any[];
  rules: any[];
  faq: any[];
  agentLogs: any[];
  stats: {
    open: number;
    resolved_today: number;
    avg_response_min: number;
    csat_avg: number;
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel) {
    case "email":     return <Mail className="w-3.5 h-3.5 text-blue-500" />;
    case "chat":      return <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />;
    case "sms":       return <Smartphone className="w-3.5 h-3.5 text-green-600" />;
    case "whatsapp":  return <MessageCircle className="w-3.5 h-3.5 text-green-500" />;
    case "instagram": return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
    case "facebook":  return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
    default:          return <Mail className="w-3.5 h-3.5 text-gray-400" />;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high:   "bg-orange-100 text-orange-700",
    normal: "bg-gray-100 text-gray-600",
    low:    "bg-gray-50 text-gray-400",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${map[priority] ?? map.normal}`}>
      {priority ?? "normal"}
    </span>
  );
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const CHANNEL_FILTERS = [
  { id: "all",       label: "All",          icon: <Filter className="w-3.5 h-3.5" /> },
  { id: "email",     label: "Email ✉️",     icon: <Mail className="w-3.5 h-3.5 text-blue-500" /> },
  { id: "chat",      label: "Chat 💬",      icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> },
  { id: "sms",       label: "SMS 📱",       icon: <Smartphone className="w-3.5 h-3.5 text-green-600" /> },
  { id: "whatsapp",  label: "WhatsApp 🟢",  icon: <MessageCircle className="w-3.5 h-3.5 text-green-500" /> },
  { id: "instagram", label: "IG DM 📷",     icon: <Instagram className="w-3.5 h-3.5 text-pink-500" /> },
  { id: "facebook",  label: "FB Messenger 🔵", icon: <Facebook className="w-3.5 h-3.5 text-blue-600" /> },
];

const STATUS_FILTERS = ["open", "pending", "resolved"] as const;

const CHANNEL_COLORS: Record<string, string> = {
  email:     "#3b82f6",
  chat:      "#6366f1",
  sms:       "#22c55e",
  whatsapp:  "#16a34a",
  instagram: "#ec4899",
  facebook:  "#2563eb",
};

const RULE_FIELDS       = ["subject", "channel", "tag", "priority", "customer_email"];
const RULE_OPS          = ["contains", "equals", "starts_with", "not_contains"];
const RULE_ACTION_TYPES = ["assign_tag", "set_priority", "send_macro", "close_ticket", "assign_to"];
const MACRO_VARS        = ["{{customer.name}}", "{{order.number}}", "{{order.total}}", "{{shop.name}}"];

// ── INBOX TAB ─────────────────────────────────────────────────────────────────
function InboxTab({ tickets, macros, brandId }: { tickets: any[]; macros: any[]; brandId: string }) {
  const [channelFilter, setChannelFilter]     = useState("all");
  const [statusFilter, setStatusFilter]       = useState("open");
  const [selectedTicket, setSelectedTicket]   = useState<any>(null);
  const [replyBody, setReplyBody]             = useState("");
  const [macroSearch, setMacroSearch]         = useState("");
  const [showMacroPicker, setShowMacroPicker] = useState(false);
  const [isNote, setIsNote]                   = useState(false);
  const [sending, setSending]                 = useState(false);
  const [shopifyAction, setShopifyAction]     = useState<null | "refund" | "discount">(null);
  const [shopifyInput, setShopifyInput]       = useState("");
  const [shopifyResult, setShopifyResult]     = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filtered = tickets
    .filter((t) => channelFilter === "all" || t.channel === channelFilter)
    .filter((t) => t.status === statusFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const countFor = (status: string) =>
    tickets.filter((t) => (channelFilter === "all" || t.channel === channelFilter) && t.status === status).length;

  function handleReplyChange(val: string) {
    setReplyBody(val);
    const lastSlashIdx = val.lastIndexOf("/");
    if (lastSlashIdx !== -1 && lastSlashIdx === val.length - 1) {
      setShowMacroPicker(true);
      setMacroSearch("");
    } else if (showMacroPicker && lastSlashIdx !== -1) {
      setMacroSearch(val.slice(lastSlashIdx + 1));
    } else if (showMacroPicker && lastSlashIdx === -1) {
      setShowMacroPicker(false);
    }
  }

  function insertMacro(macro: any) {
    const body = (macro.body ?? "")
      .replace(/\{\{customer\.name\}\}/g, selectedTicket?.customer_name ?? "Customer")
      .replace(/\{\{order\.number\}\}/g, selectedTicket?.order_number ?? "#0000")
      .replace(/\{\{order\.total\}\}/g, selectedTicket?.order_total ?? "0.00")
      .replace(/\{\{shop\.name\}\}/g, "Our Store");
    const lastSlash = replyBody.lastIndexOf("/");
    setReplyBody((lastSlash !== -1 ? replyBody.slice(0, lastSlash) : replyBody) + body);
    setShowMacroPicker(false);
  }

  async function sendReply(close: boolean) {
    if (!selectedTicket || !replyBody.trim()) return;
    setSending(true);
    await fetch(`/api/cs/${selectedTicket.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody, close, is_note: isNote }),
    });
    setSending(false);
    setReplyBody("");
  }

  async function doShopifyAction(action: string) {
    if (!selectedTicket) return;
    const res = await fetch("/api/cs/shopify-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ticketId: selectedTicket.id, value: shopifyInput }),
    });
    const data = await res.json().catch(() => ({}));
    setShopifyResult(data.code ?? data.message ?? "Done");
    setShopifyAction(null);
    setShopifyInput("");
  }

  const filteredMacros = macros.filter((m) =>
    (m.shortcut ?? "").toLowerCase().includes(macroSearch.toLowerCase()) ||
    (m.name ?? "").toLowerCase().includes(macroSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Left sidebar — channels + status */}
      <div className="w-[220px] flex-shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto">
        <div className="p-3 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Channels</p>
          {CHANNEL_FILTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChannelFilter(c.id)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs mb-0.5 transition-colors ${
                channelFilter === c.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.icon}
              <span className="flex-1 text-left truncate">{c.label}</span>
              <span className="text-[10px] text-gray-400">
                {c.id === "all"
                  ? tickets.filter((t) => t.status === statusFilter).length
                  : tickets.filter((t) => t.channel === c.id && t.status === statusFilter).length}
              </span>
            </button>
          ))}
        </div>
        <div className="p-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs mb-0.5 transition-colors capitalize ${
                statusFilter === s ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "open"     && <AlertCircle className="w-3.5 h-3.5 text-orange-500" />}
              {s === "pending"  && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
              {s === "resolved" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              <span className="flex-1 text-left">{s}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                s === "open"     ? "bg-orange-100 text-orange-700" :
                s === "pending"  ? "bg-yellow-100 text-yellow-700" :
                                   "bg-green-100 text-green-700"
              }`}>{countFor(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center ticket list */}
      <div className="w-[300px] flex-shrink-0 border-r border-gray-100 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No tickets</div>
        )}
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => { setSelectedTicket(t); setShopifyResult(""); setShopifyAction(null); }}
            className={`p-3 cursor-pointer border-b border-gray-50 hover:bg-indigo-50/40 transition-colors ${
              selectedTicket?.id === t.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ChannelIcon channel={t.channel} />
              <span className="text-xs font-semibold text-gray-800 truncate flex-1">{t.customer_name ?? "Unknown"}</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(t.created_at)}</span>
            </div>
            <p className="text-xs text-gray-600 truncate mb-1.5">{t.subject ?? "(no subject)"}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <PriorityBadge priority={t.priority ?? "normal"} />
              {t.sla_breached && (
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">SLA!</span>
              )}
              {(t.tags ?? []).slice(0, 2).map((tag: string) => (
                <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right detail panel */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Customer header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
              {(selectedTicket.customer_name ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">{selectedTicket.customer_name ?? "Unknown"}</div>
              <div className="text-xs text-gray-500 truncate">{selectedTicket.customer_email ?? ""}</div>
            </div>
            <ChannelIcon channel={selectedTicket.channel} />
            <PriorityBadge priority={selectedTicket.priority ?? "normal"} />
            <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shopify actions bar */}
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => { setShopifyAction("refund"); setShopifyResult(""); }}
              className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Refund Order
            </button>
            <button
              onClick={async () => {
                setShopifyResult("");
                const res = await fetch("/api/cs/shopify-action", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "cancel", ticketId: selectedTicket.id }),
                });
                const data = await res.json().catch(() => ({}));
                setShopifyResult(data.message ?? "Order cancelled");
              }}
              className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-400 hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3 h-3" /> Cancel Order
            </button>
            <button
              onClick={() => { setShopifyAction("discount"); setShopifyResult(""); }}
              className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-green-500 hover:text-green-700 transition-colors flex items-center gap-1.5"
            >
              <Tag className="w-3 h-3" /> Generate Discount
            </button>
            {shopifyAction && (
              <div className="flex items-center gap-2">
                <input
                  className="text-xs border border-gray-200 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder={shopifyAction === "refund" ? "Amount $" : "% off"}
                  value={shopifyInput}
                  onChange={(e) => setShopifyInput(e.target.value)}
                />
                <button
                  onClick={() => doShopifyAction(shopifyAction)}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                  Confirm
                </button>
                <button onClick={() => setShopifyAction(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {shopifyResult && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded font-medium">
                {shopifyResult}
              </span>
            )}
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(selectedTicket.cs_messages ?? []).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No messages yet</p>
            )}
            {[...(selectedTicket.cs_messages ?? [])]
              .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.from_role === "agent" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2.5 text-sm shadow-sm ${
                      msg.from_role === "agent"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : msg.from_role === "note"
                        ? "bg-yellow-50 border border-yellow-200 text-yellow-900"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.from_role === "note" && (
                      <span className="text-[10px] font-semibold block mb-1 text-yellow-700">Internal note</span>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.from_role === "agent" ? "text-indigo-200" : "text-gray-400"}`}>
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Reply composer */}
          <div className="border-t border-gray-100 p-3 flex-shrink-0 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setIsNote(false)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  !isNote ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Reply
              </button>
              <button
                onClick={() => setIsNote(true)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  isNote ? "bg-yellow-400 text-yellow-900" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Internal Note
              </button>
              <span className="text-[10px] text-gray-400 ml-auto">Type / to insert macro</span>
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={replyBody}
                onChange={(e) => handleReplyChange(e.target.value)}
                rows={3}
                placeholder={isNote ? "Add internal note…" : "Write a reply…"}
                className={`w-full text-sm border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 transition-colors ${
                  isNote
                    ? "border-yellow-300 focus:ring-yellow-200 bg-yellow-50/50"
                    : "border-gray-200 focus:ring-indigo-200"
                }`}
              />
              {showMacroPicker && filteredMacros.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                  {filteredMacros.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => insertMacro(m)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-indigo-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <code className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                        {m.shortcut}
                      </code>
                      <span className="font-medium text-gray-800">{m.name}</span>
                      <span className="text-xs text-gray-400 truncate flex-1">{(m.body ?? "").slice(0, 50)}…</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => sendReply(false)}
                disabled={sending || !replyBody.trim()}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1.5 font-medium"
              >
                <Send className="w-3 h-3" /> Send & Keep Open
              </button>
              <button
                onClick={() => sendReply(true)}
                disabled={sending || !replyBody.trim()}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40 flex items-center gap-1.5 font-medium"
              >
                <CheckCircle2 className="w-3 h-3" /> Send & Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3">
          <MessageSquare className="w-12 h-12 text-gray-200" />
          <p className="text-sm">Select a ticket to view</p>
        </div>
      )}
    </div>
  );
}

// ── MACROS TAB ────────────────────────────────────────────────────────────────
function MacrosTab({ macros: initialMacros }: { macros: any[] }) {
  const [macros, setMacros]     = useState(initialMacros);
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", shortcut: "/", body: "", channel: "all" });
  const [saving, setSaving]     = useState(false);

  const filtered = macros.filter(
    (m) =>
      (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.shortcut ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function saveMacro() {
    setSaving(true);
    const res  = await fetch("/api/cs/macro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (data.id) setMacros((prev) => [data, ...prev]);
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", shortcut: "/", body: "", channel: "all" });
  }

  async function deleteMacro(id: string) {
    await fetch(`/api/cs/macro?id=${id}`, { method: "DELETE" });
    setMacros((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search macros…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" /> New Macro
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Name", "Shortcut", "Channel", "Usage", "Body Preview", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3">
                  <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono">{m.shortcut}</code>
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize">{m.channel ?? "all"}</td>
                <td className="px-4 py-3 text-gray-500">{m.usage_count ?? 0}</td>
                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[200px]">{(m.body ?? "").slice(0, 80)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteMacro(m.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No macros found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-[520px] shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">New Macro</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. Order Refund Confirmation"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Shortcut</label>
                  <input
                    value={form.shortcut}
                    onChange={(e) => setForm({ ...form, shortcut: e.target.value.startsWith("/") ? e.target.value : "/" + e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
                    placeholder="/refund"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {["all", "email", "chat", "sms", "whatsapp", "instagram", "facebook"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Body</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MACRO_VARS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, body: form.body + v })}
                      className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded hover:bg-indigo-100 font-mono border border-indigo-100"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Hi {{customer.name}}, regarding your order {{order.number}}…"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={saveMacro}
                disabled={saving || !form.name.trim() || !form.body.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Saving…" : "Save Macro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RULES TAB ─────────────────────────────────────────────────────────────────
function RulesTab({ rules: initialRules, macros }: { rules: any[]; macros: any[] }) {
  const [rules, setRules]         = useState(initialRules);
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "ticket_created",
    conditionLogic: "AND" as "AND" | "OR",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
    actions:    [{ type: "assign_tag", value: "" }],
  });

  async function toggleRule(id: string, active: boolean) {
    await fetch("/api/cs/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
  }

  async function saveRule() {
    const res  = await fetch("/api/cs/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (data.id) setRules((prev) => [...prev, data]);
    setShowBuilder(false);
    setForm({
      name: "", trigger: "ticket_created", conditionLogic: "AND",
      conditions: [{ field: "subject", operator: "contains", value: "" }],
      actions: [{ type: "assign_tag", value: "" }],
    });
  }

  function updateCondition(i: number, patch: Partial<typeof form.conditions[0]>) {
    setForm((f) => ({ ...f, conditions: f.conditions.map((c, j) => j === i ? { ...c, ...patch } : c) }));
  }
  function updateAction(i: number, patch: Partial<typeof form.actions[0]>) {
    setForm((f) => ({ ...f, actions: f.actions.map((a, j) => j === i ? { ...a, ...patch } : a) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{rules.length} automation rule{rules.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">{r.name}</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                  {r.trigger ?? "ticket_created"}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 truncate">
                {(r.conditions ?? []).map((c: any) => `${c.field} ${c.operator} "${c.value}"`).join(` ${r.conditionLogic ?? "AND"} `)}
                {r.conditions?.length ? " → " : ""}
                {(r.actions ?? []).map((a: any) => a.type).join(", ")}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-gray-400">{r.times_fired ?? 0}x fired</span>
              <button
                onClick={() => toggleRule(r.id, !r.active)}
                className={`transition-colors ${r.active ? "text-indigo-600" : "text-gray-300"}`}
                title={r.active ? "Disable rule" : "Enable rule"}
              >
                {r.active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Zap className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            No rules yet — create one to automate responses
          </div>
        )}
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10">
          <div className="bg-white rounded-2xl p-6 w-[600px] shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">New Automation Rule</h2>
              <button onClick={() => setShowBuilder(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-5">
              {/* Name + trigger */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Rule Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="e.g. Auto-tag urgent orders"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Trigger</label>
                  <select
                    value={form.trigger}
                    onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="ticket_created">ticket_created</option>
                    <option value="message_received">message_received</option>
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-semibold text-gray-700">Conditions</label>
                  <select
                    value={form.conditionLogic}
                    onChange={(e) => setForm({ ...form, conditionLogic: e.target.value as "AND" | "OR" })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option>AND</option>
                    <option>OR</option>
                  </select>
                </div>
                {form.conditions.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={c.field}    onChange={(e) => updateCondition(i, { field: e.target.value })}    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none">
                      {RULE_FIELDS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                    <select value={c.operator} onChange={(e) => updateCondition(i, { operator: e.target.value })} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none">
                      {RULE_OPS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <input  value={c.value}    onChange={(e) => updateCondition(i, { value: e.target.value })}    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="value" />
                    <button onClick={() => setForm((f) => ({ ...f, conditions: f.conditions.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setForm((f) => ({ ...f, conditions: [...f.conditions, { field: "subject", operator: "contains", value: "" }] }))}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3 h-3" /> Add condition
                </button>
              </div>

              {/* Actions */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Actions</label>
                {form.actions.map((a, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={a.type}  onChange={(e) => updateAction(i, { type: e.target.value })}  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none">
                      {RULE_ACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input  value={a.value} onChange={(e) => updateAction(i, { value: e.target.value })} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="value (e.g. tag name)" />
                    <button onClick={() => setForm((f) => ({ ...f, actions: f.actions.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setForm((f) => ({ ...f, actions: [...f.actions, { type: "assign_tag", value: "" }] }))}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3 h-3" /> Add action
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => setShowBuilder(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={saveRule}
                disabled={!form.name.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS TAB ─────────────────────────────────────────────────────────────
function AnalyticsTab({ tickets, stats, agentLogs }: { tickets: any[]; stats: Props["stats"]; agentLogs: any[] }) {
  const channelCounts = tickets.reduce((acc: Record<string, number>, t) => {
    const ch = t.channel ?? "unknown";
    acc[ch] = (acc[ch] ?? 0) + 1;
    return acc;
  }, {});

  const chartData     = Object.entries(channelCounts).map(([name, count]) => ({ name, count }));
  const revenueImpact = tickets.reduce((sum, t) => sum + (t.revenue_impact ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Tickets",      value: stats.open,                                        icon: <AlertCircle className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
          { label: "Resolved Today",    value: stats.resolved_today,                              icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,  bg: "bg-green-50"  },
          { label: "Avg First Response",value: stats.avg_response_min > 0 ? `${Math.round(stats.avg_response_min)}m` : "—", icon: <Clock className="w-5 h-5 text-blue-500" />,   bg: "bg-blue-50"   },
          { label: "CSAT Score",        value: stats.csat_avg > 0 ? `${stats.csat_avg.toFixed(1)} ★` : "—",              icon: <Star className="w-5 h-5 text-yellow-500" />,  bg: "bg-yellow-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${k.bg} flex-shrink-0`}>{k.icon}</div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Channel bar chart */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tickets by Channel</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  cursor={{ fill: "#f3f4f6" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[entry.name] ?? "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No ticket data</div>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Revenue Driven by CS</h3>
            <div className="text-3xl font-bold text-green-600">${revenueImpact.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">Sum of revenue_impact across tickets</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Agent Activity</h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {agentLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <Bot className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700 line-clamp-1">{log.action ?? log.summary ?? log.message ?? "action"}</span>
                    <span className="text-gray-400 text-[10px]">{timeAgo(log.created_at)}</span>
                  </div>
                </div>
              ))}
              {agentLogs.length === 0 && <p className="text-gray-400 text-xs">No activity logged</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CHATBOT TAB ───────────────────────────────────────────────────────────────
function ChatbotTab({ brandId }: { brandId: string }) {
  const [chatInput, setChatInput]     = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);

  const embedSnippet = `<script src="/chatbot.js" data-brand="${brandId}"></script>`;
  const themeSnippet = `{% comment %} Paste before </body> in theme.liquid {% endcomment %}
<script src="{{ '${brandId}-chatbot.js' | asset_url }}" data-brand="${brandId}" defer></script>`;

  function copy(key: string, text: string) {
    copyText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatResponse("");
    const res  = await fetch("/api/cs/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput, brandId }),
    });
    const data = await res.json().catch(() => ({}));
    setChatResponse(data.reply ?? data.message ?? "No response received");
    setChatLoading(false);
  }

  const snippetBlock = (title: string, code: string, key: string) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <button
          onClick={() => copy(key, code)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied === key ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {snippetBlock("Website Embed Snippet", embedSnippet, "embed")}
      {snippetBlock("Shopify theme.liquid Snippet", themeSnippet, "theme")}

      {/* Config table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Config Attributes</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 rounded">
            <tr>
              {["Attribute", "Type", "Description"].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { attr: "data-brand",    type: "string",    desc: "Your brand ID (required)" },
              { attr: "data-position", type: "string",    desc: "Widget position: bottom-right | bottom-left" },
              { attr: "data-color",    type: "hex",       desc: "Primary color e.g. #6366f1" },
              { attr: "data-greeting", type: "string",    desc: "Initial greeting message shown to visitors" },
              { attr: "data-lang",     type: "ISO 639-1", desc: "Language code: en, fr, es, de…" },
            ].map((row) => (
              <tr key={row.attr} className="border-t border-gray-50">
                <td className="px-3 py-2.5">
                  <code className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">{row.attr}</code>
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{row.type}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live test */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Live Test</h3>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
            placeholder="Ask the chatbot a question…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            onClick={sendChat}
            disabled={chatLoading || !chatInput.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 font-medium"
          >
            <Send className="w-4 h-4" />
            {chatLoading ? "…" : "Send"}
          </button>
        </div>
        {chatResponse && (
          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600">AI Response</span>
            </div>
            {chatResponse}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS TAB ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [sla,   setSla]   = useState({ urgent: 60, high: 240, normal: 1440 });
  const [ai,    setAi]    = useState({ enabled: true, tone: "friendly", language: "en" });
  const [hours, setHours] = useState({ start: "09:00", end: "18:00", timezone: "America/New_York", weekends: false });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* SLA targets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">SLA Response Targets</h3>
        <div className="grid grid-cols-3 gap-4">
          {([
            { key: "urgent" as const, label: "Urgent",  color: "text-red-600"    },
            { key: "high"   as const, label: "High",    color: "text-orange-600" },
            { key: "normal" as const, label: "Normal",  color: "text-gray-600"   },
          ]).map(({ key, label, color }) => (
            <div key={key}>
              <label className={`text-xs font-semibold ${color} block mb-1`}>{label}</label>
              <input
                type="number"
                min={1}
                value={sla[key]}
                onChange={(e) => setSla({ ...sla, [key]: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                = {sla[key] >= 60 ? `${Math.round(sla[key] / 60 * 10) / 10}h` : `${sla[key]}m`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI agent */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">AI Agent</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Enable AI Agent</div>
              <div className="text-xs text-gray-400 mt-0.5">Automatically draft or send responses to common tickets</div>
            </div>
            <button
              onClick={() => setAi({ ...ai, enabled: !ai.enabled })}
              className={`transition-colors ${ai.enabled ? "text-indigo-600" : "text-gray-300"}`}
            >
              {ai.enabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
            </button>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Response Tone</label>
              <select
                value={ai.tone}
                onChange={(e) => setAi({ ...ai, tone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                {["friendly", "professional", "casual"].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Language</label>
              <select
                value={ai.language}
                onChange={(e) => setAi({ ...ai, language: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                {[["en","English"],["es","Spanish"],["fr","French"],["de","German"],["he","Hebrew"],["ar","Arabic"]].map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Business hours */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Business Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Start Time</label>
            <input type="time" value={hours.start} onChange={(e) => setHours({ ...hours, start: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">End Time</label>
            <input type="time" value={hours.end} onChange={(e) => setHours({ ...hours, end: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Timezone</label>
            <select value={hours.timezone} onChange={(e) => setHours({ ...hours, timezone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              {["America/New_York","America/Chicago","America/Los_Angeles","Europe/London","Europe/Paris","Asia/Jerusalem","Asia/Dubai"].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-5">
            <button
              onClick={() => setHours({ ...hours, weekends: !hours.weekends })}
              className={`transition-colors ${hours.weekends ? "text-indigo-600" : "text-gray-300"}`}
            >
              {hours.weekends ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
            <span className="text-sm text-gray-700">Include weekends</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-indigo-700 font-semibold transition-colors"
      >
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "inbox",     label: "Inbox",     icon: <MessageSquare className="w-4 h-4" /> },
  { id: "macros",    label: "Macros",    icon: <Zap className="w-4 h-4" /> },
  { id: "rules",     label: "Rules",     icon: <Filter className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "chatbot",   label: "Chatbot",   icon: <Bot className="w-4 h-4" /> },
  { id: "settings",  label: "Settings",  icon: <Settings className="w-4 h-4" /> },
] as const;

export default function GorgiasClient({ brandId, tickets, macros, rules, faq, agentLogs, stats }: Props) {
  const [activeTab, setActiveTab] = useState<string>("inbox");
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Service</h1>
            <p className="text-xs text-gray-400 mt-0.5">{tickets.length} tickets · Gorgias-style helpdesk</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
            AI Agent active
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "inbox" && openCount > 0 && (
                <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  activeTab === "inbox"
                    ? "bg-white/25 text-white"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className={activeTab === "inbox" ? "px-6 pt-4 pb-6" : "p-6"}>
        {activeTab === "inbox"     && <InboxTab     tickets={tickets} macros={macros} brandId={brandId} />}
        {activeTab === "macros"    && <MacrosTab    macros={macros} />}
        {activeTab === "rules"     && <RulesTab     rules={rules} macros={macros} />}
        {activeTab === "analytics" && <AnalyticsTab tickets={tickets} stats={stats} agentLogs={agentLogs} />}
        {activeTab === "chatbot"   && <ChatbotTab   brandId={brandId} />}
        {activeTab === "settings"  && <SettingsTab />}
      </div>
    </div>
  );
}
