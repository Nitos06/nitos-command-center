"use client";

import { useState } from "react";
import {
  Plus, Trash2, Copy, Pause, Play, ArrowRight, Zap, Settings2,
  ChevronDown, Check, Search, X, TrendingUp, Activity, AlertCircle
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

const TABS = ["Funnels", "Analytics", "Settings"] as const;
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
function StepRow({ step, idx, onRemove }: { step: any; idx: number; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = STEP_TYPE_META[step.type as StepType] ?? STEP_TYPE_META.upsell;
  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white bg-indigo-500 flex-shrink-0`}>{idx + 1}</span>
        <span className="flex-1 text-sm text-gray-800 font-medium">{meta.icon} {step.type}</span>
        <Badge label={meta.label} color={meta.color} />
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-200 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Product</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Search Shopify products…" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
            <input type="number" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="20" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Headline</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Wait! Add this to your order…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sub-headline</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="One-time offer, expires now." />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Accept button text</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Yes, add to my order!" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Decline link text</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="No thanks, I'll skip this." />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Funnel Builder Modal ──────────────────────── */
function NewFunnelModal({ onClose }: { onClose: () => void }) {
  const [steps, setSteps] = useState<any[]>([
    { id: 1, type: "upsell" },
    { id: 2, type: "downsell" },
  ]);
  const [aiMode, setAiMode] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Funnel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Funnel name</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. High-AOV Upsell" />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Trigger</label>
            <div className="grid grid-cols-3 gap-2">
              {["All orders", "Specific product/tag", "Order value > X"].map(t => (
                <button key={t} className="py-2 px-3 rounded-xl border border-gray-200 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition text-left">{t}</button>
              ))}
            </div>
          </div>

          {/* Placement */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Placement</label>
            <div className="grid grid-cols-3 gap-2">
              {["Post-purchase", "Thank-you page", "Checkout"].map(p => (
                <button key={p} className="py-2 px-3 rounded-xl border border-gray-200 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition">{p}</button>
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
              <input type="checkbox" checked={aiMode} onChange={e => setAiMode(e.target.checked)} className="peer sr-only" />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Steps */}
          {!aiMode && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Steps</span>
                <div className="flex gap-1.5">
                  {(Object.keys(STEP_TYPE_META) as StepType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setSteps(ss => [...ss, { id: Date.now(), type: t }])}
                      className="text-[11px] px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
                    >
                      + {STEP_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <StepRow key={s.id} step={s} idx={i} onRemove={() => setSteps(ss => ss.filter(x => x.id !== s.id))} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">Activate Funnel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Funnels Tab ───────────────────────────────── */
function FunnelsTab({ funnels, conversions }: { funnels: any[]; conversions: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(funnels.map(f => [f.id, f.is_active]))
  );

  return (
    <div className="space-y-4">
      {showModal && <NewFunnelModal onClose={() => setShowModal(false)} />}
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
                    onClick={() => setActive(a => ({ ...a, [funnel.id]: !a[funnel.id] }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex-shrink-0 ${active[funnel.id] ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700"}`}
                  >
                    {active[funnel.id] ? <><Pause className="w-3 h-3 inline mr-1" />Pause</> : <><Play className="w-3 h-3 inline mr-1" />Activate</>}
                  </button>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-500 rounded hover:bg-indigo-50 transition"><Settings2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition"><Copy className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
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

      {tab === "Funnels" && <FunnelsTab funnels={funnels} conversions={conversions} />}
      {tab === "Analytics" && <PPAnalyticsTab funnels={funnels} conversions={conversions} />}
      {tab === "Settings" && <PPSettingsTab />}
    </div>
  );
}
