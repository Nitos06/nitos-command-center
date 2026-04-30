import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { Package, Plus } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function BundlesPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [
    { data: bundles },
  ] = await Promise.all([
    eq(supabase.from("bundles").select("*, bundle_items(*)")).order("created_at", { ascending: false }),
  ]);

  const activeBundles = bundles?.filter((b: any) => b.is_active).length ?? 0;
  const totalRevenue = bundles?.reduce((s: number, b: any) => s + Number(b.revenue_30d ?? 0), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Bundles"
        subtitle="Frequently Bought Together + volume discounts — replacing KaChingBundles"
        action={
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New bundle
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Active bundles" value={String(activeBundles)} />
        <Kpi label="Bundle revenue (30d)" value={formatMoney(totalRevenue)} />
        <Kpi label="Total bundles" value={String(bundles?.length ?? 0)} />
        <Kpi label="Avg discount" value={bundles && bundles.length > 0 ? `${Math.round(bundles.reduce((s: number, b: any) => s + Number(b.discount_pct ?? 0), 0) / bundles.length)}%` : "—"} />
      </div>

      {(bundles?.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="No bundles yet"
            hint="Create product bundles with discounts, volume tiers, and Frequently Bought Together suggestions powered by your Shopify order history."
          />
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm">
            <div className="font-semibold text-amber-700 mb-2">Bundle types you can create</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <div><div className="font-medium text-ink">Fixed bundle</div>Products A + B + C at X% off</div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <div><div className="font-medium text-ink">Frequently Bought Together</div>Auto-detected from order history</div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <div><div className="font-medium text-ink">Volume discount</div>Buy 2 save 10%, buy 3 save 15%</div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <div><div className="font-medium text-ink">Mystery bundle</div>Curated selection at deep discount</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles!.map((bundle: any) => (
            <div key={bundle.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-ink">{bundle.name}</div>
                  <div className="text-xs text-ink-muted">{bundle.bundle_items?.length ?? 0} products · {bundle.discount_pct ? `${bundle.discount_pct}% off` : "no discount"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <div className="font-semibold text-ink">{formatMoney(bundle.revenue_30d ?? 0)}</div>
                    <div className="text-ink-muted">{bundle.orders_30d ?? 0} orders (30d)</div>
                  </div>
                  <span className={bundle.is_active ? "badge-success" : "badge-warn"}>{bundle.is_active ? "active" : "paused"}</span>
                </div>
              </div>
              {(bundle.bundle_items?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bundle.bundle_items.map((item: any) => (
                    <span key={item.id} className="text-xs px-2 py-0.5 bg-surface-tint border border-surface-border rounded-md text-ink-muted">
                      {item.product_title ?? item.shopify_product_id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
