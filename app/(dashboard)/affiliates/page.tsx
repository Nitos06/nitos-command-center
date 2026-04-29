import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney, formatPct } from "@/lib/utils";
import { Users, Plus, TrendingUp } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function AffiliatesPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Iso = since30.toISOString();

  const [
    { data: affiliates },
    { data: clicks },
    { data: conversions },
  ] = await Promise.all([
    eq(supabase.from("affiliates").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("affiliate_clicks").select("affiliate_id")).gte("clicked_at", since30Iso),
    eq(supabase.from("affiliate_conversions").select("affiliate_id, commission_amount, order_value")).gte("converted_at", since30Iso),
  ]);

  const totalClicks = clicks?.length ?? 0;
  const totalConversions = conversions?.length ?? 0;
  const totalRevenue = conversions?.reduce((s: number, c: any) => s + Number(c.order_value ?? 0), 0) ?? 0;
  const totalCommissions = conversions?.reduce((s: number, c: any) => s + Number(c.commission_amount ?? 0), 0) ?? 0;
  const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // Clicks/conversions per affiliate
  const clicksByAffiliate = (clicks ?? []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.affiliate_id] = (acc[c.affiliate_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const convsByAffiliate = (conversions ?? []).reduce((acc: Record<string, { count: number; revenue: number; commission: number }>, c: any) => {
    acc[c.affiliate_id] = {
      count: (acc[c.affiliate_id]?.count ?? 0) + 1,
      revenue: (acc[c.affiliate_id]?.revenue ?? 0) + Number(c.order_value ?? 0),
      commission: (acc[c.affiliate_id]?.commission ?? 0) + Number(c.commission_amount ?? 0),
    };
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Affiliate Marketing"
        subtitle="Track clicks, conversions, and commissions — replacing UpPromote"
        action={
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Invite affiliate
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Active affiliates" value={String(affiliates?.filter((a: any) => a.status === "active").length ?? 0)} />
        <Kpi label="Clicks (30d)" value={String(totalClicks)} />
        <Kpi label="Conversions (30d)" value={String(totalConversions)} hint={formatPct(convRate) + " conv rate"} />
        <Kpi label="Commissions owed" value={formatMoney(totalCommissions)} />
      </div>

      {(affiliates?.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No affiliates yet"
            hint="Invite affiliates with unique discount codes. Clicks and orders track automatically via Shopify webhooks. Pay commissions by percentage or fixed amount."
          />
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 text-sm">
            <div className="font-semibold text-green-700 mb-1">Getting started</div>
            <ol className="space-y-1 text-ink-muted text-xs list-decimal list-inside">
              <li>Invite affiliate (they get a unique code e.g. SARAH15)</li>
              <li>Customer uses code at checkout</li>
              <li>Shopify order webhook fires → conversion tracked here</li>
              <li>Monthly commission payout report generated</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Affiliate performance (30d)
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted text-xs">
              <tr><th className="py-1.5">Affiliate</th><th>Code</th><th>Clicks</th><th>Orders</th><th>Revenue</th><th>Commission</th><th>Status</th></tr>
            </thead>
            <tbody>
              {affiliates!.map((aff: any) => {
                const affClicks = clicksByAffiliate[aff.id] ?? 0;
                const affConvs = convsByAffiliate[aff.id];
                return (
                  <tr key={aff.id} className="border-t border-surface-border">
                    <td className="py-1.5">
                      <div className="font-medium text-ink text-xs">{aff.name}</div>
                      <div className="text-ink-muted text-[10px]">{aff.email}</div>
                    </td>
                    <td><code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded font-mono">{aff.discount_code}</code></td>
                    <td className="text-xs">{affClicks}</td>
                    <td className="text-xs">{affConvs?.count ?? 0}</td>
                    <td className="text-xs">{affConvs ? formatMoney(affConvs.revenue) : "—"}</td>
                    <td className="text-xs font-semibold">{affConvs ? formatMoney(affConvs.commission) : "—"}</td>
                    <td><span className={aff.status === "active" ? "badge-success" : "badge-warn"}>{aff.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
