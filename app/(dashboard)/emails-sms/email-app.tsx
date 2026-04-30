"use client";

import { useState, useRef } from "react";
import {
  BarChart2, Mail, Users, Layers, Zap, Palette, GitCompare,
  FileText, Plus, Search, ChevronDown, ChevronRight, ToggleLeft,
  ToggleRight, Star, Send, Clock, Archive, TestTube2, Filter,
  TrendingUp, TrendingDown, Copy, CheckCircle2, AlertCircle,
  MoreHorizontal, Eye, MousePointerClick, Ban, AlertTriangle,
  RefreshCw, Minus, ArrowUpRight, Upload, Trash2, Edit2,
  Calendar, BarChart, Activity, Globe, Inbox, XCircle, Info, Code2,
} from "lucide-react";
import MjmlDesigner from "./mjml-designer";
import {
  LineChart, Line, AreaChart, Area, BarChart as RBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  status: string;
  subject?: string;
  segment_id?: string;
  sent_at?: string;
  scheduled_at?: string;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  starred?: boolean;
  is_ab_test?: boolean;
  created_at?: string;
}

interface Flow {
  id: string;
  name: string;
  trigger?: string;
  status?: string;
  is_active?: boolean;
  steps?: any[];
  created_at?: string;
  updated_at?: string;
}

interface Segment {
  id: string;
  name: string;
  subscriber_count?: number;
  type?: string;
  created_at?: string;
  last_synced_at?: string;
}

interface AgentLog {
  id: string;
  agent_name: string;
  action?: string;
  details?: any;
  created_at?: string;
}

interface Stats {
  total: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  spam: number;
  revenue: number;
  openRate: number;
  ctr: number;
  bounceRate: number;
  spamRate: number;
  deliverRate: number;
  totalSent90: number;
  totalDelivered90: number;
  totalOpened90: number;
  totalClicked90: number;
  totalBounced90: number;
  totalSpam90: number;
  totalUnsub90: number;
}

interface EmailAppProps {
  brandId: string;
  flows: Flow[];
  campaigns: Campaign[];
  segments: Segment[];
  contacts: Segment[];
  chartData: any[];
  agentLogs: AgentLog[];
  brandSettings: any;
  stats: Stats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number) {
  return d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "—";
}

function fmt(n: number) {
  return n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000
    ? (n / 1_000).toFixed(1) + "K"
    : String(n);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    sent:      "bg-green-100 text-green-700",
    draft:     "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-100 text-blue-700",
    archived:  "bg-yellow-100 text-yellow-700",
    ab_test:   "bg-purple-100 text-purple-700",
    active:    "bg-green-100 text-green-700",
    paused:    "bg-orange-100 text-orange-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { key: "campaigns",         label: "Campaigns",         icon: Mail },
  { key: "stats",             label: "Stats",             icon: BarChart2 },
  { key: "designer",          label: "Email Designer",    icon: Code2 },
  { key: "forms",             label: "Forms",             icon: FileText },
  { key: "contact-lists",     label: "Contact Lists",     icon: Users },
  { key: "segmentation",      label: "Segmentation",      icon: Layers },
  { key: "automation",        label: "Automation",        icon: Zap },
  { key: "brand-kit",         label: "Brand Kit",         icon: Palette },
  { key: "compare",           label: "Compare Campaigns", icon: GitCompare },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════

const CAMP_SUBTABS = ["All", "Starred", "Draft", "Sent", "Scheduled", "A/B Test", "Archived"];

function CampaignsTab({ campaigns, brandId }: { campaigns: Campaign[]; brandId: string }) {
  const [sub, setSub]     = useState("All");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm]   = useState({ name: "", subject: "", segment_id: "", scheduled_at: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function filtered() {
    let list = campaigns;
    if (sub === "Starred")   list = list.filter((c) => c.starred);
    if (sub === "Draft")     list = list.filter((c) => c.status === "draft");
    if (sub === "Sent")      list = list.filter((c) => c.status === "sent");
    if (sub === "Scheduled") list = list.filter((c) => c.status === "scheduled");
    if (sub === "A/B Test")  list = list.filter((c) => c.is_ab_test);
    if (sub === "Archived")  list = list.filter((c) => c.status === "archived");
    if (search) list = list.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }

  async function createCampaign() {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, ...form, status: form.scheduled_at ? "scheduled" : "draft" }),
      });
      if (res.ok) {
        setToast("Campaign created!"); setCreating(false);
        setForm({ name: "", subject: "", segment_id: "", scheduled_at: "" });
        setTimeout(() => setToast(""), 3000);
      }
    } finally { setSaving(false); }
  }

  const list = filtered();

  return (
    <div className="space-y-4">
      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0 border border-[var(--border)] rounded-lg overflow-hidden bg-white">
          {CAMP_SUBTABS.map((t) => (
            <button key={t}
              onClick={() => setSub(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${sub === t ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-tint)]"}`}
            >{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="pl-8 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-48" />
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Create a campaign
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card p-4 border-2 border-[var(--accent)]/30 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Campaign</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Campaign name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Summer Sale 2026"
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Email subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. ☀️ Summer deals inside"
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createCampaign} disabled={saving || !form.name}
              className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:opacity-90">
              {saving ? "Creating..." : "Create Campaign"}
            </button>
            <button onClick={() => setCreating(false)}
              className="px-4 py-1.5 border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-tint)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-tint)]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] w-8"></th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)]">Campaign name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)]">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Emails</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Opens</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Clicks</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Delivery date</th>
              <th className="px-4 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                  No campaigns yet — create your first one
                </td>
              </tr>
            ) : list.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-tint)] transition-colors">
                <td className="px-4 py-3">
                  <Star className={`w-3.5 h-3.5 ${c.starred ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text-primary)]">{c.name}</div>
                  {c.subject && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{c.subject}</div>}
                </td>
                <td className="px-4 py-3">{statusBadge(c.status ?? "draft")}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{fmt(c.sent_count ?? 0)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {fmt(c.open_count ?? 0)}
                  {(c.sent_count ?? 0) > 0 && (
                    <span className="text-[var(--text-secondary)] ml-1">
                      ({pct(c.open_count ?? 0, c.sent_count ?? 0)})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {fmt(c.click_count ?? 0)}
                  {(c.open_count ?? 0) > 0 && (
                    <span className="text-[var(--text-secondary)] ml-1">
                      ({pct(c.click_count ?? 0, c.open_count ?? 0)})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-[var(--text-secondary)]">
                  {c.sent_at
                    ? new Date(c.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : c.scheduled_at
                    ? new Date(c.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STATS
// ═══════════════════════════════════════════════════════════════════════════════

const PERIOD_OPTIONS = [
  { key: "7d",  label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
];

const METRICS = [
  { key: "delivered",  label: "Delivered",    color: "#6366f1", icon: Send },
  { key: "openRate",   label: "Opened",       color: "#10b981", icon: Eye },
  { key: "clickRate",  label: "Clicked",      color: "#f59e0b", icon: MousePointerClick },
  { key: "bounceRate", label: "Bounced",      color: "#ef4444", icon: XCircle },
  { key: "spamRate",   label: "Spam",         color: "#8b5cf6", icon: AlertTriangle },
];

function StatsTab({ chartData, stats }: { chartData: any[]; stats: Stats }) {
  const [period, setPeriod]   = useState("90d");
  const [activeLines, setActiveLines] = useState(new Set(["delivered", "openRate", "clickRate"]));

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const visibleData = chartData.slice(-days);

  function toggleLine(key: string) {
    setActiveLines((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const kpiCards = [
    { label: "Delivered",     value: fmt(stats.totalDelivered90), sub: pct(stats.totalDelivered90, stats.totalSent90),    color: "text-indigo-600", icon: Send },
    { label: "Opened",        value: fmt(stats.totalOpened90),    sub: pct(stats.totalOpened90, stats.totalDelivered90), color: "text-green-600",  icon: Eye },
    { label: "Clicked",       value: fmt(stats.totalClicked90),   sub: pct(stats.totalClicked90, stats.totalDelivered90),color: "text-amber-600",  icon: MousePointerClick },
    { label: "Unsubscribed",  value: fmt(stats.totalUnsub90),     sub: pct(stats.totalUnsub90, stats.totalDelivered90),  color: "text-pink-600",   icon: Minus },
    { label: "Blocked",       value: "—",                         sub: "—",                                               color: "text-gray-500",   icon: Ban },
    { label: "Spam",          value: fmt(stats.totalSpam90),      sub: pct(stats.totalSpam90, stats.totalSent90),        color: "text-purple-600", icon: AlertTriangle },
    { label: "Hard bounced",  value: fmt(stats.totalBounced90),   sub: pct(stats.totalBounced90, stats.totalSent90),     color: "text-red-600",    icon: XCircle },
    { label: "Soft bounced",  value: "—",                         sub: "—",                                               color: "text-orange-600", icon: AlertCircle },
    { label: "Retrying",      value: "—",                         sub: "—",                                               color: "text-sky-600",    icon: RefreshCw },
  ];

  return (
    <div className="space-y-5">
      {/* Period picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)] font-medium">Period:</span>
        {PERIOD_OPTIONS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${period === p.key ? "bg-[var(--accent)] text-white" : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tint)]"}`}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--text-secondary)]">{fmt(stats.totalSent90)} emails sent in last 90 days</span>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button key={m.key} onClick={() => toggleLine(m.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeLines.has(m.key) ? "border-transparent text-white" : "bg-white border-[var(--border)] text-[var(--text-secondary)]"}`}
            style={activeLines.has(m.key) ? { backgroundColor: m.color } : {}}>
            <m.icon className="w-3 h-3" /> {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={visibleData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {METRICS.map((m) => (
                <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={m.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "white" }}
              formatter={(v: any, n: string) => [`${v}%`, n]}
            />
            {METRICS.map((m) =>
              activeLines.has(m.key) ? (
                <Area key={m.key} type="monotone" dataKey={m.key} name={m.label}
                  stroke={m.color} fill={`url(#grad-${m.key})`} strokeWidth={2} dot={false} />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* KPI cards grid */}
      <div className="grid grid-cols-3 gap-3">
        {kpiCards.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium">{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{k.sub} of total</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FORMS
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_FORMS = [
  { id: "f1", name: "Homepage Newsletter Signup", subscribers: 842, status: "active", embedType: "popup" },
  { id: "f2", name: "Exit Intent - 10% Off",      subscribers: 214, status: "active", embedType: "exit-intent" },
  { id: "f3", name: "Footer Inline Form",          subscribers: 67,  status: "paused", embedType: "inline" },
];

function FormsTab({ brandId }: { brandId: string }) {
  const [creating, setCreating] = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", embedType: "popup" });

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  const embedCode = (fid: string) =>
    `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/forms.js" data-form="${fid}" data-brand="${brandId}"></script>`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Subscription Forms</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Capture leads with embeddable forms connected to your contact lists</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Form
        </button>
      </div>

      {creating && (
        <div className="card p-4 border-2 border-[var(--accent)]/30 space-y-3">
          <h3 className="text-sm font-semibold">Create Form</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Form name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Popup Newsletter"
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Type</label>
              <select value={form.embedType} onChange={(e) => setForm({ ...form, embedType: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none">
                <option value="popup">Popup</option>
                <option value="inline">Inline</option>
                <option value="exit-intent">Exit Intent</option>
                <option value="slide-in">Slide-in</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCreating(false)}
              className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90">Create</button>
            <button onClick={() => setCreating(false)}
              className="px-4 py-1.5 border border-[var(--border)] rounded-lg text-xs hover:bg-[var(--surface-tint)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {DEMO_FORMS.map((f) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[var(--text-primary)]">{f.name}</span>
                  {statusBadge(f.status)}
                  <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-tint)] px-2 py-0.5 rounded">{f.embedType}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{f.subscribers.toLocaleString()} subscribers captured</div>
              </div>
              <div className="flex gap-1.5">
                <button className="p-1.5 border border-[var(--border)] rounded hover:bg-[var(--surface-tint)]"><Edit2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" /></button>
                <button className="p-1.5 border border-[var(--border)] rounded hover:bg-[var(--surface-tint)]"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>

            {/* Embed code */}
            <div className="bg-[var(--surface-tint)] rounded-lg p-3 flex items-center gap-2">
              <code className="text-xs font-mono text-[var(--text-secondary)] flex-1 truncate">{embedCode(f.id)}</code>
              <button onClick={() => copyCode(f.id, embedCode(f.id))}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-[var(--border)] rounded text-xs hover:bg-[var(--surface-tint)]">
                {copied === f.id ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied === f.id ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700">
            <div className="font-semibold mb-1">How forms connect to your email agent</div>
            <div>New subscribers are automatically added to your Supabase <code className="bg-blue-100 px-1 rounded">segments</code> table and tagged by form source. The email agent reads segment membership to personalize flows and campaigns.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CONTACT LISTS
// ═══════════════════════════════════════════════════════════════════════════════

function ContactListsTab({ contacts, brandId }: { contacts: Segment[]; brandId: string }) {
  const [creating, setCreating] = useState(false);
  const [listName, setListName] = useState("");
  const [saving, setSaving] = useState(false);

  const total = contacts.reduce((s, c) => s + (c.subscriber_count ?? 0), 0);

  async function createList() {
    if (!listName) return;
    setSaving(true);
    try {
      await fetch("/api/email/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, name: listName, type: "list" }),
      });
      setListName(""); setCreating(false);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Total Contacts</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{fmt(total)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Active Lists</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{contacts.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Shopify Sync</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-medium text-green-600">Connected</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">All Lists</h3>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Create List
        </button>
      </div>

      {creating && (
        <div className="card p-4 border-2 border-[var(--accent)]/30 flex gap-3">
          <input value={listName} onChange={(e) => setListName(e.target.value)}
            placeholder="List name (e.g. VIP Customers)"
            className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
          <button onClick={createList} disabled={saving}
            className="px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium disabled:opacity-50">
            {saving ? "..." : "Create"}
          </button>
          <button onClick={() => setCreating(false)}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs">Cancel</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-tint)]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)]">List name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)]">Type</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Subscribers</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Last synced</th>
              <th className="px-4 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No lists yet</td></tr>
            ) : contacts.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-tint)]">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-[var(--surface-tint)] px-2 py-0.5 rounded">{c.type ?? "list"}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">{(c.subscriber_count ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-xs text-[var(--text-secondary)]">
                  {c.last_synced_at ? new Date(c.last_synced_at).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SEGMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

const RULE_CONDITIONS = [
  "Purchase count ≥",
  "Total spent ≥",
  "Last order within",
  "Email opened (last 30d)",
  "Country is",
  "Product tag contains",
  "Has reviewed",
  "Subscribed via form",
];

function SegmentationTab({ segments, brandId }: { segments: Segment[]; brandId: string }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "dynamic", condition: "Purchase count ≥", value: "" });
  const [saving, setSaving] = useState(false);

  async function createSegment() {
    if (!form.name) return;
    setSaving(true);
    try {
      await fetch("/api/email/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          name: form.name,
          type: form.type,
          rules: [{ condition: form.condition, value: form.value }],
        }),
      });
      setCreating(false);
      setForm({ name: "", type: "dynamic", condition: "Purchase count ≥", value: "" });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Segments</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Rule-based groups auto-populated from Shopify behavior</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Segment
        </button>
      </div>

      {/* Shopify sync notice */}
      <div className="card p-3 flex items-center gap-3 bg-indigo-50 border-indigo-200">
        <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
        <div className="text-xs text-indigo-700 flex-1">
          <span className="font-semibold">Shopify auto-sync enabled.</span> New orders and customers are automatically evaluated against segment rules via the Shopify webhook.
        </div>
        <span className="text-xs text-indigo-500 font-medium">Every 6h</span>
      </div>

      {creating && (
        <div className="card p-4 border-2 border-[var(--accent)]/30 space-y-3">
          <h3 className="text-sm font-semibold">New Segment</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Segment name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. High-Value Buyers"
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none">
                <option value="dynamic">Dynamic</option>
                <option value="static">Static</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Rule</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none">
                {RULE_CONDITIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {!["Email opened (last 30d)", "Has reviewed"].includes(form.condition) && (
            <div className="w-1/3">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Value</label>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="e.g. 3 or ₪500"
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={createSegment} disabled={saving}
              className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium disabled:opacity-50">
              {saving ? "Creating..." : "Create Segment"}
            </button>
            <button onClick={() => setCreating(false)}
              className="px-4 py-1.5 border border-[var(--border)] rounded-lg text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-tint)]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)]">Segment</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)]">Type</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Members</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Created</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)]">Last sync</th>
            </tr>
          </thead>
          <tbody>
            {segments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No segments yet</td></tr>
            ) : segments.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-tint)]">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.type === "dynamic" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{s.type ?? "dynamic"}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">{(s.subscriber_count ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-xs text-[var(--text-secondary)]">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right text-xs text-[var(--text-secondary)]">
                  {s.last_synced_at ? new Date(s.last_synced_at).toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: AUTOMATION (FLOWS)
// ═══════════════════════════════════════════════════════════════════════════════

const TRIGGER_ICONS: Record<string, any> = {
  "order_placed":     Inbox,
  "abandoned_cart":   Archive,
  "welcome":          Send,
  "win_back":         RefreshCw,
  "post_purchase":    Star,
  "review_request":   Star,
};

function AutomationTab({ flows, brandId }: { flows: Flow[]; brandId: string }) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "order_placed" });

  async function toggleFlow(flowId: string, current: boolean) {
    setToggling(flowId);
    await fetch("/api/email/flows", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flowId, brandId, isActive: !current }),
    });
    setToggling(null);
  }

  const TRIGGER_OPTIONS = [
    "order_placed", "abandoned_cart", "welcome", "win_back", "post_purchase", "review_request",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Automation Flows</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Triggered email sequences managed by the email agent</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Flow
        </button>
      </div>

      {creating && (
        <div className="card p-4 border-2 border-[var(--accent)]/30 space-y-3">
          <h3 className="text-sm font-semibold">New Flow</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Flow name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Welcome Series"
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Trigger</label>
              <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none">
                {TRIGGER_OPTIONS.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={async () => {
              await fetch("/api/email/flows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandId, name: form.name, trigger: form.trigger }),
              });
              setCreating(false);
            }} className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-xs font-medium">Create Flow</button>
            <button onClick={() => setCreating(false)}
              className="px-4 py-1.5 border border-[var(--border)] rounded-lg text-xs">Cancel</button>
          </div>
        </div>
      )}

      {flows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-[var(--text-secondary)]">
          No flows configured yet. The email agent will create and manage flows automatically.
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((f) => {
            const TriggerIcon = TRIGGER_ICONS[f.trigger ?? ""] ?? Zap;
            const steps = Array.isArray(f.steps) ? f.steps.length : 0;
            return (
              <div key={f.id} className="card p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                    <TriggerIcon className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--text-primary)]">{f.name}</span>
                      {statusBadge(f.is_active ? "active" : "paused")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-3">
                      <span>Trigger: <span className="font-medium">{(f.trigger ?? "manual").replace(/_/g, " ")}</span></span>
                      <span>•</span>
                      <span>{steps} email{steps !== 1 ? "s" : ""} in sequence</span>
                      {f.updated_at && (
                        <>
                          <span>•</span>
                          <span>Updated {new Date(f.updated_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFlow(f.id, f.is_active ?? false)}
                    disabled={toggling === f.id}
                    className="shrink-0"
                  >
                    {f.is_active
                      ? <ToggleRight className={`w-8 h-8 text-green-500 ${toggling === f.id ? "opacity-50" : ""}`} />
                      : <ToggleLeft className={`w-8 h-8 text-gray-400 ${toggling === f.id ? "opacity-50" : ""}`} />
                    }
                  </button>
                </div>

                {/* Step preview */}
                {Array.isArray(f.steps) && f.steps.length > 0 && (
                  <div className="mt-3 pl-14 flex items-center gap-2 overflow-x-auto">
                    {f.steps.map((step: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 shrink-0">
                        {i > 0 && <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />}
                        <div className="flex items-center gap-1 bg-[var(--surface-tint)] rounded px-2 py-1">
                          <Mail className="w-3 h-3 text-[var(--text-secondary)]" />
                          <span className="text-xs">{step.name ?? `Email ${i + 1}`}</span>
                          {step.delay && <span className="text-xs text-[var(--text-secondary)]">+{step.delay}d</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: BRAND KIT
// ═══════════════════════════════════════════════════════════════════════════════

function BrandKitTab({ brandSettings, brandId }: { brandSettings: any; brandId: string }) {
  const [form, setForm] = useState({
    sender_name:  brandSettings?.sender_name  ?? "",
    sender_email: brandSettings?.ses_sender_email ?? "",
    reply_to:     brandSettings?.reply_to     ?? "",
    primary_color:brandSettings?.brand_color  ?? "#6366f1",
    footer_text:  brandSettings?.footer_text  ?? "",
    logo_url:     brandSettings?.logo_url     ?? "",
    unsubscribe_text: brandSettings?.unsubscribe_text ?? "Unsubscribe from marketing emails",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/email/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, ...form }),
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Brand Kit</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Default sender identity and visual settings for all emails</p>
      </div>

      {/* Sender identity */}
      <div className="card p-5 space-y-4">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Sender Identity</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Sender name</label>
            <input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
              placeholder="Your Brand"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Sender email (SES verified)</label>
            <input value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
              placeholder="hello@yourbrand.com"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Reply-to email</label>
            <input value={form.reply_to} onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
              placeholder="support@yourbrand.com"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
          </div>
        </div>
      </div>

      {/* Visuals */}
      <div className="card p-5 space-y-4">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Visuals</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Brand color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="w-10 h-9 rounded cursor-pointer border border-[var(--border)]" />
              <input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Logo URL</label>
            <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
          </div>
        </div>
        {form.logo_url && (
          <div className="flex items-center gap-3 p-3 bg-[var(--surface-tint)] rounded-lg">
            <img src={form.logo_url} alt="Logo preview" className="h-8 object-contain" onError={(e) => { (e.target as any).style.display = "none"; }} />
            <span className="text-xs text-[var(--text-secondary)]">Logo preview</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card p-5 space-y-4">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Email Footer</h4>
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1">Footer text</label>
          <textarea value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
            rows={2}
            placeholder="© 2026 Your Brand. 123 Main Street, City, Country."
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none resize-none" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1">Unsubscribe link text</label>
          <input value={form.unsubscribe_text} onChange={(e) => setForm({ ...form, unsubscribe_text: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none" />
        </div>
      </div>

      {/* SES status */}
      <div className="card p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <Send className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-[var(--text-primary)]">Amazon SES</div>
          <div className="text-xs text-[var(--text-secondary)]">
            {brandSettings?.ses_sender_email ? `Verified: ${brandSettings.ses_sender_email}` : "Configure sender email above and verify domain in AWS console"}
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full ${brandSettings?.ses_sender_email ? "bg-green-400" : "bg-red-400"}`}></span>
      </div>

      <button onClick={save} disabled={saving}
        className="px-5 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 flex items-center gap-2">
        {saving ? "Saving..." : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save Brand Kit"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: COMPARE CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════

function CompareCampaignsTab({ campaigns }: { campaigns: Campaign[] }) {
  const [a, setA] = useState(campaigns[0]?.id ?? "");
  const [b, setB] = useState(campaigns[1]?.id ?? "");

  const camA = campaigns.find((c) => c.id === a);
  const camB = campaigns.find((c) => c.id === b);

  function metric(c: Campaign | undefined, key: keyof Campaign, denominator?: keyof Campaign) {
    if (!c) return "—";
    const val = Number(c[key] ?? 0);
    if (denominator) {
      const den = Number(c[denominator] ?? 0);
      return den > 0 ? pct(val, den) : "—";
    }
    return fmt(val);
  }

  const ROWS = [
    { label: "Emails sent",    a: metric(camA, "sent_count"),   b: metric(camB, "sent_count") },
    { label: "Open rate",      a: metric(camA, "open_count", "sent_count"),  b: metric(camB, "open_count", "sent_count") },
    { label: "Click rate",     a: metric(camA, "click_count", "sent_count"), b: metric(camB, "click_count", "sent_count") },
    { label: "CTOR",           a: metric(camA, "click_count", "open_count"), b: metric(camB, "click_count", "open_count") },
  ];

  const chartData = camA && camB ? [
    { name: "Open rate",  a: camA.sent_count ? Math.round((camA.open_count ?? 0) / camA.sent_count * 100) : 0, b: camB.sent_count ? Math.round((camB.open_count ?? 0) / camB.sent_count * 100) : 0 },
    { name: "Click rate", a: camA.sent_count ? Math.round((camA.click_count ?? 0) / camA.sent_count * 100) : 0, b: camB.sent_count ? Math.round((camB.click_count ?? 0) / camB.sent_count * 100) : 0 },
    { name: "CTOR",       a: camA.open_count ? Math.round((camA.click_count ?? 0) / camA.open_count * 100) : 0, b: camB.open_count ? Math.round((camB.click_count ?? 0) / camB.open_count * 100) : 0 },
  ] : [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Compare Campaigns</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Select two campaigns for side-by-side performance comparison</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ val: a, set: setA, label: "Campaign A" }, { val: b, set: setB, label: "Campaign B" }].map(({ val, set, label }) => (
          <div key={label}>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">{label}</label>
            <select value={val} onChange={(e) => set(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none">
              <option value="">— Select —</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ))}
      </div>

      {camA && camB && (
        <>
          {/* Side-by-side headers */}
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            {[camA, camB].map((c, i) => (
              <div key={c.id} className={`card p-3 text-center border-2 ${i === 0 ? "border-indigo-200 bg-indigo-50" : "border-green-200 bg-green-50"}`}>
                <div className={`text-xs font-bold mb-0.5 ${i === 0 ? "text-indigo-600" : "text-green-600"}`}>Campaign {i === 0 ? "A" : "B"}</div>
                <div className="font-medium text-sm text-[var(--text-primary)] truncate">{c.name}</div>
                <div className="mt-1">{statusBadge(c.status ?? "draft")}</div>
              </div>
            ))}
          </div>

          {/* Metric rows */}
          <div className="card overflow-hidden">
            {ROWS.map((row, i) => {
              const valA = parseFloat(row.a) || 0;
              const valB = parseFloat(row.b) || 0;
              return (
                <div key={row.label} className={`flex items-center px-4 py-3 ${i % 2 === 0 ? "bg-[var(--surface-tint)]" : ""}`}>
                  <div className="w-1/3 text-xs font-medium text-[var(--text-secondary)]">{row.label}</div>
                  <div className={`w-1/3 text-right font-mono text-sm font-semibold ${valA > valB ? "text-indigo-600" : "text-[var(--text-primary)]"}`}>
                    {row.a} {valA > valB && <TrendingUp className="w-3 h-3 inline ml-1 text-indigo-500" />}
                  </div>
                  <div className={`w-1/3 text-right font-mono text-sm font-semibold ${valB > valA ? "text-green-600" : "text-[var(--text-primary)]"}`}>
                    {row.b} {valB > valA && <TrendingUp className="w-3 h-3 inline ml-1 text-green-500" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card p-4">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Rate Comparison (%)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RBarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="a" name={camA.name} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="b" name={camB.name} fill="#10b981" radius={[4, 4, 0, 0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!camA || !camB ? (
        <div className="card p-10 text-center text-sm text-[var(--text-secondary)]">
          Select two campaigns above to compare them
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT LOG SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

function AgentLogPanel({ logs }: { logs: AgentLog[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--surface-tint)] transition-colors">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--accent)]" />
          <span className="font-medium text-[var(--text-primary)]">Email Agent Activity</span>
          <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">{logs.length}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[var(--text-secondary)]">No agent activity yet</div>
          ) : logs.map((l) => (
            <div key={l.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-primary)]">{l.action ?? l.details?.action ?? "Action"}</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {new Date(l.created_at ?? "").toLocaleTimeString()}
                </span>
              </div>
              {l.details?.message && (
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{l.details.message}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function EmailApp({
  brandId, flows, campaigns, segments, contacts, chartData, agentLogs, brandSettings, stats,
}: EmailAppProps) {
  const [tab, setTab] = useState("campaigns");

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Email Marketing</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {fmt(stats.totalSent90)} emails sent · {stats.openRate.toFixed(1)}% avg open rate · Amazon SES
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Agent active
          </span>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Sent (90d)",      value: fmt(stats.totalSent90),      color: "text-[var(--text-primary)]" },
          { label: "Delivered",       value: pct(stats.totalDelivered90, stats.totalSent90), color: "text-indigo-600" },
          { label: "Open rate",       value: stats.openRate.toFixed(1) + "%", color: "text-green-600" },
          { label: "Click rate",      value: stats.ctr.toFixed(1) + "%", color: "text-amber-600" },
          { label: "Bounce rate",     value: stats.bounceRate.toFixed(1) + "%", color: "text-red-600" },
        ].map((k) => (
          <div key={k.label} className="card px-3 py-2.5 text-center">
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0 border border-[var(--border)] rounded-xl overflow-hidden bg-white">
        {MAIN_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium flex-1 justify-center transition-colors ${tab === t.key ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-tint)]"}`}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "campaigns"     && <CampaignsTab campaigns={campaigns} brandId={brandId} />}
        {tab === "designer"      && <MjmlDesigner brandId={brandId} />}
        {tab === "stats"         && <StatsTab chartData={chartData} stats={stats} />}
        {tab === "forms"         && <FormsTab brandId={brandId} />}
        {tab === "contact-lists" && <ContactListsTab contacts={contacts} brandId={brandId} />}
        {tab === "segmentation"  && <SegmentationTab segments={segments} brandId={brandId} />}
        {tab === "automation"    && <AutomationTab flows={flows} brandId={brandId} />}
        {tab === "brand-kit"     && <BrandKitTab brandSettings={brandSettings} brandId={brandId} />}
        {tab === "compare"       && <CompareCampaignsTab campaigns={campaigns} />}
      </div>

      {/* Agent log */}
      <AgentLogPanel logs={agentLogs} />
    </div>
  );
}
