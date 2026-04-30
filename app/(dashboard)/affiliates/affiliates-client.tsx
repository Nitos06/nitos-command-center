"use client";

import { useState, useMemo } from "react";
import {
  Users, TrendingUp, MousePointerClick, ShoppingCart, DollarSign,
  Wallet, CheckCircle2, Clock, Plus, Copy, Mail, MoreHorizontal,
  ChevronDown, ChevronRight, Shield, AlertTriangle, Settings,
  ToggleLeft, ToggleRight, Ban, Eye, Send, RefreshCw, Download,
  Layers, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatMoney, formatPct, formatNumber } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  brandId: string;
  affiliates: any[];
  clicks: any[];
  conversions: any[];
  programs: any[];
  payouts: any[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Affiliates", "Programs", "Payouts", "Fraud", "Settings"] as const;
type Tab = typeof TABS[number];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "badge-success",
    paused: "badge-warn",
    banned: "badge-crit",
    pending: "badge-neutral",
  };
  return <span className={map[status] ?? "badge-neutral"}>{status}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-surface-border">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-bold text-ink text-base">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ affiliates, clicks, conversions, payouts }: Pick<Props, "affiliates" | "clicks" | "conversions" | "payouts">) {
  const totalRevenue = conversions.reduce((s, c) => s + Number(c.order_value ?? 0), 0);
  const totalCommissions = conversions.reduce((s, c) => s + Number(c.commission_amount ?? 0), 0);
  const paidOut = payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const pending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const convRate = clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0;
  const active = affiliates.filter(a => a.status === "active").length;

  // Build last-30-day bar chart data from conversions
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    conversions.forEach(c => {
      const day = (c.converted_at ?? "").slice(0, 10);
      if (day in days) days[day] += Number(c.order_value ?? 0);
    });
    return Object.entries(days).map(([date, revenue]) => ({ date: date.slice(5), revenue }));
  }, [conversions]);

  // Top 5 affiliates
  const convsByAff = useMemo(() => {
    const map: Record<string, { revenue: number; commission: number; orders: number }> = {};
    conversions.forEach(c => {
      const id = c.affiliate_id;
      map[id] = map[id] ?? { revenue: 0, commission: 0, orders: 0 };
      map[id].revenue += Number(c.order_value ?? 0);
      map[id].commission += Number(c.commission_amount ?? 0);
      map[id].orders += 1;
    });
    return map;
  }, [conversions]);

  const top5 = affiliates
    .map(a => ({ ...a, ...(convsByAff[a.id] ?? { revenue: 0, commission: 0, orders: 0 }) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const kpis = [
    { label: "Total Affiliates", value: String(affiliates.length), icon: Users, color: "text-primary" },
    { label: "Active", value: String(active), icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Total Clicks", value: formatNumber(clicks.length), icon: MousePointerClick, color: "text-blue-500" },
    { label: "Conversion Rate", value: formatPct(convRate), icon: TrendingUp, color: "text-violet-500" },
    { label: "Total Revenue", value: formatMoney(totalRevenue), icon: ShoppingCart, color: "text-emerald-600" },
    { label: "Commissions Owed", value: formatMoney(totalCommissions), icon: DollarSign, color: "text-amber-500" },
    { label: "Paid Out", value: formatMoney(paidOut), icon: CheckCircle2, color: "text-teal-500" },
    { label: "Pending Payouts", value: formatMoney(pending), icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="card">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
              <span className="kpi-label">{k.label}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Revenue (last 30 days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₪${v}`} />
            <Tooltip formatter={(v: any) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
            <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold text-ink mb-3">Top 5 Affiliates</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="pb-2">Name</th>
              <th className="pb-2">Code</th>
              <th className="pb-2">Orders</th>
              <th className="pb-2">Revenue</th>
              <th className="pb-2">Commission</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {top5.map(a => (
              <tr key={a.id} className="table-row-hover">
                <td className="py-2">
                  <div className="font-medium text-ink text-xs">{a.name}</div>
                  <div className="text-[10px] text-ink-muted">{a.email}</div>
                </td>
                <td><code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded font-mono">{a.discount_code ?? a.referral_code ?? "—"}</code></td>
                <td className="text-xs">{a.orders}</td>
                <td className="text-xs font-medium">{formatMoney(a.revenue)}</td>
                <td className="text-xs font-semibold text-primary">{formatMoney(a.commission)}</td>
                <td>{statusBadge(a.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ programs, onClose, brandId }: { programs: any[]; onClose: () => void; brandId: string }) {
  const [form, setForm] = useState({ name: "", email: "", commission_type: "pct", commission_value: "", program_id: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch("/api/affiliates/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, brand_id: brandId }),
    });
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 1500);
  }

  return (
    <Modal title="Invite Affiliate" onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <p className="font-semibold text-ink">Invitation sent!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Commission Type</label>
              <select className="input" value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}>
                <option value="pct">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="label">Commission Value</label>
              <input className="input" type="number" value={form.commission_value} onChange={e => setForm(f => ({ ...f, commission_value: e.target.value }))} placeholder={form.commission_type === "pct" ? "15" : "50"} />
            </div>
          </div>
          <div>
            <label className="label">Program</label>
            <select className="input" value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}>
              <option value="">Default program</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Custom Message (optional)</label>
            <textarea className="input resize-none" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Welcome to our affiliate program…" />
          </div>
          <button className="btn-primary w-full" onClick={submit} disabled={loading || !form.name || !form.email}>
            {loading ? "Sending…" : "Send Invitation"}
          </button>
        </>
      )}
    </Modal>
  );
}

// ─── Affiliates Tab ───────────────────────────────────────────────────────────

function AffiliatesTab({ affiliates, conversions, programs, brandId }: Pick<Props, "affiliates" | "conversions" | "programs" | "brandId">) {
  const [showInvite, setShowInvite] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const convsByAff = useMemo(() => {
    const map: Record<string, { revenue: number; commission: number; orders: number; history: any[] }> = {};
    conversions.forEach(c => {
      const id = c.affiliate_id;
      map[id] = map[id] ?? { revenue: 0, commission: 0, orders: 0, history: [] };
      map[id].revenue += Number(c.order_value ?? 0);
      map[id].commission += Number(c.commission_amount ?? 0);
      map[id].orders += 1;
      map[id].history.push(c);
    });
    return map;
  }, [conversions]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function bulkEmail() {
    const ids = Array.from(selected);
    await fetch("/api/affiliates/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliate_ids: ids, brand_id: brandId }),
    });
    setSelected(new Set());
  }

  function copyLink(code: string, id: string) {
    navigator.clipboard.writeText(`https://shop.example.com?ref=${code}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={bulkEmail} className="btn-outline text-xs gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email {selected.size} selected
            </button>
          )}
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Invite Affiliate
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-tint text-xs text-ink-muted border-b border-surface-border">
            <tr>
              <th className="p-3 w-8"><input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(affiliates.map(a => a.id)) : new Set())} /></th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Program</th>
              <th className="p-3 text-right">Clicks</th>
              <th className="p-3 text-right">Orders</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">Commission</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {affiliates.map(aff => {
              const stats = convsByAff[aff.id] ?? { revenue: 0, commission: 0, orders: 0, history: [] };
              const prog = programs.find(p => p.id === aff.program_id);
              const isExpanded = expanded === aff.id;
              const referralLink = `https://shop.example.com?ref=${aff.discount_code ?? aff.referral_code ?? aff.id}`;
              return (
                <>
                  <tr key={aff.id} className="table-row-hover">
                    <td className="p-3"><input type="checkbox" checked={selected.has(aff.id)} onChange={() => toggleSelect(aff.id)} className="rounded" /></td>
                    <td className="p-3">
                      <div className="font-medium text-ink">{aff.name}</div>
                      <div className="text-[11px] text-ink-muted">{aff.email}</div>
                    </td>
                    <td className="p-3"><code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded font-mono">{aff.discount_code ?? aff.referral_code ?? "—"}</code></td>
                    <td className="p-3 text-xs text-ink-muted">{prog?.name ?? "Default"}</td>
                    <td className="p-3 text-right text-xs">{formatNumber(aff.click_count ?? 0)}</td>
                    <td className="p-3 text-right text-xs">{stats.orders}</td>
                    <td className="p-3 text-right text-xs font-medium">{formatMoney(stats.revenue)}</td>
                    <td className="p-3 text-right text-xs font-semibold text-primary">{formatMoney(stats.commission)}</td>
                    <td className="p-3">
                      <select
                        defaultValue={aff.status}
                        onChange={e => updateStatus(aff.id, e.target.value)}
                        className="text-xs border border-surface-border rounded-lg px-2 py-1 bg-surface outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="banned">Banned</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setExpanded(isExpanded ? null : aff.id)} className="text-ink-muted hover:text-ink">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${aff.id}-expanded`} className="bg-surface-tint">
                      <td colSpan={10} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-muted">Referral link:</span>
                            <code className="text-xs font-mono bg-white border border-surface-border px-2 py-1 rounded-lg flex-1 truncate">{referralLink}</code>
                            <button onClick={() => copyLink(aff.discount_code ?? aff.id, aff.id)} className="btn-outline text-xs gap-1">
                              <Copy className="w-3 h-3" />
                              {copied === aff.id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          {aff.custom_link && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-ink-muted">Custom link:</span>
                              <code className="text-xs font-mono bg-white border border-surface-border px-2 py-1 rounded-lg">{aff.custom_link}</code>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-ink-muted mb-2">Conversion history ({stats.history.length})</p>
                            {stats.history.length === 0 ? (
                              <p className="text-xs text-ink-subtle">No conversions yet.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead><tr className="text-left text-ink-muted"><th className="pb-1">Order</th><th>Date</th><th>Order Value</th><th>Commission</th></tr></thead>
                                <tbody>
                                  {stats.history.slice(0, 5).map((c: any, i: number) => (
                                    <tr key={i} className="border-t border-surface-border">
                                      <td className="py-1">{c.order_id ?? "—"}</td>
                                      <td>{(c.converted_at ?? "").slice(0, 10)}</td>
                                      <td>{formatMoney(c.order_value)}</td>
                                      <td className="font-semibold text-primary">{formatMoney(c.commission_amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {affiliates.length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">No affiliates yet. Invite your first one!</div>
        )}
      </div>

      {showInvite && <InviteModal programs={programs} onClose={() => setShowInvite(false)} brandId={brandId} />}
    </div>
  );
}

// ─── Programs Tab ─────────────────────────────────────────────────────────────

function ProgramsTab({ programs, affiliates, brandId }: Pick<Props, "programs" | "affiliates" | "brandId">) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", commission_type: "pct", commission_pct: "", cookie_days: "30", min_payout: "", payout_method: "bank", require_approval: false, mlm_enabled: false });
  const [loading, setLoading] = useState(false);

  async function createProgram() {
    setLoading(true);
    await fetch("/api/affiliates/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "program", ...form, brand_id: brandId }),
    });
    setLoading(false);
    setShowCreate(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create Program
        </button>
      </div>

      <div className="grid gap-4">
        {programs.length === 0 && (
          <div className="card text-center py-12 text-ink-muted text-sm">No programs yet. Create your first affiliate program.</div>
        )}
        {programs.map(prog => {
          const count = affiliates.filter(a => a.program_id === prog.id).length;
          return (
            <div key={prog.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-ink">{prog.name}</span>
                  {prog.is_active ? <span className="badge-success">Active</span> : <span className="badge-neutral">Inactive</span>}
                </div>
                {prog.description && <p className="text-xs text-ink-muted mb-2">{prog.description}</p>}
                <div className="flex items-center gap-4 text-xs text-ink-muted">
                  <span><b className="text-ink">{prog.commission_pct ?? prog.commission_value}%</b> commission</span>
                  <span><b className="text-ink">{prog.cookie_days ?? 30}</b> cookie days</span>
                  <span><b className="text-ink">{count}</b> affiliates</span>
                  {prog.min_payout && <span>Min payout: <b className="text-ink">{formatMoney(prog.min_payout)}</b></span>}
                </div>
              </div>
              <button className="text-ink-muted hover:text-ink">
                {prog.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <Modal title="Create Program" onClose={() => setShowCreate(false)}>
          <div>
            <label className="label">Program Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Influencer Program" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Commission Type</label>
              <select className="input" value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}>
                <option value="pct">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="label">Commission %</label>
              <input className="input" type="number" value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))} placeholder="15" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Cookie Days</label>
              <input className="input" type="number" value={form.cookie_days} onChange={e => setForm(f => ({ ...f, cookie_days: e.target.value }))} />
            </div>
            <div>
              <label className="label">Min Payout</label>
              <input className="input" type="number" value={form.min_payout} onChange={e => setForm(f => ({ ...f, min_payout: e.target.value }))} placeholder="50" />
            </div>
            <div>
              <label className="label">Payout Method</label>
              <select className="input" value={form.payout_method} onChange={e => setForm(f => ({ ...f, payout_method: e.target.value }))}>
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.require_approval} onChange={e => setForm(f => ({ ...f, require_approval: e.target.checked }))} className="rounded" />
              Require approval
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.mlm_enabled} onChange={e => setForm(f => ({ ...f, mlm_enabled: e.target.checked }))} className="rounded" />
              MLM / Sub-affiliates
            </label>
          </div>
          <button className="btn-primary w-full" onClick={createProgram} disabled={loading || !form.name}>
            {loading ? "Creating…" : "Create Program"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────────────────────

function PayoutsTab({ payouts, affiliates, brandId }: Pick<Props, "payouts" | "affiliates" | "brandId">) {
  const [loading, setLoading] = useState<string | null>(null);

  const pending = payouts.filter(p => p.status === "pending");
  const totalPending = pending.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const thisMonth = payouts
    .filter(p => (p.period ?? "").startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);

  async function markPaid(id: string) {
    setLoading(id);
    await fetch("/api/affiliates/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payout_id: id, action: "mark_paid", brand_id: brandId }),
    });
    setLoading(null);
  }

  async function generateReport() {
    await fetch("/api/affiliates/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_report", brand_id: brandId }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="kpi-label">Total Pending</div>
          <div className="kpi-value text-amber-600">{formatMoney(totalPending)}</div>
          <div className="text-xs text-ink-muted mt-1">{pending.length} affiliates awaiting payment</div>
        </div>
        <div className="card">
          <div className="kpi-label">This Month</div>
          <div className="kpi-value">{formatMoney(thisMonth)}</div>
          <div className="text-xs text-ink-muted mt-1">Total payouts this month</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={generateReport} className="btn-outline text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" /> Generate Payout Report
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-tint text-xs text-ink-muted border-b border-surface-border">
            <tr>
              <th className="p-3 text-left">Affiliate</th>
              <th className="p-3 text-left">Period</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Paid Date</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => {
              const aff = affiliates.find(a => a.id === p.affiliate_id);
              return (
                <tr key={p.id} className="table-row-hover">
                  <td className="p-3">
                    <div className="font-medium text-ink text-xs">{aff?.name ?? "Unknown"}</div>
                    <div className="text-[10px] text-ink-muted">{aff?.email}</div>
                  </td>
                  <td className="p-3 text-xs">{p.period ?? "—"}</td>
                  <td className="p-3 text-right text-xs font-semibold">{formatMoney(p.amount)}</td>
                  <td className="p-3 text-xs capitalize">{p.payout_method ?? "bank"}</td>
                  <td className="p-3">{statusBadge(p.status ?? "pending")}</td>
                  <td className="p-3 text-xs text-ink-muted">{p.paid_at ? (p.paid_at ?? "").slice(0, 10) : "—"}</td>
                  <td className="p-3">
                    {p.status === "pending" && (
                      <button
                        onClick={() => markPaid(p.id)}
                        disabled={loading === p.id}
                        className="btn-outline text-xs py-1 px-2"
                      >
                        {loading === p.id ? "…" : "Mark Paid"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payouts.length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">No payouts yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── Fraud Tab ────────────────────────────────────────────────────────────────

function FraudTab({ affiliates, clicks, conversions }: Pick<Props, "affiliates" | "clicks" | "conversions">) {
  const flagged = useMemo(() => {
    return affiliates
      .filter(a => (a.fraud_score ?? 0) > 30)
      .map(a => ({
        ...a,
        flags: [
          a.self_referral_count > 0 && "Self-referrals detected",
          a.same_ip_clicks > 5 && "Same-IP click cluster",
          a.fraud_score > 70 && "High fraud score",
        ].filter(Boolean),
      }));
  }, [affiliates]);

  async function blockAffiliate(id: string) {
    await fetch(`/api/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "banned" }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="card border-l-4 border-l-red-400 bg-red-50">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-red-700 text-sm">Fraud Detection</span>
        </div>
        <p className="text-xs text-red-600">Affiliates with fraud_score &gt; 30 appear here. Signals: same-IP clicks, self-referrals, unusual conversion spikes.</p>
      </div>

      {flagged.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-ink">No fraud detected</p>
          <p className="text-xs text-ink-muted mt-1">All affiliates are below the fraud threshold.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-xs text-ink-muted border-b border-surface-border">
              <tr>
                <th className="p-3 text-left">Affiliate</th>
                <th className="p-3 text-right">Fraud Score</th>
                <th className="p-3 text-left">Flags</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map(a => (
                <tr key={a.id} className="table-row-hover">
                  <td className="p-3">
                    <div className="font-medium text-ink">{a.name}</div>
                    <div className="text-[11px] text-ink-muted">{a.email}</div>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-bold text-sm ${a.fraud_score > 70 ? "text-red-600" : "text-amber-600"}`}>{a.fraud_score}</span>
                    <span className="text-xs text-ink-muted">/100</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(a.flags as string[]).map((flag: string) => (
                        <span key={flag} className="badge-crit text-[10px]">{flag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => blockAffiliate(a.id)} className="btn-danger text-xs py-1 px-2 gap-1">
                        <Ban className="w-3 h-3" /> Block
                      </button>
                      <button className="btn-outline text-xs py-1 px-2 gap-1">
                        <Eye className="w-3 h-3" /> Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ brandId }: { brandId: string }) {
  const [settings, setSettings] = useState({
    cookie_days: "30",
    auto_approve: false,
    min_payout: "50",
    marketplace: false,
    fraud_threshold: "30",
  });
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch(`/api/affiliates/${brandId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "settings", ...settings }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="card space-y-4">
        <h3 className="font-semibold text-ink">Program Defaults</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Default Cookie Days</label>
            <input className="input" type="number" value={settings.cookie_days} onChange={e => setSettings(s => ({ ...s, cookie_days: e.target.value }))} />
          </div>
          <div>
            <label className="label">Minimum Payout</label>
            <input className="input" type="number" value={settings.min_payout} onChange={e => setSettings(s => ({ ...s, min_payout: e.target.value }))} />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={settings.auto_approve} onChange={e => setSettings(s => ({ ...s, auto_approve: e.target.checked }))} className="rounded" />
          <div>
            <div className="text-sm font-medium text-ink">Auto-approve new affiliates</div>
            <div className="text-xs text-ink-muted">Affiliates are approved instantly without manual review</div>
          </div>
        </label>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-ink">Marketplace</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={settings.marketplace} onChange={e => setSettings(s => ({ ...s, marketplace: e.target.checked }))} className="rounded" />
          <div>
            <div className="text-sm font-medium text-ink">List on affiliate marketplace</div>
            <div className="text-xs text-ink-muted">Allow affiliates to discover and join your program</div>
          </div>
        </label>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-ink">Fraud Detection</h3>
        <div>
          <label className="label">Fraud Score Threshold (0–100)</label>
          <input className="input" type="number" min="0" max="100" value={settings.fraud_threshold} onChange={e => setSettings(s => ({ ...s, fraud_threshold: e.target.value }))} />
          <p className="text-xs text-ink-muted mt-1">Affiliates above this score are flagged in the Fraud tab.</p>
        </div>
      </div>

      <button onClick={save} className="btn-primary gap-1.5">
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function AffiliatesClient({ brandId, affiliates, clicks, conversions, programs, payouts }: Props) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="space-y-6">
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Overview" && <OverviewTab affiliates={affiliates} clicks={clicks} conversions={conversions} payouts={payouts} />}
      {tab === "Affiliates" && <AffiliatesTab affiliates={affiliates} conversions={conversions} programs={programs} brandId={brandId} />}
      {tab === "Programs" && <ProgramsTab programs={programs} affiliates={affiliates} brandId={brandId} />}
      {tab === "Payouts" && <PayoutsTab payouts={payouts} affiliates={affiliates} brandId={brandId} />}
      {tab === "Fraud" && <FraudTab affiliates={affiliates} clicks={clicks} conversions={conversions} />}
      {tab === "Settings" && <SettingsTab brandId={brandId} />}
    </div>
  );
}
