import { PageHeader, Kpi } from "@/components/page-header";
import { formatMoney, formatNumber } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { createBrandedClient, brandFilter } from "@/lib/supabase/branded-query";

export default async function OverviewPage() {
  const { supabase, brandId } = await createBrandedClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  const profitQuery = supabase.from("v_daily_profit").select("*").gte("date", sinceIso).order("date", { ascending: false });
  const alertsQuery = supabase.from("alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(5);
  const runsQuery = supabase.from("routine_runs").select("*").order("started_at", { ascending: false }).limit(5);

  const [{ data: profit }, { data: brands }, { data: alerts }, { data: runs }] = await Promise.all([
    brandId ? brandFilter(profitQuery, brandId) : profitQuery,
    supabase.from("brands").select("id, name, slug").eq("status", "active"),
    brandId ? brandFilter(alertsQuery, brandId) : alertsQuery,
    brandId ? brandFilter(runsQuery, brandId) : runsQuery,
  ]);

  const agg = (profit ?? []).reduce(
    (a, r: any) => ({
      revenue: a.revenue + Number(r.net_revenue ?? 0),
      spend: a.spend + Number(r.ad_spend ?? 0),
      profit: a.profit + Number(r.net_profit ?? 0),
      cogs: a.cogs + Number(r.cogs ?? 0),
    }),
    { revenue: 0, spend: 0, profit: 0, cogs: 0 }
  );

  const mer = agg.spend > 0 ? agg.revenue / agg.spend : null;

  return (
    <>
      <PageHeader title="Overview" subtitle={brandId ? "Last 30 days" : "Last 30 days across all brands"} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Net revenue" value={formatMoney(agg.revenue)} />
        <Kpi label="Ad spend" value={formatMoney(agg.spend)} />
        <Kpi label="Net profit" value={formatMoney(agg.profit)} />
        <Kpi label="MER" value={mer ? mer.toFixed(2) + "×" : "—"} hint="Revenue ÷ ad spend" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Active brands</h2>
            <span className="badge-primary">{brands?.length ?? 0}</span>
          </div>
          {(brands?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No brands yet.</p>
          ) : (
            <ul className="space-y-2">
              {brands!.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-50">
                  <span className="font-medium text-ink">{b.name}</span>
                  <span className="text-xs text-ink-muted">{b.slug}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Alerts</h2>
            <span className="badge-crit">{alerts?.length ?? 0} open</span>
          </div>
          {(alerts?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> No open alerts.
            </p>
          ) : (
            <ul className="space-y-2">
              {alerts!.map((a: any) => (
                <li key={a.id} className="px-3 py-2 rounded-xl border border-surface-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink text-sm">{a.title}</span>
                    <span className={a.severity === "crit" ? "badge-crit" : a.severity === "warn" ? "badge-warn" : "badge-primary"}>{a.severity}</span>
                  </div>
                  {a.message && <div className="text-xs text-ink-muted mt-1">{a.message}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3">Latest routine runs</h2>
          {(runs?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No routines have run yet. Configure schedules in Settings.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted">
                <tr>
                  <th className="py-2">Routine</th>
                  <th>Started</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {runs!.map((r: any) => (
                  <tr key={r.id} className="border-t border-surface-border">
                    <td className="py-2 font-medium text-ink">{r.routine_name}</td>
                    <td className="text-ink-muted">{new Date(r.started_at).toLocaleString()}</td>
                    <td>
                      <span className={r.status === "success" ? "badge-success" : r.status === "failed" ? "badge-crit" : "badge-primary"}>{r.status}</span>
                    </td>
                    <td className="text-ink-muted">{formatNumber(r.tokens_used)}</td>
                    <td className="text-ink-muted">{formatMoney(r.cost_usd, "USD")}</td>
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
