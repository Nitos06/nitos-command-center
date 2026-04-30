import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney, formatPct } from "@/lib/utils";
import { Zap, ArrowRight, TrendingUp } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import Link from "next/link";

export default async function PostPurchasePage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [
    { data: funnels },
    { data: conversions },
  ] = await Promise.all([
    eq(supabase.from("pp_funnels").select("*, pp_steps(*)")).order("created_at", { ascending: false }),
    eq(supabase.from("pp_conversions").select("*")).gte("converted_at", since30.toISOString()),
  ]);

  const totalRevenue = conversions?.reduce((s: number, c: any) => s + Number(c.upsell_revenue ?? 0), 0) ?? 0;
  const totalShown = conversions?.length ?? 0;
  const accepted = conversions?.filter((c: any) => c.accepted).length ?? 0;
  const convRate = totalShown > 0 ? (accepted / totalShown) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Post-Purchase Upsells"
        subtitle="Multi-step funnels on the Shopify Thank You page — one-click accept"
        action={
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            New funnel
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Active funnels" value={String(funnels?.filter((f: any) => f.is_active).length ?? 0)} />
        <Kpi label="Upsell revenue (30d)" value={formatMoney(totalRevenue)} />
        <Kpi label="Accept rate (30d)" value={formatPct(convRate)} hint="Offers accepted / shown" />
        <Kpi label="Offers shown (30d)" value={String(totalShown)} />
      </div>

      {(funnels?.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={Zap}
            title="No post-purchase funnels yet"
            hint="Create a funnel to show targeted upsells on the order confirmation page. AI picks the best offer based on what was purchased."
          />
          <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100 text-sm">
            <div className="font-semibold text-primary-700 mb-1">How it works</div>
            <ol className="space-y-1 text-ink-muted text-xs list-decimal list-inside">
              <li>Customer completes checkout</li>
              <li>Shopify thank-you page shows your upsell (via Checkout Extension)</li>
              <li>Customer accepts with one click — charge added to existing order</li>
              <li>Conversions tracked here automatically</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {funnels!.map((funnel: any) => {
            const funnelConversions = conversions?.filter((c: any) => c.funnel_id === funnel.id) ?? [];
            const funnelRevenue = funnelConversions.reduce((s: number, c: any) => s + Number(c.upsell_revenue ?? 0), 0);
            const funnelAccepted = funnelConversions.filter((c: any) => c.accepted).length;
            const funnelRate = funnelConversions.length > 0 ? (funnelAccepted / funnelConversions.length) * 100 : 0;

            return (
              <div key={funnel.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-ink">{funnel.name}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{funnel.pp_steps?.length ?? 0} steps · {funnel.trigger_product ?? "all orders"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-ink">{formatMoney(funnelRevenue)}</div>
                      <div className="text-xs text-ink-muted">{funnelRate.toFixed(1)}% accept</div>
                    </div>
                    <span className={funnel.is_active ? "badge-success" : "badge-warn"}>{funnel.is_active ? "active" : "paused"}</span>
                  </div>
                </div>

                {/* Step pipeline visualization */}
                {(funnel.pp_steps?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {funnel.pp_steps.map((step: any, i: number) => (
                      <div key={step.id} className="flex items-center gap-1">
                        <div className="px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-xs">
                          <div className="font-medium text-ink">{step.step_type === "upsell" ? "↑" : "↓"} {step.product_title ?? `Step ${i + 1}`}</div>
                          {step.discount_pct && <div className="text-ink-muted">{step.discount_pct}% off</div>}
                        </div>
                        {i < funnel.pp_steps.length - 1 && <ArrowRight className="w-3 h-3 text-ink-subtle" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
