"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2, Plus, Calculator, History, Building2, Settings2, Receipt, TrendingUp, AlertTriangle, Megaphone, RefreshCw } from "lucide-react";
import { formatMoney } from "@/lib/utils";

/* ─── Types ─────────────────────────────────── */
interface TaxesClientProps {
  brandId: string | null;
  yearRevenue: number;
  ytdNetProfit: number;
  netVatDue: number;
  masHanchasotMonthly: number;
  bituachLeumiMonthly: number;
  estimatedAnnualTax: number;
  projectedAnnual: number;
  bracket: { label: string; min: number; max: number; rate: number };
  IL_BRACKETS: { label: string; min: number; max: number; rate: number }[];
  thisYear: number;
  vatReports: any[];
  bituach: any[];
  invoiceUploads: any[];
  chartData: any[];
  byCategory: Record<string, number>;
  totalExpenses: number;
  entity: any;
  depositHistory: any[];
  fees: any;
}

/* ─── Invoice Upload ────────────────────────── */
function InvoiceUpload({ brandId }: { brandId: string }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setDone(false);
    const form = new FormData();
    form.append("file", file);
    form.append("brandId", brandId);
    try {
      const res = await fetch("/api/taxes/upload-invoice", { method: "POST", body: form });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Upload failed (${res.status})`);
      }
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      setError(err.message ?? "Upload failed — check Supabase Storage 'uploads' bucket exists & is public.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className={`flex items-center gap-2 cursor-pointer btn-outline text-sm px-3 py-1.5 ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Upload className="w-3.5 h-3.5" />}
        {done ? "Uploaded!" : uploading ? "Uploading…" : "Upload invoice"}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFile} disabled={uploading} />
      </label>
      {error && <p className="text-[11px] text-red-500 max-w-xs">{error}</p>}
    </div>
  );
}

/* ─── Osek Mursh vs Hevra Baam Calculator ──── */
function EntityCalculator({ currentNet }: { currentNet: number }) {
  const [net, setNet] = useState(currentNet > 0 ? String(Math.round(currentNet)) : "");

  const netNum = Number(net.replace(/,/g, "")) || 0;

  // Osek Murshe: progressive income tax + Bituach Leumi on profit
  // BL (self-employed): ~12% on first ₪6,331/mo, ~17.8% above that (approximate)
  function calcOsekMurshe(annualNet: number) {
    const IL_BRACKETS_OM = [
      { min: 0, max: 84120, rate: 0.10 },
      { min: 84120, max: 120720, rate: 0.14 },
      { min: 120720, max: 193800, rate: 0.20 },
      { min: 193800, max: 269280, rate: 0.31 },
      { min: 269280, max: 560280, rate: 0.35 },
      { min: 560280, max: 721560, rate: 0.47 },
      { min: 721560, max: Infinity, rate: 0.50 },
    ];
    let incomeTax = 0;
    for (const b of IL_BRACKETS_OM) {
      if (annualNet <= b.min) break;
      incomeTax += (Math.min(annualNet, b.max) - b.min) * b.rate;
    }
    // Bituach Leumi self-employed (simplified): ~17% on net above ₪75,888/yr threshold
    const blFloor = 75888;
    const blRate = 0.172;
    const bl = annualNet > blFloor ? (annualNet - blFloor) * blRate : 0;
    return { incomeTax: Math.round(incomeTax), bl: Math.round(bl), total: Math.round(incomeTax + bl) };
  }

  function calcHevra(annualNet: number) {
    // Corporate tax: 23%
    const corpTax = Math.round(annualNet * 0.23);
    // Dividend tax on remaining: 25% on dividend (effective)
    const afterCorp = annualNet - corpTax;
    const dividendTax = Math.round(afterCorp * 0.25);
    // BL as salaried owner (minimal salary ~₪50k/yr)
    const ownerSalary = Math.min(annualNet * 0.3, 200000);
    const blSalaried = Math.round(ownerSalary * 0.035); // employee share only
    return { corpTax, dividendTax, bl: blSalaried, total: corpTax + dividendTax + blSalaried };
  }

  const om = calcOsekMurshe(netNum);
  const hb = calcHevra(netNum);
  const saving = hb.total - om.total;
  const better = saving > 0 ? "osek" : "hevra";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-ink-muted block mb-1.5">Annual net profit (₪)</label>
        <input
          type="text"
          value={net}
          onChange={e => setNet(e.target.value.replace(/[^0-9,]/g, ""))}
          placeholder="e.g. 350,000"
          className="w-full px-3 py-2 rounded-xl bg-surface-tint border border-surface-border text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
      </div>

      {netNum > 0 && (
        <>
          <div className={`rounded-xl border-2 p-3 ${better === "osek" ? "border-green-400 bg-green-50/10" : "border-surface-border"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-ink">Osek Murshe (עוסק מורשה)</span>
              {better === "osek" && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">BETTER</span>}
            </div>
            <div className="space-y-1 text-xs text-ink-muted">
              <div className="flex justify-between"><span>Mas Hachnasot</span><span>{formatMoney(om.incomeTax)}</span></div>
              <div className="flex justify-between"><span>Bituach Leumi</span><span>{formatMoney(om.bl)}</span></div>
              <div className="flex justify-between font-semibold text-ink border-t border-surface-border pt-1 mt-1"><span>Total tax burden</span><span>{formatMoney(om.total)}</span></div>
              <div className="text-ink-subtle">Effective rate: {netNum > 0 ? ((om.total / netNum) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>

          <div className={`rounded-xl border-2 p-3 ${better === "hevra" ? "border-green-400 bg-green-50/10" : "border-surface-border"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-ink">Hevra Ba'am (חברה בע"מ)</span>
              {better === "hevra" && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">BETTER</span>}
            </div>
            <div className="space-y-1 text-xs text-ink-muted">
              <div className="flex justify-between"><span>Corporate tax (23%)</span><span>{formatMoney(hb.corpTax)}</span></div>
              <div className="flex justify-between"><span>Dividend tax (25%)</span><span>{formatMoney(hb.dividendTax)}</span></div>
              <div className="flex justify-between"><span>Bituach Leumi (owner salary)</span><span>{formatMoney(hb.bl)}</span></div>
              <div className="flex justify-between font-semibold text-ink border-t border-surface-border pt-1 mt-1"><span>Total tax burden</span><span>{formatMoney(hb.total)}</span></div>
              <div className="text-ink-subtle">Effective rate: {netNum > 0 ? ((hb.total / netNum) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>

          <div className={`rounded-xl px-3 py-2.5 text-xs font-medium ${Math.abs(saving) > 0 ? (better === "osek" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200") : "bg-surface-tint text-ink-muted border border-surface-border"}`}>
            {Math.abs(saving) === 0
              ? "Both structures are equivalent at this income level."
              : better === "osek"
              ? `Osek Murshe saves you ~${formatMoney(Math.abs(saving))}/yr at this profit level.`
              : `Hevra Ba'am saves you ~${formatMoney(Math.abs(saving))}/yr at this profit level.`
            }
            {netNum < 400000 && (
              <span className="block mt-1 font-normal text-ink-muted">Generally: Osek Murshe wins under ~₪400k net. Hevra Ba'am wins above ~₪500k+.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Add Expense Form ──────────────────────── */
function AddExpenseForm({ brandId }: { brandId: string }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ vendor: "", amount: "", vat: "", category: "General", date: new Date().toISOString().slice(0, 10), notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/taxes/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brandId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      setForm({ vendor: "", amount: "", vat: "", category: "General", date: new Date().toISOString().slice(0, 10), notes: "" });
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      alert(err.message ?? "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  const cats = ["General", "Advertising", "Software", "Shipping", "COGS", "Office", "Legal", "Accounting", "Salary", "Other"];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Vendor</label>
          <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Meta Ads, AWS…" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Amount (₪)</label>
          <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">VAT amount (₪)</label>
          <input type="number" step="0.01" value={form.vat} onChange={e => setForm(f => ({ ...f, vat: e.target.value }))} placeholder="0.00" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Category</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400">
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-[10px] text-ink-muted block mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className="w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
      </div>
      <button type="submit" disabled={saving || !form.amount} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : done ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        {done ? "Saved!" : saving ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}

/* ─── Fees Config ───────────────────────────── */
function FeesConfig({ brandId }: { brandId: string }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [fees, setFees] = useState({
    shopify_fee_pct: "2.0",
    wise_fee_pct: "0.5",
    wise_fee_fixed: "0.65",
    shipping_cost_avg: "",
    product_cost_avg: "",
    other_fees: "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/taxes/fees-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fees, brandId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: keyof typeof fees; label: string; hint: string; prefix?: string; suffix?: string }[] = [
    { key: "shopify_fee_pct", label: "Shopify transaction fee", hint: "% of sale price", suffix: "%" },
    { key: "wise_fee_pct", label: "Wise transfer fee", hint: "% per transfer", suffix: "%" },
    { key: "wise_fee_fixed", label: "Wise fixed fee", hint: "Per transfer", prefix: "$" },
    { key: "shipping_cost_avg", label: "Avg. shipping cost", hint: "Per order (₪ or $)", prefix: "₪" },
    { key: "product_cost_avg", label: "Avg. product COGS", hint: "Per unit (₪ or $)", prefix: "₪" },
    { key: "other_fees", label: "Other fees / notes", hint: "E.g. payment gateway, customs…" },
  ];

  return (
    <form onSubmit={save} className="space-y-3">
      <p className="text-xs text-ink-muted">These are used by the finance agent daily to compute accurate net profit margins.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-[10px] text-ink-muted block mb-1">{f.label} <span className="text-ink-subtle">— {f.hint}</span></label>
            <div className="relative">
              {f.prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">{f.prefix}</span>}
              <input
                value={fees[f.key]}
                onChange={e => setFees(prev => ({ ...prev, [f.key]: e.target.value }))}
                className={`w-full px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 ${f.prefix ? "pl-6" : ""}`}
                placeholder="0"
              />
              {f.suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">{f.suffix}</span>}
            </div>
          </div>
        ))}
      </div>
      <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : done ? <CheckCircle2 className="w-3 h-3" /> : <Settings2 className="w-3 h-3" />}
        {done ? "Saved!" : saving ? "Saving…" : "Save fees config"}
      </button>
    </form>
  );
}

/* ─── Deposit History ───────────────────────── */
function DepositHistory({ history }: { history: any[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-ink-muted py-4 text-center">No deposit history yet. History will populate as the finance agent records monthly deposits.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-ink-muted text-xs">
        <tr>
          <th className="py-1.5">Month</th>
          <th>Mas Hachnasot</th>
          <th>Bituach Leumi</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {history.map((row: any, i: number) => (
          <tr key={i} className="border-t border-surface-border">
            <td className="py-1.5 text-xs">{row.month ?? "—"}</td>
            <td className="text-xs">{formatMoney(row.mas_hachnasot ?? 0)}</td>
            <td className="text-xs">{formatMoney(row.bituach_leumi ?? 0)}</td>
            <td className="text-xs font-semibold">{formatMoney((row.mas_hachnasot ?? 0) + (row.bituach_leumi ?? 0))}</td>
            <td><span className={row.paid ? "badge-success" : "badge-warn"}>{row.paid ? "Paid" : "Due"}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Meta Ads Connection Tab ─────────────────────── */
function MetaAdsTab({ brandId }: { brandId: string }) {
  const [form, setForm] = useState({
    adAccountId: "",
    accessToken: "",
    pixelId: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [adSpendData, setAdSpendData] = useState<{ date: string; spend: number; impressions: number; clicks: number }[]>([]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/taxes/meta-ads-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, ...form }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/taxes/meta-ads-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (data.rows) setAdSpendData(data.rows);
      setLastSync(new Date().toLocaleString());
    } catch {}
    setSyncing(false);
  }

  const totalSpend = adSpendData.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = adSpendData.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = adSpendData.reduce((s, r) => s + r.clicks, 0);

  return (
    <div className="space-y-5">
      {/* Connection card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Megaphone className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Meta Ads Connection</div>
            <div className="text-xs text-ink-muted">Connect your Meta Ads account to automatically pull ad spend into your tax expenses and P&L.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-ink-muted uppercase tracking-wider block mb-1">Ad Account ID</label>
            <input
              value={form.adAccountId}
              onChange={e => set("adAccountId", e.target.value)}
              placeholder="act_123456789"
              className="w-full px-3 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 font-mono"
            />
            <p className="text-[10px] text-ink-subtle mt-1">Find in Meta Business Manager → Accounts → Ad Accounts</p>
          </div>
          <div>
            <label className="text-[10px] text-ink-muted uppercase tracking-wider block mb-1">Pixel ID</label>
            <input
              value={form.pixelId}
              onChange={e => set("pixelId", e.target.value)}
              placeholder="123456789012345"
              className="w-full px-3 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 font-mono"
            />
            <p className="text-[10px] text-ink-subtle mt-1">Events Manager → your pixel → Settings</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] text-ink-muted uppercase tracking-wider block mb-1">Access Token</label>
            <input
              value={form.accessToken}
              onChange={e => set("accessToken", e.target.value)}
              placeholder="EAAxxxxx…"
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-surface-tint border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 font-mono"
            />
            <p className="text-[10px] text-ink-subtle mt-1">
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">Graph API Explorer</a>
              {" → "}Generate token with ads_read, ads_management permissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.adAccountId || !form.accessToken}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Connection"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-surface-border text-ink-muted hover:text-ink hover:border-primary-400/40 transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {syncing ? "Syncing…" : "Sync Ad Spend"}
          </button>
          {lastSync && <span className="text-[10px] text-ink-subtle">Last synced: {lastSync}</span>}
        </div>
      </div>

      {/* How it works */}
      <div className="card space-y-3">
        <div className="text-xs font-semibold text-ink">How it works</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: "🔗", title: "Connect", desc: "Paste your Ad Account ID and access token. Credentials are stored encrypted per brand." },
            { icon: "📊", title: "Auto-sync", desc: "The agent pulls daily ad spend from Meta Marketing API and logs it as a business expense automatically." },
            { icon: "🧾", title: "Tax ready", desc: "Ad spend appears in your Expenses tab categorized as 'Marketing' and feeds into your monthly P&L and VAT reports." },
          ].map(s => (
            <div key={s.title} className="flex gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-xs font-semibold text-ink mb-0.5">{s.title}</div>
                <div className="text-[11px] text-ink-muted leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ad spend data */}
      {adSpendData.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-ink">Recent Ad Spend</div>
            <div className="flex gap-4 text-[11px] text-ink-muted">
              <span>Total spend: <strong className="text-ink">${totalSpend.toFixed(2)}</strong></span>
              <span>Impressions: <strong className="text-ink">{totalImpressions.toLocaleString()}</strong></span>
              <span>Clicks: <strong className="text-ink">{totalClicks.toLocaleString()}</strong></span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted">
                  <th className="text-left py-1.5 pr-4 font-medium">Date</th>
                  <th className="text-right py-1.5 pr-4 font-medium">Spend</th>
                  <th className="text-right py-1.5 pr-4 font-medium">Impressions</th>
                  <th className="text-right py-1.5 font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {adSpendData.slice(0, 14).map(row => (
                  <tr key={row.date} className="border-b border-surface-border/50 hover:bg-surface-tint/50">
                    <td className="py-1.5 pr-4 text-ink">{row.date}</td>
                    <td className="py-1.5 pr-4 text-right font-medium text-ink">${row.spend.toFixed(2)}</td>
                    <td className="py-1.5 pr-4 text-right text-ink-muted">{row.impressions.toLocaleString()}</td>
                    <td className="py-1.5 text-right text-ink-muted">{row.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adSpendData.length === 0 && (
        <div className="card py-10 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-ink-subtle opacity-40" />
          <div className="text-sm font-medium text-ink-muted">No ad spend data yet</div>
          <div className="text-xs text-ink-subtle mt-1">Connect your account above and click "Sync Ad Spend"</div>
        </div>
      )}
    </div>
  );
}

/* ─── Main export ───────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "deposits", label: "Monthly Deposits", icon: History },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "entity", label: "Entity Type", icon: Calculator },
  { id: "fees", label: "Fees & Prices", icon: Settings2 },
  { id: "invoices", label: "Invoices", icon: Building2 },
  { id: "meta_ads", label: "Meta Ads", icon: Megaphone },
] as const;

type TabId = typeof TABS[number]["id"];

export function TaxesClient(props: TaxesClientProps) {
  const [tab, setTab] = useState<TabId>("overview");

  const {
    brandId, yearRevenue, ytdNetProfit, netVatDue,
    masHanchasotMonthly, bituachLeumiMonthly, estimatedAnnualTax,
    projectedAnnual, bracket, IL_BRACKETS, thisYear,
    vatReports, bituach, invoiceUploads, byCategory,
    totalExpenses, entity, depositHistory,
  } = props;

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card py-3 px-4">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">{thisYear} Revenue</div>
          <div className="text-xl font-bold text-ink">{formatMoney(yearRevenue)}</div>
        </div>
        <div className="card py-3 px-4">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">YTD Net Profit (est.)</div>
          <div className="text-xl font-bold text-ink">{formatMoney(ytdNetProfit)}</div>
        </div>
        <div className="card py-3 px-4">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">Net VAT Due</div>
          <div className="text-xl font-bold text-ink">{formatMoney(netVatDue)}</div>
          <div className="text-[10px] text-ink-subtle mt-0.5">Sales VAT − input VAT</div>
        </div>
        <div className="card py-3 px-4">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">Monthly Deposits</div>
          <div className="text-base font-bold text-ink">{formatMoney(masHanchasotMonthly + bituachLeumiMonthly)}</div>
          <div className="text-[10px] text-ink-subtle mt-0.5">
            Mas: {formatMoney(masHanchasotMonthly)} · BL: {formatMoney(bituachLeumiMonthly)}
          </div>
        </div>
      </div>

      {!entity && (
        <div className="card-warm mb-4">
          <div className="font-medium text-accent-600 mb-1">Tax entity not configured</div>
          <p className="text-sm text-ink-muted">Go to the Entity Type tab below to set your Osek Patur / Osek Murshe / Chevra Ba'am details.</p>
        </div>
      )}

      {/* Tabs */}
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

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tax Bracket */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Mas Hachnasa Bracket
            </h2>
            <div className="mb-3">
              <div className="text-2xl font-bold text-ink">{bracket.label}</div>
              <div className="text-xs text-ink-muted mt-0.5">Projected annual net: {formatMoney(projectedAnnual)}</div>
            </div>
            <div className="space-y-1.5">
              {IL_BRACKETS.map((b) => {
                const active = b === bracket;
                const filled = projectedAnnual > b.min;
                return (
                  <div key={b.label} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg ${active ? "bg-primary-100 font-semibold text-primary-700" : filled ? "bg-green-50 text-green-700" : "text-ink-muted"}`}>
                    <span>{b.label}</span>
                    <span>₪{b.min.toLocaleString()} – {b.max === Infinity ? "∞" : `₪${b.max.toLocaleString()}`}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-surface-border text-sm flex justify-between text-ink-muted">
              <span>Est. annual income tax</span>
              <span className="font-semibold text-ink">{formatMoney(estimatedAnnualTax)}</span>
            </div>
          </div>

          {/* VAT Reports */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-3">VAT Reports</h2>
            {vatReports.length === 0 ? (
              <p className="text-sm text-ink-muted">No VAT reports yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-ink-muted text-xs">
                  <tr><th className="py-1.5">Period</th><th>Net due</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {vatReports.map((r: any) => (
                    <tr key={r.id} className="border-t border-surface-border">
                      <td className="py-1.5 text-xs">{r.period_start} →<br />{r.period_end}</td>
                      <td className="text-ink-muted text-xs">{formatMoney(r.net_vat_due)}</td>
                      <td><span className={r.status === "submitted" ? "badge-success" : "badge-warn"}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bituach Leumi */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-3">Bituach Leumi</h2>
            {bituach.length === 0 ? (
              <p className="text-sm text-ink-muted">No BL payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-ink-muted text-xs">
                  <tr><th className="py-1.5">Period</th><th>Due</th><th>Paid</th></tr>
                </thead>
                <tbody>
                  {bituach.map((b: any) => (
                    <tr key={b.id} className="border-t border-surface-border">
                      <td className="py-1.5 text-xs">{b.period_start}</td>
                      <td className="text-ink-muted text-xs">{formatMoney(b.amount_due)}</td>
                      <td className="text-ink-muted text-xs">{b.paid_at ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── MONTHLY DEPOSITS ── */}
      {tab === "deposits" && (
        <div className="space-y-4">
          {/* This month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <div className="text-xs text-ink-muted mb-1">This month — Mas Hachnasot</div>
              <div className="text-3xl font-bold text-ink">{formatMoney(masHanchasotMonthly)}</div>
              <div className="text-xs text-ink-subtle mt-1">Based on projected annual net · bracket {bracket.label}</div>
            </div>
            <div className="card">
              <div className="text-xs text-ink-muted mb-1">This month — Bituach Leumi</div>
              <div className="text-3xl font-bold text-ink">{formatMoney(bituachLeumiMonthly)}</div>
              <div className="text-xs text-ink-subtle mt-1">Self-employed rate · updates when agent runs</div>
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-primary-500" />
              Deposit history (clears & re-records monthly)
            </h2>
            <DepositHistory history={depositHistory} />
          </div>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add expense
            </h2>
            {brandId ? <AddExpenseForm brandId={brandId} /> : <p className="text-sm text-ink-muted">Select a brand first.</p>}
          </div>

          <div className="card">
            <h2 className="font-semibold text-ink mb-3">{thisYear} Expenses by category</h2>
            {Object.keys(byCategory).length === 0 ? (
              <p className="text-sm text-ink-muted">No expenses recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {(Object.entries(byCategory) as [string, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, total]) => (
                    <li key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted capitalize">{cat}</span>
                      <span className="font-medium text-ink">{formatMoney(total)}</span>
                    </li>
                  ))}
                <li className="flex items-center justify-between text-sm pt-2 border-t border-surface-border">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="font-bold text-ink">{formatMoney(totalExpenses)}</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── ENTITY TYPE ── */}
      {tab === "entity" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-500" />
              Osek Murshe vs. Hevra Ba'am calculator
            </h2>
            <EntityCalculator currentNet={projectedAnnual} />
          </div>

          <div className="card">
            <h2 className="font-semibold text-ink mb-3">Current entity</h2>
            {entity ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-muted">Type</span><span className="font-medium text-ink">{entity.entity_type}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Business name</span><span className="font-medium text-ink">{entity.business_name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">VAT number</span><span className="font-medium text-ink">{entity.vat_number ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Tax ID</span><span className="font-medium text-ink">{entity.tax_id ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Reporting freq.</span><span className="font-medium text-ink">{entity.vat_reporting_frequency ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Accountant email</span><span className="font-medium text-ink">{entity.accountant_email ?? "—"}</span></div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No entity configured yet. Contact support to add it via Settings or Supabase → tax_entities.</p>
            )}
          </div>
        </div>
      )}

      {/* ── FEES & PRICES ── */}
      {tab === "fees" && (
        <div className="card max-w-2xl">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary-500" />
            Fees & price configuration
          </h2>
          {brandId ? <FeesConfig brandId={brandId} /> : <p className="text-sm text-ink-muted">Select a brand first.</p>}
        </div>
      )}

      {/* ── META ADS ── */}
      {tab === "meta_ads" && <MetaAdsTab brandId={brandId ?? ""} />}

      {/* ── INVOICES ── */}
      {tab === "invoices" && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Uploaded invoices</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted">{invoiceUploads.length} recent</span>
              {brandId && <InvoiceUpload brandId={brandId} />}
            </div>
          </div>
          {invoiceUploads.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink-muted">
              <Upload className="w-8 h-8 mx-auto mb-2 text-ink-subtle" />
              Upload invoices here, or send via Telegram with <code className="bg-surface-tint px-1 rounded">#receipt</code> tag. Finance agent will OCR and categorise automatically.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Date</th><th>Vendor</th><th>Amount</th><th>Category</th><th>Status</th></tr>
              </thead>
              <tbody>
                {invoiceUploads.map((u: any) => (
                  <tr key={u.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-xs">{new Date(u.uploaded_at).toLocaleDateString()}</td>
                    <td className="text-ink-muted text-xs">{u.vendor_name ?? "—"}</td>
                    <td className="text-xs">{u.amount ? formatMoney(u.amount) : "—"}</td>
                    <td className="text-ink-muted text-xs">{u.category ?? "—"}</td>
                    <td>
                      <span className={u.status === "processed" ? "badge-success" : u.status === "error" ? "badge-crit" : "badge-warn"}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
