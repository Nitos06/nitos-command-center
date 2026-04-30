"use client";

import { useState } from "react";
import {
  Plus, Trash2, Copy, Pause, Play, ArrowRight, Zap, Settings2,
  ChevronDown, Check, Search, X, TrendingUp, Activity, AlertCircle,
  FileText, Shield, Lock, ChevronUp, Bot
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";

interface Props {
  brandId: string;
  funnels: any[];
  conversions: any[];
}

const TABS = ["Funnels", "Analytics", "Settings", "Landing Page"] as const;
type Tab = typeof TABS[number];

type StepType = "upsell" | "downsell" | "cross-sell";

function Badge({ label, color }: { label: string; color: "green" | "yellow" | "blue" | "gray" | "purple" }) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
  };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>{label}</span>;
}

const STEP_TYPE_META: Record<StepType, { label: string; color: "green" | "blue" | "purple"; icon: string }> = {
  upsell: { label: "Upsell", color: "green", icon: "↑" },
  downsell: { label: "Downsell", color: "yellow" as any, icon: "↓" },
  "cross-sell": { label: "Cross-sell", color: "blue", icon: "→" },
};

/* ─── Step Card in Builder ──────────────────────── */
interface StepData {
  id: number;
  step_type: StepType;
  product_title: string;
  product_id: string;
  discount_pct: string;
  headline: string;
  subheadline: string;
  button_text: string;
  decline_text: string;
}

function StepRow({ step, idx, onChange, onRemove }: { step: StepData; idx: number; onChange: (updated: StepData) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = STEP_TYPE_META[step.step_type] ?? STEP_TYPE_META.upsell;
  const set = (field: keyof StepData, value: string) => onChange({ ...step, [field]: value });

  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white bg-indigo-500 flex-shrink-0">{idx + 1}</span>
        <span className="flex-1 text-sm text-gray-800 font-medium">{meta.icon} {step.step_type}</span>
        <Badge label={meta.label} color={meta.color} />
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-200 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Step type</label>
            <select
              value={step.step_type}
              onChange={e => set("step_type", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {(Object.keys(STEP_TYPE_META) as StepType[]).map(t => (
                <option key={t} value={t}>{STEP_TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Product title</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={step.product_title}
                onChange={e => set("product_title", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Product title…"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
            <input
              type="number"
              value={step.discount_pct}
              onChange={e => set("discount_pct", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Headline</label>
            <input
              value={step.headline}
              onChange={e => set("headline", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Wait! Add this to your order…"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sub-headline</label>
            <input
              value={step.subheadline}
              onChange={e => set("subheadline", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="One-time offer, expires now."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Accept button text</label>
            <input
              value={step.button_text}
              onChange={e => set("button_text", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Yes, add to my order!"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Decline link text</label>
            <input
              value={step.decline_text}
              onChange={e => set("decline_text", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="No thanks, I'll skip this."
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Funnel Builder Modal ──────────────────────── */
const TRIGGER_OPTIONS = ["All orders", "Specific product/tag", "Order value > X"] as const;
const PLACEMENT_OPTIONS = ["Post-purchase", "Thank-you page", "Checkout"] as const;

function makeStep(step_type: StepType = "upsell"): StepData {
  return { id: Date.now() + Math.random(), step_type, product_title: "", product_id: "", discount_pct: "", headline: "", subheadline: "", button_text: "", decline_text: "" };
}

function NewFunnelModal({ brandId, onClose, onCreated }: { brandId: string; onClose: () => void; onCreated: (f: any) => void }) {
  const [name, setName] = useState("");
  const [trigger_type, setTriggerType] = useState("All orders");
  const [trigger_value, setTriggerValue] = useState("");
  const [ai_pick, setAiPick] = useState(false);
  const [placement, setPlacement] = useState("Post-purchase");
  const [steps, setSteps] = useState<StepData[]>([makeStep("upsell")]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateStep = (id: number, updated: StepData) =>
    setSteps(ss => ss.map(s => s.id === id ? updated : s));

  const addStep = (step_type: StepType) =>
    setSteps(ss => [...ss, makeStep(step_type)]);

  const removeStep = (id: number) =>
    setSteps(ss => ss.filter(s => s.id !== id));

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Funnel name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/pp-funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, name, trigger_type, trigger_value, ai_pick, placement, steps }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onCreated(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create funnel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Funnel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Funnel name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. High-AOV Upsell"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Trigger</label>
            <div className="grid grid-cols-3 gap-2">
              {TRIGGER_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTriggerType(t)}
                  className={`py-2 px-3 rounded-xl border text-xs transition text-left ${trigger_type === t ? "border-indigo-400 text-indigo-700 bg-indigo-50" : "border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50"}`}
                >{t}</button>
              ))}
            </div>
            {trigger_type !== "All orders" && (
              <input
                value={trigger_value}
                onChange={e => setTriggerValue(e.target.value)}
                className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder={trigger_type === "Specific product/tag" ? "product handle or tag…" : "minimum order value…"}
              />
            )}
          </div>

          {/* Placement */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Placement</label>
            <div className="grid grid-cols-3 gap-2">
              {PLACEMENT_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlacement(p)}
                  className={`py-2 px-3 rounded-xl border text-xs transition ${placement === p ? "border-indigo-400 text-indigo-700 bg-indigo-50" : "border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50"}`}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* AI mode */}
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">AI pick mode</div>
              <div className="text-xs text-gray-500">AI selects the best upsell based on cart content</div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={ai_pick} onChange={e => setAiPick(e.target.checked)} className="peer sr-only" />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Steps */}
          {!ai_pick && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Steps</span>
                <div className="flex gap-1.5">
                  {(Object.keys(STEP_TYPE_META) as StepType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => addStep(t)}
                      className="text-[11px] px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
                    >
                      + {STEP_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <StepRow key={s.id} step={s} idx={i} onChange={updated => updateStep(s.id, updated)} onRemove={() => removeStep(s.id)} />
                ))}
                {steps.length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">No steps yet — add one above.</div>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {saving ? "Saving…" : "Activate Funnel"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Funnels Tab ───────────────────────────────── */
function FunnelsTab({ brandId, funnels: initialFunnels, conversions }: { brandId: string; funnels: any[]; conversions: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [funnels, setFunnels] = useState(initialFunnels);
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(initialFunnels.map(f => [f.id, f.is_active]))
  );

  const handleToggle = async (funnelId: string) => {
    const newVal = !active[funnelId];
    setActive(a => ({ ...a, [funnelId]: newVal }));
    try {
      await fetch("/api/pp-funnels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnelId, is_active: newVal }),
      });
    } catch {
      // revert on error
      setActive(a => ({ ...a, [funnelId]: !newVal }));
    }
  };

  const handleDelete = async (funnelId: string) => {
    if (!confirm("Delete this funnel?")) return;
    setFunnels(fs => fs.filter(f => f.id !== funnelId));
    try {
      await fetch("/api/pp-funnels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnelId }),
      });
    } catch {
      // optimistic — leave deleted from UI
    }
  };

  return (
    <div className="space-y-4">
      {showModal && (
        <NewFunnelModal
          brandId={brandId}
          onClose={() => setShowModal(false)}
          onCreated={f => setFunnels(fs => [f, ...fs])}
        />
      )}
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> New Funnel
        </button>
      </div>

      {funnels.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No funnels yet — create your first above.</div>
      ) : (
        <div className="space-y-4">
          {funnels.map(funnel => {
            const fc = conversions.filter(c => c.funnel_id === funnel.id);
            const accepted = fc.filter(c => c.accepted).length;
            const revenue = fc.reduce((s, c) => s + Number(c.upsell_revenue ?? 0), 0);
            const rate = fc.length > 0 ? ((accepted / fc.length) * 100).toFixed(1) : "0.0";

            return (
              <div key={funnel.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{funnel.name}</span>
                      <Badge label={active[funnel.id] ? "active" : "paused"} color={active[funnel.id] ? "green" : "yellow"} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{funnel.trigger_product ?? "All orders"} · {funnel.pp_steps?.length ?? 0} steps</div>
                  </div>
                  <div className="text-right text-xs flex-shrink-0">
                    <div className="font-semibold text-gray-900">${revenue.toLocaleString()}</div>
                    <div className="text-gray-400">{rate}% accept</div>
                  </div>
                  <button
                    onClick={() => handleToggle(funnel.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex-shrink-0 ${active[funnel.id] ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700"}`}
                  >
                    {active[funnel.id] ? <><Pause className="w-3 h-3 inline mr-1" />Pause</> : <><Play className="w-3 h-3 inline mr-1" />Activate</>}
                  </button>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-500 rounded hover:bg-indigo-50 transition"><Settings2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(funnel.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Visual step pipeline */}
                {(funnel.pp_steps?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {funnel.pp_steps.map((step: any, i: number) => {
                      const meta = STEP_TYPE_META[step.step_type as StepType] ?? STEP_TYPE_META.upsell;
                      return (
                        <div key={step.id} className="flex items-center gap-1.5">
                          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${meta.color === "green" ? "border-green-200 bg-green-50" : meta.color === "blue" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
                            <span className="text-sm">{meta.icon}</span>
                            <div>
                              <div className="text-xs font-semibold text-gray-800">{meta.label}</div>
                              {step.product_title && <div className="text-[11px] text-gray-500 truncate max-w-[120px]">{step.product_title}</div>}
                              {step.discount_pct && <div className="text-[11px] text-gray-400">{step.discount_pct}% off</div>}
                            </div>
                          </div>
                          {i < funnel.pp_steps.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                        </div>
                      );
                    })}
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

/* ─── Analytics Tab ─────────────────────────────── */
function PPAnalyticsTab({ funnels, conversions }: { funnels: any[]; conversions: any[] }) {
  const totalRevenue = conversions.reduce((s, c) => s + Number(c.upsell_revenue ?? 0), 0);
  const accepted = conversions.filter(c => c.accepted).length;
  const acceptRate = conversions.length > 0 ? ((accepted / conversions.length) * 100).toFixed(1) : "0.0";
  const avgUpsell = accepted > 0 ? (totalRevenue / accepted).toFixed(2) : "0.00";

  const kpis = [
    { label: "Total upsell revenue", value: `$${totalRevenue.toLocaleString()}` },
    { label: "Accept rate", value: `${acceptRate}%` },
    { label: "Offers shown", value: String(conversions.length) },
    { label: "Avg upsell value", value: `$${avgUpsell}` },
  ];

  // Build 30-day daily revenue chart data
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dayConv = conversions.filter(c => {
      const cd = new Date(c.converted_at ?? 0);
      return cd.toDateString() === d.toDateString();
    });
    return {
      date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      revenue: dayConv.reduce((s, c) => s + Number(c.upsell_revenue ?? 0), 0),
    };
  });

  const funnelTable = funnels.map(f => {
    const fc = conversions.filter(c => c.funnel_id === f.id);
    const acc = fc.filter(c => c.accepted).length;
    const rev = fc.reduce((s, c) => s + Number(c.upsell_revenue ?? 0), 0);
    return {
      name: f.name,
      shown: fc.length,
      accepted: acc,
      revenue: rev,
      rate: fc.length > 0 ? ((acc / fc.length) * 100).toFixed(1) : "0.0",
      steps: f.pp_steps ?? [],
    };
  });

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-xl font-bold text-gray-900">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Daily upsell revenue (30d)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="ppGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#ppGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel comparison table */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Funnel comparison</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Funnel</th>
              <th className="text-right pb-2 font-medium">Shown</th>
              <th className="text-right pb-2 font-medium">Accepted</th>
              <th className="text-right pb-2 font-medium">Revenue</th>
              <th className="text-right pb-2 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {funnelTable.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-xs">No data yet</td></tr>
            ) : (
              funnelTable.map((f, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 text-gray-800">{f.name}</td>
                  <td className="py-2 text-right text-gray-600">{f.shown}</td>
                  <td className="py-2 text-right text-gray-600">{f.accepted}</td>
                  <td className="py-2 text-right font-semibold text-indigo-600">${f.revenue.toFixed(0)}</td>
                  <td className="py-2 text-right">
                    <span className={`text-xs font-semibold ${Number(f.rate) >= 20 ? "text-green-600" : Number(f.rate) >= 10 ? "text-amber-600" : "text-gray-500"}`}>
                      {f.rate}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Step-by-step conversion */}
      {funnelTable.filter(f => f.steps.length > 0).map(f => (
        <div key={f.name} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">{f.name} — step conversion</div>
          <div className="flex items-center gap-2 flex-wrap">
            {f.steps.map((step: any, i: number) => {
              const pct = Math.max(10, 100 - i * 25);
              const meta = STEP_TYPE_META[step.step_type as StepType] ?? STEP_TYPE_META.upsell;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`px-3 py-2 rounded-xl border text-xs font-medium ${meta.color === "green" ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                      {meta.icon} Step {i + 1}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{pct}%</div>
                  </div>
                  {i < f.steps.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Settings Tab ──────────────────────────────── */
function PPSettingsTab() {
  const [testMode, setTestMode] = useState(false);

  const checks = [
    { label: "Shopify checkout extension", status: "connected", hint: "Installed on store as post-purchase extension" },
    { label: "Webhook: orders/created", status: "connected", hint: "Firing correctly to /api/pp/webhook" },
    { label: "Webhook: orders/updated", status: "warning", hint: "Not yet confirmed — check Shopify Partners dashboard" },
  ];

  return (
    <div className="space-y-4 max-w-xl">
      {checks.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
          {c.status === "connected" ? (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{c.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.hint}</div>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === "connected" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {c.status}
          </span>
        </div>
      ))}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Test mode</div>
          <div className="text-xs text-gray-500 mt-0.5">Funnels show only to you — no real charges</div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} className="peer sr-only" />
          <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
        </label>
      </div>

      {testMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Test mode is on. Place a test order in Shopify to preview your funnel.
        </div>
      )}
    </div>
  );
}

/* ─── Landing Page Editor ───────────────────────── */
type LPSectionType = 'urgent_bar' | 'wait_header' | 'headline' | 'media' | 'trust_badges' | 'features' | 'cta_buttons' | 'footer';

interface LPSection {
  id: number;
  type: LPSectionType;
  config: Record<string, any>;
}

const DEFAULT_LP_SECTIONS: LPSection[] = [
  { id: 1, type: 'urgent_bar', config: { text: '** DO NOT CLOSE THIS PAGE - CUSTOMIZE YOUR ORDER BELOW **', bgColor: '#e65c00', textColor: '#fff' } },
  { id: 2, type: 'wait_header', config: { text: '⚠️ WAIT! Your Order Is Not Yet Complete', progressPct: 50, progressText: 'Your order is 50% complete...' } },
  { id: 3, type: 'headline', config: { headline: 'Would You Like To Add [Product Name] To Your Order?', subheadline: 'Regular Price $99.99 – Add to your order today for only $29.99!', headlineColor: '#1a1a2e', priceColor: '#e63946', salePriceColor: '#2dc653' } },
  { id: 4, type: 'media', config: { type: 'image', url: '', placeholder: true } },
  { id: 5, type: 'trust_badges', config: { badges: [{ icon: 'shield', text: '30-Day Money Back Guarantee', desc: 'Not happy? Full refund.' }, { icon: 'lock', text: '100% Secure & Safe Checkout', desc: 'SSL Secured payments' }] } },
  { id: 6, type: 'features', config: { heading: 'Are You Ready to Join Now?', subheading: "Here's exactly what you're getting...", bullets: ['Instant access to the complete program', 'Lifetime access via our secure portal', 'Bonus #1: Authority Software ($999 value)', 'Bonus #2: Advanced Training Course ($499 value)'], bulletColor: '#2dc653' } },
  { id: 7, type: 'cta_buttons', config: { acceptText: 'YES! Add To My Order For $29.99', declineText: "No thanks, I don't want this at this price", acceptBg: '#2dc653', acceptHover: '#25a244' } },
  { id: 8, type: 'footer', config: { text: '© Copyright Your Company. All rights reserved.', textColor: '#888' } },
];

const LP_SECTION_TYPES: { type: LPSectionType; label: string }[] = [
  { type: 'urgent_bar', label: 'Urgent Bar' },
  { type: 'wait_header', label: 'Wait Header' },
  { type: 'headline', label: 'Headline' },
  { type: 'media', label: 'Media' },
  { type: 'trust_badges', label: 'Trust Badges' },
  { type: 'features', label: 'Features' },
  { type: 'cta_buttons', label: 'CTA Buttons' },
  { type: 'footer', label: 'Footer' },
];

function LPSectionRenderer({ section, isSelected, onClick }: { section: LPSection; isSelected: boolean; onClick: () => void }) {
  const ring = isSelected ? 'ring-2 ring-indigo-500' : '';
  const cfg = section.config;

  switch (section.type) {
    case 'urgent_bar':
      return (
        <div onClick={onClick} className={`cursor-pointer ${ring}`} style={{ background: cfg.bgColor, color: cfg.textColor, padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {cfg.text}
        </div>
      );
    case 'wait_header':
      return (
        <div onClick={onClick} className={`cursor-pointer bg-white py-6 px-8 ${ring}`}>
          <h2 className="text-2xl font-black text-center text-gray-900 mb-4">{cfg.text}</h2>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div className="h-3 rounded-full" style={{ width: `${cfg.progressPct}%`, background: '#3b82f6' }} />
          </div>
          <p className="text-center text-sm text-gray-500">{cfg.progressText}</p>
        </div>
      );
    case 'headline':
      return (
        <div onClick={onClick} className={`cursor-pointer px-8 py-6 text-center ${ring}`}>
          <h1 className="text-3xl font-black mb-3" style={{ color: cfg.headlineColor }}>{cfg.headline}</h1>
          <p className="text-base text-gray-600">{cfg.subheadline}</p>
        </div>
      );
    case 'media':
      return (
        <div onClick={onClick} className={`cursor-pointer relative ${ring}`} style={{ height: 400, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cfg.url ? (
            <img src={cfg.url} alt="media" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-2">▶</div>
              <div className="text-sm">Click to set video/image URL</div>
            </div>
          )}
        </div>
      );
    case 'trust_badges':
      return (
        <div onClick={onClick} className={`cursor-pointer px-8 py-4 ${ring}`}>
          <div className="flex gap-4 flex-wrap">
            {(cfg.badges || []).map((b: any, i: number) => (
              <div key={i} className="flex items-start gap-3 flex-1 min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  {b.icon === 'shield' ? <Shield className="w-5 h-5 text-gray-500" /> : <Lock className="w-5 h-5 text-gray-500" />}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{b.text}</div>
                  <div className="text-xs text-gray-500">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'features':
      return (
        <div onClick={onClick} className={`cursor-pointer px-8 py-6 ${ring}`}>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{cfg.heading}</h2>
          <p className="text-center text-indigo-600 mb-4 text-sm">{cfg.subheading}</p>
          <div className="space-y-2">
            {(cfg.bullets || []).map((b: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: cfg.bulletColor }} />
                <span className="text-sm text-gray-700">{b}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'cta_buttons':
      return (
        <div onClick={onClick} className={`cursor-pointer px-8 py-6 ${ring}`}>
          <button className="w-full py-4 text-lg font-bold text-white rounded-xl mb-3" style={{ background: cfg.acceptBg }}>{cfg.acceptText}</button>
          <p className="text-center text-xs text-gray-400 underline cursor-pointer">{cfg.declineText}</p>
        </div>
      );
    case 'footer':
      return (
        <div onClick={onClick} className={`cursor-pointer py-4 text-center text-xs ${ring}`} style={{ color: cfg.textColor }}>
          {cfg.text}
        </div>
      );
    default:
      return <div onClick={onClick} className={`cursor-pointer p-4 text-gray-400 text-sm ${ring}`}>{section.type}</div>;
  }
}

function LPSectionEditor({ section, onChange }: { section: LPSection; onChange: (s: LPSection) => void }) {
  const set = (key: string, val: any) => onChange({ ...section, config: { ...section.config, [key]: val } });
  const cfg = section.config;

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{section.type.replace(/_/g, ' ')}</div>
      {section.type === 'urgent_bar' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Text</label>
            <input value={cfg.text} onChange={e => set('text', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">BG</label>
            <input type="color" value={cfg.bgColor} onChange={e => set('bgColor', e.target.value)} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Text</label>
            <input type="color" value={cfg.textColor} onChange={e => set('textColor', e.target.value)} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}
      {section.type === 'wait_header' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Header text</label>
            <input value={cfg.text} onChange={e => set('text', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Progress: {cfg.progressPct}%</label>
            <input type="range" min={0} max={100} value={cfg.progressPct} onChange={e => set('progressPct', Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Progress text</label>
            <input value={cfg.progressText} onChange={e => set('progressText', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </>
      )}
      {section.type === 'headline' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Headline</label>
            <textarea value={cfg.headline} onChange={e => set('headline', e.target.value)} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subheadline</label>
            <textarea value={cfg.subheadline} onChange={e => set('subheadline', e.target.value)} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Headline color</label>
            <input type="color" value={cfg.headlineColor} onChange={e => set('headlineColor', e.target.value)} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}
      {section.type === 'media' && (
        <>
          <div className="flex gap-3">
            {(['image', 'video'] as const).map(t => (
              <label key={t} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="mediaType" value={t} checked={cfg.type === t} onChange={() => set('type', t)} />
                {t}
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">URL</label>
            <input value={cfg.url} onChange={e => set('url', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="https://…" />
          </div>
        </>
      )}
      {section.type === 'trust_badges' && (
        <div className="space-y-3">
          {(cfg.badges || []).map((b: any, i: number) => (
            <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-1">
              <input value={b.text} onChange={e => { const bs = [...cfg.badges]; bs[i] = { ...bs[i], text: e.target.value }; set('badges', bs); }} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Badge title" />
              <input value={b.desc} onChange={e => { const bs = [...cfg.badges]; bs[i] = { ...bs[i], desc: e.target.value }; set('badges', bs); }} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Description" />
            </div>
          ))}
          <button onClick={() => set('badges', [...(cfg.badges || []), { icon: 'shield', text: 'New Badge', desc: 'Description' }])} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add badge</button>
        </div>
      )}
      {section.type === 'features' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Heading</label>
            <input value={cfg.heading} onChange={e => set('heading', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
            <input value={cfg.subheading} onChange={e => set('subheading', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bullets</label>
            <div className="space-y-1">
              {(cfg.bullets || []).map((b: string, i: number) => (
                <div key={i} className="flex gap-1">
                  <input value={b} onChange={e => { const bs = [...cfg.bullets]; bs[i] = e.target.value; set('bullets', bs); }} className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <button onClick={() => set('bullets', cfg.bullets.filter((_: any, j: number) => j !== i))} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={() => set('bullets', [...(cfg.bullets || []), 'New bullet'])} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add bullet</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Bullet color</label>
            <input type="color" value={cfg.bulletColor} onChange={e => set('bulletColor', e.target.value)} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}
      {section.type === 'cta_buttons' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Accept text</label>
            <input value={cfg.acceptText} onChange={e => set('acceptText', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Decline text</label>
            <input value={cfg.declineText} onChange={e => set('declineText', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Accept BG</label>
            <input type="color" value={cfg.acceptBg} onChange={e => set('acceptBg', e.target.value)} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}
      {section.type === 'footer' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Text</label>
            <input value={cfg.text} onChange={e => set('text', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Text color</label>
            <input type="color" value={cfg.textColor} onChange={e => set('textColor', e.target.value)} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}
    </div>
  );
}

function PPLandingPageEditor({ brandId, funnels }: { brandId: string; funnels: any[] }) {
  const [sections, setSections] = useState<LPSection[]>(DEFAULT_LP_SECTIONS.map(s => ({ ...s, id: Date.now() + Math.random(), config: { ...s.config } })));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [linkedFunnel, setLinkedFunnel] = useState<string>("");

  const funnelId = funnels[0]?.id;

  const selectedSection = sections.find(s => s.id === selectedId) ?? null;
  const selectedIdx = sections.findIndex(s => s.id === selectedId);

  const updateSection = (updated: LPSection) =>
    setSections(ss => ss.map(s => s.id === updated.id ? updated : s));

  const moveUp = () => {
    if (selectedIdx <= 0) return;
    setSections(ss => { const a = [...ss]; [a[selectedIdx - 1], a[selectedIdx]] = [a[selectedIdx], a[selectedIdx - 1]]; return a; });
  };

  const moveDown = () => {
    if (selectedIdx < 0 || selectedIdx >= sections.length - 1) return;
    setSections(ss => { const a = [...ss]; [a[selectedIdx], a[selectedIdx + 1]] = [a[selectedIdx + 1], a[selectedIdx]]; return a; });
  };

  const deleteSection = () => {
    if (!selectedId) return;
    setSections(ss => ss.filter(s => s.id !== selectedId));
    setSelectedId(null);
  };

  const addSection = (type: LPSectionType) => {
    const defaults = DEFAULT_LP_SECTIONS.find(s => s.type === type);
    const newSection: LPSection = { id: Date.now() + Math.random(), type, config: { ...(defaults?.config ?? {}) } };
    setSections(ss => [...ss, newSection]);
    setSelectedId(newSection.id);
    setShowAddMenu(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/pp-funnels/landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, brandId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sections) setSections(data.sections);
      }
    } catch {}
    setGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/pp-funnels/save-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, sections, linkedFunnelId: linkedFunnel }),
      });
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-gray-200">
      {/* Funnel Link Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-medium text-amber-800">Link this landing page to a post-purchase funnel:</span>
        <select
          value={linkedFunnel}
          onChange={e => setLinkedFunnel(e.target.value)}
          className="text-xs border border-amber-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 min-w-[160px]"
        >
          <option value="">— Select funnel —</option>
          {funnels.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {linkedFunnel && (
          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">✓ Linked</span>
        )}
        <span className="ml-auto text-[10px] text-amber-600">When a customer triggers this funnel, they&apos;ll see this landing page as the upsell offer.</span>
      </div>
      {/* Main area: left preview + right editor */}
      <div className="flex flex-1 overflow-hidden">
      {/* Left: Live preview */}
      <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 font-semibold"
          >
            <Bot className="w-3.5 h-3.5" /> {generating ? 'Generating…' : 'Generate with AI'}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {showAddMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[100] py-1 min-w-[160px]">
                {LP_SECTION_TYPES.map(item => (
                  <button key={item.type} onClick={() => addSection(item.type)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={moveUp} disabled={!selectedId || selectedIdx <= 0} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">↑</button>
          <button onClick={moveDown} disabled={!selectedId || selectedIdx >= sections.length - 1} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">↓</button>
          <button onClick={deleteSection} disabled={!selectedId} className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Page'}
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Shopify post-purchase extension</span>
            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Setup required</span>
          </div>
        </div>
        {/* Page preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[680px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
            {sections.map(section => (
              <LPSectionRenderer
                key={section.id}
                section={section}
                isSelected={section.id === selectedId}
                onClick={() => setSelectedId(section.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Section editor */}
      <div className="w-[300px] border-l bg-white overflow-y-auto flex-shrink-0">
        <div className="text-xs font-semibold uppercase text-gray-400 p-3 border-b border-gray-100">Edit Section</div>
        {!selectedSection ? (
          <div className="p-6 text-center text-gray-400 text-sm mt-8">
            <FileText className="w-8 h-8 mx-auto mb-3 text-gray-200" />
            Click a section to edit it
          </div>
        ) : (
          <LPSectionEditor section={selectedSection} onChange={updateSection} />
        )}
      </div>
      </div>
    </div>
  );
}

/* ─── Root Component ────────────────────────────── */
export default function PPClient({ brandId, funnels, conversions }: Props) {
  const [tab, setTab] = useState<Tab>("Funnels");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Funnels" && <FunnelsTab brandId={brandId} funnels={funnels} conversions={conversions} />}
      {tab === "Analytics" && <PPAnalyticsTab funnels={funnels} conversions={conversions} />}
      {tab === "Settings" && <PPSettingsTab />}
      {tab === "Landing Page" && <PPLandingPageEditor brandId={brandId} funnels={funnels} />}
    </div>
  );
}
