import { createBrandedClient } from "@/lib/supabase/branded-query";
import { TaxesClient } from "./taxes-client";

const IL_BRACKETS = [
  { label: "10%", min: 0,      max: 84120,   rate: 0.10 },
  { label: "14%", min: 84120,  max: 120720,  rate: 0.14 },
  { label: "20%", min: 120720, max: 193800,  rate: 0.20 },
  { label: "31%", min: 193800, max: 269280,  rate: 0.31 },
  { label: "35%", min: 269280, max: 560280,  rate: 0.35 },
  { label: "47%", min: 560280, max: 721560,  rate: 0.47 },
  { label: "50%", min: 721560, max: Infinity, rate: 0.50 },
];

function computeIncomeTax(annualNet: number) {
  let tax = 0;
  for (const b of IL_BRACKETS) {
    if (annualNet <= b.min) break;
    tax += (Math.min(annualNet, b.max) - b.min) * b.rate;
  }
  return Math.round(tax);
}

function currentBracket(annualNet: number) {
  for (let i = IL_BRACKETS.length - 1; i >= 0; i--) {
    if (annualNet > IL_BRACKETS[i].min) return IL_BRACKETS[i];
  }
  return IL_BRACKETS[0];
}

// Bituach Leumi self-employed rate (simplified annual)
function computeBituachLeumi(annualNet: number) {
  const blFloor = 75888;
  const blRate = 0.172;
  return annualNet > blFloor ? Math.round((annualNet - blFloor) * blRate) : 0;
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
    { data: depositHistory },
  ] = await Promise.all([
    eq(supabase.from("tax_entities").select("*")).limit(1).maybeSingle(),
    eq(supabase.from("invoices_issued").select("subtotal, vat_amount, issued_at")).gte("issued_at", yearStart),
    eq(supabase.from("expenses").select("total, vat_amount, category, incurred_at")).gte("incurred_at", yearStart),
    eq(supabase.from("vat_reports").select("*")).order("period_start", { ascending: false }).limit(6),
    eq(supabase.from("bituach_leumi_payments").select("*")).order("period_start", { ascending: false }).limit(6),
    eq(supabase.from("tax_bracket_snapshots").select("*")).order("year", { ascending: false }).order("month", { ascending: false }).limit(1).maybeSingle(),
    eq(supabase.from("invoice_uploads").select("*")).order("uploaded_at", { ascending: false }).limit(20),
    eq(supabase.from("v_monthly_profit").select("*")).order("month", { ascending: false }).limit(12),
    eq(supabase.from("v_daily_ad_spend").select("total_ad_spend, date")).gte("date", yearStart),
    // deposit_history view or fallback to bituach_leumi_payments + tax_bracket_snapshots
    eq(supabase.from("tax_bracket_snapshots").select("year, month, monthly_deposit_required, mas_hachnasot_deposit, bituach_leumi_deposit, paid_at")).order("year", { ascending: false }).order("month", { ascending: false }).limit(24),
  ]);

  const yearRevenue = invoices?.reduce((s: number, i: any) => s + Number(i.subtotal ?? 0), 0) ?? 0;
  const salesVat = invoices?.reduce((s: number, i: any) => s + Number(i.vat_amount ?? 0), 0) ?? 0;
  const inputVat = expenses?.reduce((s: number, e: any) => s + Number(e.vat_amount ?? 0), 0) ?? 0;
  const totalExpenses = expenses?.reduce((s: number, e: any) => s + Number(e.total ?? 0), 0) ?? 0;
  const totalAdSpend = adSpend?.reduce((s: number, r: any) => s + Number(r.total_ad_spend ?? 0), 0) ?? 0;
  const netVatDue = salesVat - inputVat;

  const monthsElapsed = new Date().getMonth() + 1;
  const ytdNetProfit = yearRevenue - totalExpenses - totalAdSpend;
  const projectedAnnual = monthsElapsed > 0 ? (ytdNetProfit / monthsElapsed) * 12 : 0;
  const bracket = currentBracket(projectedAnnual);

  const estimatedAnnualTax = computeIncomeTax(projectedAnnual);
  const estimatedAnnualBL = computeBituachLeumi(projectedAnnual);

  // Monthly deposits — split into two
  const masHanchasotMonthly = bracketSnap?.mas_hachnasot_deposit
    ?? Math.round(estimatedAnnualTax / 12);
  const bituachLeumiMonthly = bracketSnap?.bituach_leumi_deposit
    ?? Math.round(estimatedAnnualBL / 12);

  // Monthly P&L for chart
  const chartData = (monthlyProfit ?? []).slice().reverse().map((r: any) => ({
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

  // Deposit history — map bracketSnap history to display format
  const depositHistoryMapped = (depositHistory ?? []).map((snap: any) => ({
    month: snap.year && snap.month ? `${snap.year}-${String(snap.month).padStart(2, "0")}` : "—",
    mas_hachnasot: snap.mas_hachnasot_deposit ?? snap.monthly_deposit_required ?? 0,
    bituach_leumi: snap.bituach_leumi_deposit ?? 0,
    paid: !!snap.paid_at,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Taxes (Israel)</h1>
        <p className="text-xs text-ink-muted mt-1">VAT · Mas Hachnasot · Bituach Leumi · invoices · expenses · entity</p>
      </div>

      <TaxesClient
        brandId={brandId}
        yearRevenue={yearRevenue}
        ytdNetProfit={ytdNetProfit}
        netVatDue={netVatDue}
        masHanchasotMonthly={masHanchasotMonthly}
        bituachLeumiMonthly={bituachLeumiMonthly}
        estimatedAnnualTax={estimatedAnnualTax}
        projectedAnnual={projectedAnnual}
        bracket={bracket}
        IL_BRACKETS={IL_BRACKETS}
        thisYear={thisYear}
        vatReports={vatReports ?? []}
        bituach={bituach ?? []}
        invoiceUploads={invoiceUploads ?? []}
        chartData={chartData}
        byCategory={byCategory}
        totalExpenses={totalExpenses}
        entity={entity}
        depositHistory={depositHistoryMapped}
        fees={null}
      />
    </>
  );
}
