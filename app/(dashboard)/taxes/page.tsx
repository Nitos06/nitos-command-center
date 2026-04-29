import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { Receipt, Upload, TrendingUp, AlertTriangle } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import { InvoiceUpload } from "./invoice-upload";
import { ProfitChart } from "./profit-chart";

const IL_BRACKETS = [
  { label: "10%", min: 0, max: 84120, rate: 0.10 },
  { label: "14%", min: 84120, max: 120720, rate: 0.14 },
  { label: "20%", min: 120720, max: 193800, rate: 0.20 },
  { label: "31%", min: 193800, max: 269280, rate: 0.31 },
  { label: "35%", min: 269280, max: 560280, rate: 0.35 },
  { label: "47%", min: 560280, max: 721560, rate: 0.47 },
  { label: "50%", min: 721560, max: Infinity, rate: 0.50 },
];

function computeIncomeTax(annualNet: number) {
  let tax = 0;
  for (const b of IL_BRACKETS) {
    if (annualNet <= b.min) break;
    const slice = Math.min(annualNet, b.max) - b.min;
    tax += slice * b.rate;
  }
  return Math.round(tax);
}

function currentBracket(annualNet: number) {
  for (let i = IL_BRACKETS.length - 1; i >= 0; i--) {
    if (annualNet > IL_BRACKETS[i].min) return IL_BRACKETS[i];
  }
  return IL_BRACKETS[0];
}

export default async function TaxesPage() {
  const { supabase, brandId } = await createBrandedClient();

  const thisYear = new Date().getFullYear();
  const yearStart = `${thisYear}-01-01`;
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: entity },
    { data: invoices },
    { data: expenses },
    { data: vatReports },
    { data: bituach },
    { data: bracketSnap },
    { data: invoiceUploads },
    { data: monthlyProfit },
    { data: adSpend },
  ] = await Promise.all([
    eq(supabase.from("tax_entities").select("*")).limit(1).maybeSingle(),
    eq(supabase.from("invoices_issued").select("subtotal, vat_amount, issued_at")).gte("issued_at", yearStart),
    eq(supabase.from("expenses").select("total, vat_amount, category, incurred_at")).gte("incurred_at", yearStart),
    eq(supabase.from("vat_reports").select("*")).order("period_start", { ascending: false }).limit(6),
    eq(supabase.from("bituach_leumi_payments").select("*")).order("period_start", { ascending: false }).limit(6),
    eq(supabase.from("tax_bracket_snapshots").select("*")).order("year", { ascending: false }).order("month", { ascending: false }).limit(1).maybeSingle(),
    eq(supabase.from("invoice_uploads").select("*")).order("uploaded_at", { ascending: false }).limit(10),
    eq(supabase.from("v_monthly_profit").select("*")).order("month", { ascending: false }).limit(12),
    eq(supabase.from("v_daily_ad_spend").select("total_ad_spend, date")).gte("date", yearStart),
  ]);

  const yearRevenue = invoices?.reduce((s: number, i: any) => s + Number(i.subtotal ?? 0), 0) ?? 0;
  const salesVat = invoices?.reduce((s: number, i: any) => s + Number(i.vat_amount ?? 0), 0) ?? 0;
  const inputVat = expenses?.reduce((s: number, e: any) => s + Number(e.vat_amount ?? 0), 0) ?? 0;
  const totalExpenses = expenses?.reduce((s: number, e: any) => s + Number(e.total ?? 0), 0) ?? 0;
  const totalAdSpend = adSpend?.reduce((s: number, r: any) => s + Number(r.total_ad_spend ?? 0), 0) ?? 0;
  const netVatDue = salesVat - inputVat;

  // Estimate net profit for brackets
  const monthsElapsed = new Date().getMonth() + 1;
  const ytdNetProfit = yearRevenue - totalExpenses - totalAdSpend;
  const projectedAnnual = monthsElapsed > 0 ? (ytdNetProfit / monthsElapsed) * 12 : 0;
  const bracket = currentBracket(projectedAnnual);
  const estimatedAnnualTax = computeIncomeTax(projectedAnnual);
  const monthlyDeposit = bracketSnap?.monthly_deposit_required ?? Math.round(estimatedAnnualTax / 12);

  // Monthly P&L for chart
  const chartData = (monthlyProfit ?? [])
    .slice()
    .reverse()
    .map((r: any) => ({
      month: new Date(r.month + "-01").toLocaleDateString("he-IL", { month: "short" }),
      revenue: Math.round(Number(r.net_revenue ?? 0)),
      expenses: Math.round(Number(r.total_expenses ?? 0)),
      profit: Math.round(Number(r.net_profit ?? 0)),
    }));

  // Expense breakdown by category
  const byCategory = (expenses ?? []).reduce((acc: Record<string, number>, e: any) => {
    const cat = e.category ?? "Other";
    acc[cat] = (acc[cat] ?? 0) + Number(e.total ?? 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <PageHeader
        title="Taxes (Israel)"
        subtitle="VAT, Mas Hachnasa brackets, Bituach Leumi, invoices, expenses"
        action={brandId ? <InvoiceUpload brandId={brandId} /> : null}
      />

      {!entity && (
        <div className="card-warm mb-6">
          <div className="font-medium text-accent-600 mb-1">Tax entity not configured</div>
          <p className="text-sm text-ink-muted">Go to Settings → Taxes to set your Osek Patur / Osek Murshe / Chevra Ba'am, VAT number, and reporting frequency.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label={`${thisYear} revenue`} value={formatMoney(yearRevenue)} />
        <Kpi label="YTD net profit (est.)" value={formatMoney(ytdNetProfit)} />
        <Kpi label="Net VAT due" value={formatMoney(netVatDue)} hint="Sales VAT − input VAT" />
        <Kpi label="Monthly deposit" value={formatMoney(monthlyDeposit)} hint="Mas Hachnasa estimate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Tax Bracket Card */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Mas Hachnasa Bracket
          </h2>
          <div className="mb-3">
            <div className="text-2xl font-bold text-ink">{bracket.label}</div>
            <div className="text-xs text-ink-muted mt-0.5">
              Projected annual net: {formatMoney(projectedAnnual)}
            </div>
          </div>
          <div className="space-y-1.5">
            {IL_BRACKETS.map((b) => {
              const active = b === bracket;
              const filled = projectedAnnual > b.min;
              return (
                <div key={b.label} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg ${active ? "bg-primary-100 font-semibold text-primary-700" : filled ? "bg-green-50 text-green-700" : "text-ink-muted"}`}>
                  <span>{b.label}</span>
                  <span>
                    ₪{b.min.toLocaleString()} – {b.max === Infinity ? "∞" : `₪${b.max.toLocaleString()}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-surface-border text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Est. annual income tax</span>
              <span className="font-semibold text-ink">{formatMoney(estimatedAnnualTax)}</span>
            </div>
          </div>
        </div>

        {/* Monthly P&L Chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3">Monthly P&L</h2>
          <ProfitChart data={chartData} />
          <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-primary-500 inline-block" /> Revenue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-green-500 inline-block" /> Profit</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* VAT Reports */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3">VAT reports</h2>
          {(vatReports?.length ?? 0) === 0 ? (
            <EmptyState icon={Receipt} title="No VAT reports yet" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Period</th><th>Net due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {vatReports!.map((r: any) => (
                  <tr key={r.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-xs">{r.period_start} →<br/>{r.period_end}</td>
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
          {(bituach?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No payments recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Period</th><th>Due</th><th>Paid</th></tr>
              </thead>
              <tbody>
                {bituach!.map((b: any) => (
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

        {/* Expenses by category */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3">{thisYear} Expenses</h2>
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-ink-muted">No expenses recorded.</p>
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

        {/* Invoice uploads */}
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Uploaded invoices</h2>
            <span className="text-xs text-ink-muted">Scanned by finance agent · {invoiceUploads?.length ?? 0} this view</span>
          </div>
          {(invoiceUploads?.length ?? 0) === 0 ? (
            <div className="flex items-center gap-3 text-sm text-ink-muted py-4">
              <Upload className="w-4 h-4" />
              Upload invoices using the button above, or send via Telegram with #receipt tag.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Date</th><th>Vendor</th><th>Amount</th><th>Category</th><th>Status</th></tr>
              </thead>
              <tbody>
                {invoiceUploads!.map((u: any) => (
                  <tr key={u.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-xs">{new Date(u.uploaded_at).toLocaleDateString()}</td>
                    <td className="text-ink-muted text-xs">{u.vendor_name ?? "—"}</td>
                    <td className="text-xs">{u.amount ? formatMoney(u.amount, u.currency) : "—"}</td>
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
      </div>
    </>
  );
}
