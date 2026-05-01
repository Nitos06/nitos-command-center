"use client";

import { useState } from "react";
import { Zap, Users, Mail, TrendingUp, Calendar, Plus, ToggleLeft, ToggleRight, Loader2, CheckCircle2, Send, AlertCircle } from "lucide-react";
import { DeliverabilityChart } from "./deliverability-chart";
import { formatMoney, formatPct } from "@/lib/utils";

const TABS = [
  { id: "flows",         label: "Flows",          icon: Zap          },
  { id: "calendar",      label: "Calendar",        icon: Calendar     },
  { id: "segments",      label: "Segments",        icon: Users        },
  { id: "campaigns",     label: "Campaigns",       icon: Mail         },
  { id: "deliverability",label: "Deliverability",  icon: TrendingUp   },
  { id: "roi",           label: "ROI Calculator",  icon: TrendingUp   },
] as const;

type TabId = typeof TABS[number]["id"];

interface Props {
  brandId: string | null;
  flows: any[];
  campaigns: any[];
  segments: any[];
  chartData: any[];
  agentLogs: any[];
  openRate: number;
  ctr: number;
  bounceRate: number;
  revenue: number;
  totalSent: number;
}

/* ─── Flow Step Visualiser ──────────────────── */
function FlowSteps({ steps }: { steps: any[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mt-3 flex items-center gap-0">
      {steps.map((s: any, i: number) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-ink-subtle text-center max-w-[60px] leading-tight">
              {s.delay ? <span className="block text-primary-400 mb-0.5">{s.delay}</span> : null}
              <span className="text-ink-muted truncate block">{s.subject ?? s.name ?? `Email ${i + 1}`}</span>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 h-px bg-surface-border mx-1 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 border-l-4 border-t-4 border-b-4 border-l-surface-border border-t-transparent border-b-transparent" style={{ width: 0 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Toggle Flow Active ────────────────────── */
function FlowToggle({ flowId, active, brandId }: { flowId: string; active: boolean; brandId: string | null }) {
  const [val, setVal] = useState(active);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!brandId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/email/flows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowId, isActive: !val, brandId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setVal(v => !v);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className="flex items-center gap-1 text-xs disabled:opacity-50 transition-colors">
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-ink-muted" /> : val ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-ink-muted" />}
      <span className={val ? "text-green-500" : "text-ink-muted"}>{val ? "Active" : "Paused"}</span>
    </button>
  );
}

/* ─── Create Segment ────────────────────────── */
function CreateSegmentForm({ brandId, onDone }: { brandId: string | null; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", type: "dynamic", rules: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brandId }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDone();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const ruleExamples = {
    dynamic: "e.g. purchased_count >= 2 AND last_purchase_days <= 60",
    static:  "Leave blank — manually assign customers",
    shopify: "e.g. shopify_tag = 'vip' OR total_spent > 500",
  };

  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-xl border border-surface-border bg-surface-tint/20">
      <h3 className="font-semibold text-sm text-ink">Create new segment</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Segment name</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VIP Customers" className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400">
            <option value="dynamic">Dynamic (auto-updates from Shopify)</option>
            <option value="static">Static (manual list)</option>
            <option value="shopify">Shopify tag-based</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] text-ink-muted block mb-1">Rules / filter logic</label>
        <textarea rows={2} value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} placeholder={ruleExamples[form.type as keyof typeof ruleExamples] ?? ""} className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none" />
        <p className="text-[10px] text-ink-subtle mt-1">The email agent will evaluate this nightly against Shopify customer data and assign customers automatically.</p>
      </div>
      <div>
        <label className="text-[10px] text-ink-muted block mb-1">Description (optional)</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="High-value repeat buyers" className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !brandId} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          {saving ? "Creating…" : "Create segment"}
        </button>
        {!brandId && <span className="text-xs text-amber-500">Select a brand first.</span>}
      </div>
    </form>
  );
}

/* ─── Calendar View ─────────────────────────── */
function EmailCalendar({ campaigns, brandId }: { campaigns: any[]; brandId: string | null }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Map campaigns to their send day
  const byday: Record<string, any[]> = {};
  for (const c of campaigns) {
    if (c.sent_at || c.scheduled_for) {
      const d = new Date(c.sent_at ?? c.scheduled_for);
      const key = d.toDateString();
      if (!byday[key]) byday[key] = [];
      byday[key].push(c);
    }
  }

  // Show 4 weeks
  const weeks: Date[][] = [];
  for (let w = 0; w < 4; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + w * 7 + d);
      week.push(date);
    }
    weeks.push(week);
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {days.map(d => <div key={d} className="text-center text-[10px] text-ink-muted font-semibold py-1">{d}</div>)}
      </div>
      {/* Weeks */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date, di) => {
              const key = date.toDateString();
              const items = byday[key] ?? [];
              const isToday = date.toDateString() === today.toDateString();
              const isPast = date < today;
              return (
                <div key={di} className={`min-h-[70px] rounded-lg border p-1.5 ${isToday ? "border-primary-400 bg-primary-500/5" : "border-surface-border"} ${isPast && !isToday ? "opacity-60" : ""}`}>
                  <div className={`text-[10px] font-semibold mb-1 ${isToday ? "text-primary-400" : "text-ink-muted"}`}>
                    {date.getDate()}
                  </div>
                  {items.map((c: any, i: number) => (
                    <div key={i} className={`text-[9px] px-1 py-0.5 rounded mb-0.5 truncate ${c.status === "sent" ? "bg-green-100 text-green-700" : "bg-primary-500/10 text-primary-600"}`}>
                      {c.name ?? "Campaign"}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {campaigns.length === 0 && (
        <p className="text-sm text-ink-muted text-center py-8">No campaigns scheduled. The email agent publishes the weekly campaign every Monday — you can also create campaigns manually.</p>
      )}
    </div>
  );
}

/* ─── ROI Calculator ────────────────────────── */
function EmailROICalculator() {
  const [channel, setChannel] = useState<"email" | "email_sms">("email");
  const [activeProfiles, setActiveProfiles] = useState(5000);
  const [newVisitors, setNewVisitors] = useState(10000);
  const [aov, setAov] = useState(65);
  const [ordersPerMonth, setOrdersPerMonth] = useState(1.2);
  const [campaignsPerMonth, setCampaignsPerMonth] = useState(4);
  const [flowRecipients, setFlowRecipients] = useState(1000);
  const [smsSubscribers, setSmsSubscribers] = useState(1000);

  // Computed values (live)
  const newSubRate = 0.02;
  const newSubsPerMonth = newVisitors * newSubRate;
  const newSubRevenue = newSubsPerMonth * 12 * aov * ordersPerMonth * 0.15;

  const campaignRevenue = activeProfiles * campaignsPerMonth * 0.22 * 0.025 * 0.025 * aov * 12;

  const flowRevenue = flowRecipients * 0.35 * 0.05 * 0.04 * aov * 12;

  const smsRevenue =
    channel === "email_sms" ? smsSubscribers * 0.08 * 0.03 * aov * 12 : 0;

  const totalAnnual = newSubRevenue + campaignRevenue + flowRevenue + smsRevenue;

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

  const labelClass = "block text-xs text-gray-500 mb-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Left column — inputs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
          Tell Us About Your Email Program
        </p>

        {/* Channel toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setChannel("email")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              channel === "email"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Email Only
          </button>
          <button
            onClick={() => setChannel("email_sms")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              channel === "email_sms"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Email + SMS
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}># of active email subscribers</label>
            <input
              type="number"
              value={activeProfiles}
              onChange={(e) => setActiveProfiles(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Monthly website visitors</label>
            <input
              type="number"
              value={newVisitors}
              onChange={(e) => setNewVisitors(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Average order value</label>
            <input
              type="number"
              value={aov}
              onChange={(e) => setAov(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Avg orders per customer per month</label>
            <input
              type="number"
              step="0.1"
              value={ordersPerMonth}
              onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Campaigns sent per month</label>
            <input
              type="number"
              value={campaignsPerMonth}
              onChange={(e) => setCampaignsPerMonth(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Recipients in automated flows per month</label>
            <input
              type="number"
              value={flowRecipients}
              onChange={(e) => setFlowRecipients(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          {channel === "email_sms" && (
            <div>
              <label className={labelClass}>Active SMS subscribers</label>
              <input
                type="number"
                value={smsSubscribers}
                onChange={(e) => setSmsSubscribers(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right column — results */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        {/* Hero total */}
        <div>
          <div className="text-5xl font-bold text-white">
            {totalAnnual.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-indigo-400 mt-1 text-sm">estimated / year</div>
        </div>

        <p className="text-gray-400 text-sm mt-4 mb-3">
          See where your revenue is coming from:
        </p>

        {/* Revenue breakdown */}
        <div className="divide-y divide-gray-700">
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400 text-sm">New subscribers</span>
            <span className="text-white font-semibold">
              ${Math.round(newSubRevenue).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400 text-sm">Email campaigns</span>
            <span className="text-white font-semibold">
              ${Math.round(campaignRevenue).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400 text-sm">Automated flows</span>
            <span className="text-white font-semibold">
              ${Math.round(flowRevenue).toLocaleString()}
            </span>
          </div>
          {channel === "email_sms" && (
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm">SMS campaigns</span>
              <span className="text-white font-semibold">
                ${Math.round(smsRevenue).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Footnote */}
        <p className="text-gray-500 text-xs mt-4">
          Estimates based on industry averages: 22% email open rate, 2.5% CTR.
          Actual results vary. All calculations run in your browser.
        </p>
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────── */
export function EmailTabs(props: Props) {
  const [tab, setTab] = useState<TabId>("flows");
  const [showSegForm, setShowSegForm] = useState(false);

  const { brandId, flows, campaigns, segments, chartData, agentLogs, openRate, ctr, bounceRate, revenue, totalSent } = props;

  const deliveryColor = openRate >= 45 ? "text-green-600" : openRate >= 30 ? "text-amber-500" : "text-red-500";

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
            </button>
          );
        })}
      </div>

      {/* ── FLOWS ── */}
      {tab === "flows" && (
        <div className="space-y-3">
          {flows.length === 0 ? (
            <div className="card text-center py-10">
              <Zap className="w-8 h-8 text-ink-subtle mx-auto mb-3" />
              <p className="text-sm text-ink-muted">No flows set up yet.</p>
              <p className="text-xs text-ink-subtle mt-1">The email agent will create Welcome, Abandoned Cart, Post-Purchase, and Win-Back flows automatically on first run.</p>
            </div>
          ) : (
            flows.map((f: any) => {
              const steps = Array.isArray(f.steps) ? f.steps : (f.email_count ? Array(f.email_count).fill({}) : []);
              return (
                <div key={f.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-ink">{f.name}</span>
                        <span className="badge-primary text-[10px]">{f.trigger_event}</span>
                        {f.revenue && <span className="text-[10px] text-green-600 font-semibold">{formatMoney(f.revenue)} revenue</span>}
                      </div>
                      {f.description && <p className="text-xs text-ink-muted mt-0.5">{f.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-subtle">
                        <span>{f.email_count ?? steps.length} emails</span>
                        {f.open_rate != null && <span>{Math.round(f.open_rate * 100)}% open</span>}
                        {f.click_rate != null && <span>{Math.round(f.click_rate * 100)}% click</span>}
                      </div>
                    </div>
                    <FlowToggle flowId={f.id} active={f.is_active} brandId={brandId} />
                  </div>
                  <FlowSteps steps={steps} />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === "calendar" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">Email calendar — 4 weeks</h2>
            <span className="text-xs text-ink-muted">Agent publishes weekly campaign every Monday at 07:00</span>
          </div>
          <EmailCalendar campaigns={campaigns} brandId={brandId} />
        </div>
      )}

      {/* ── SEGMENTS ── */}
      {tab === "segments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Segments ({segments.length})</h2>
            <button onClick={() => setShowSegForm(s => !s)} className="flex items-center gap-1.5 btn-outline text-xs px-3 py-1.5">
              <Plus className="w-3 h-3" />
              New segment
            </button>
          </div>

          {showSegForm && <CreateSegmentForm brandId={brandId} onDone={() => setShowSegForm(false)} />}

          {segments.length === 0 ? (
            <div className="card text-center py-10">
              <Users className="w-8 h-8 text-ink-subtle mx-auto mb-3" />
              <p className="text-sm text-ink-muted">No segments yet.</p>
              <p className="text-xs text-ink-subtle mt-1">Create a segment above and the agent will populate it nightly from Shopify data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {segments.map((seg: any) => (
                <div key={seg.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-ink">{seg.name}</div>
                      {seg.description && <div className="text-xs text-ink-muted mt-0.5">{seg.description}</div>}
                    </div>
                    <span className="badge-primary text-[10px]">{seg.type ?? "static"}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="text-2xl font-bold text-ink">{(seg.subscriber_count ?? 0).toLocaleString()}</span>
                    <span className="text-ink-muted">subscribers</span>
                  </div>
                  {seg.rules && (
                    <div className="mt-2 px-2 py-1.5 rounded-lg bg-surface-tint border border-surface-border">
                      <div className="text-[10px] text-ink-subtle font-mono">{typeof seg.rules === "string" ? seg.rules : JSON.stringify(seg.rules)}</div>
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-ink-subtle">
                    {seg.last_synced_at ? `Synced ${new Date(seg.last_synced_at).toLocaleDateString()}` : "Not yet synced"}
                    {seg.revenue_attributed ? ` · ${formatMoney(seg.revenue_attributed)} revenue` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <h2 className="font-semibold text-ink">Campaigns ({campaigns.length})</h2>
          {campaigns.length === 0 ? (
            <div className="card text-center py-10">
              <Mail className="w-8 h-8 text-ink-subtle mx-auto mb-3" />
              <p className="text-sm text-ink-muted">No campaigns yet. Agent sends every Monday.</p>
            </div>
          ) : (
            <div className="card">
              <table className="w-full text-sm">
                <thead className="text-left text-ink-muted text-xs">
                  <tr>
                    <th className="py-2">Campaign</th>
                    <th>Segment</th>
                    <th>Sent</th>
                    <th>Open</th>
                    <th>Click</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any) => (
                    <tr key={c.id} className="border-t border-surface-border">
                      <td className="py-1.5">
                        <div className="font-medium text-ink text-xs">{c.name}</div>
                        <div className="text-ink-subtle text-[11px]">{c.subject ?? ""}</div>
                      </td>
                      <td className="text-ink-muted text-xs">{c.segment ?? "All"}</td>
                      <td className="text-ink-muted text-xs">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "—"}</td>
                      <td className="text-xs">{c.open_rate != null ? `${Math.round(c.open_rate * 100)}%` : "—"}</td>
                      <td className="text-xs">{c.click_rate != null ? `${Math.round(c.click_rate * 100)}%` : "—"}</td>
                      <td className="text-xs">{c.revenue ? formatMoney(c.revenue) : "—"}</td>
                      <td><span className={c.status === "sent" ? "badge-success" : c.status === "draft" ? "badge-primary" : "badge-warn"}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ROI CALCULATOR ── */}
      {tab === "roi" && <EmailROICalculator />}

      {/* ── DELIVERABILITY ── */}
      {tab === "deliverability" && (
        <div className="space-y-4">
          {/* Health overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Open rate (30d)", value: formatPct(openRate), good: openRate >= 45, target: ">45%" },
              { label: "Click rate (30d)", value: formatPct(ctr), good: ctr >= 1, target: ">1%" },
              { label: "Bounce rate (30d)", value: formatPct(bounceRate), good: bounceRate < 1, target: "<1%", invert: true },
              { label: "Revenue (30d)", value: formatMoney(revenue), good: true, target: "" },
            ].map(m => (
              <div key={m.label} className="card py-3 px-4">
                <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">{m.label}</div>
                <div className={`text-xl font-bold ${m.good ? "text-green-600" : "text-red-500"}`}>{m.value}</div>
                {m.target && <div className="text-[10px] text-ink-subtle">Target {m.target}</div>}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink">Deliverability — last 30 days</h2>
              <span className={`text-sm font-semibold ${deliveryColor}`}>
                {openRate >= 45 ? "Healthy" : openRate >= 30 ? "Monitor" : "At risk"}
              </span>
            </div>
            <DeliverabilityChart data={chartData} />
            <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-primary-500 inline-block" /> Open rate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-green-500 inline-block" /> Click rate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-red-400 inline-block" /> Bounce rate</span>
            </div>
          </div>

          {/* SES status */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Amazon SES status
            </h2>
            <p className="text-xs text-ink-muted mb-3">Configure SES in Settings → Email. The email agent monitors bounce/complaint rates via SES nightly and alerts you if they exceed thresholds.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total sent (30d)", value: totalSent.toLocaleString() },
                { label: "Bounce threshold", value: "< 5%" },
                { label: "Complaint threshold", value: "< 0.1%" },
              ].map(s => (
                <div key={s.label} className="px-3 py-2 rounded-xl bg-surface-tint border border-surface-border text-xs">
                  <div className="text-ink-muted mb-0.5">{s.label}</div>
                  <div className="font-semibold text-ink">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent log */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-3">Email agent activity</h2>
            {agentLogs.length === 0 ? (
              <p className="text-xs text-ink-muted">No activity yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {agentLogs.map((log: any) => (
                  <li key={log.id} className="text-xs border-l-2 border-primary-200 pl-2">
                    <span className="text-ink-muted">{new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · </span>
                    <span className="text-ink">{log.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
