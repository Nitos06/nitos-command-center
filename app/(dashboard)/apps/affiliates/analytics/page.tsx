import { createBrandedClient } from "@/lib/supabase/branded-query";
import AnalyticsDashboard from "./analytics-dashboard";

export default async function AnalyticsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: clicks },
    { data: conversions },
    { data: affiliates },
  ] = await Promise.all([
    eq(supabase.from("affiliate_clicks").select("id, affiliate_id, clicked_at")).gte("clicked_at", thirtyDaysAgo),
    eq(supabase.from("affiliate_conversions").select("id, affiliate_id, revenue, commission, converted_at, status")).gte("converted_at", thirtyDaysAgo),
    eq(supabase.from("affiliates").select("id, name, email, status")),
  ]);

  // Build daily chart data
  const dailyMap = new Map<string, { clicks: number; conversions: number; revenue: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { clicks: 0, conversions: 0, revenue: 0 });
  }

  (clicks ?? []).forEach((c: any) => {
    const key = new Date(c.clicked_at).toISOString().split("T")[0];
    const entry = dailyMap.get(key);
    if (entry) entry.clicks++;
  });

  (conversions ?? []).filter((c: any) => c.status === "approved").forEach((c: any) => {
    const key = new Date(c.converted_at).toISOString().split("T")[0];
    const entry = dailyMap.get(key);
    if (entry) {
      entry.conversions++;
      entry.revenue += Number(c.revenue) || 0;
    }
  });

  const chartData = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...data,
    rate: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 10000) / 100 : 0,
  }));

  // Revenue per affiliate (top 10)
  const affiliateRevMap = new Map<string, { name: string; revenue: number; commission: number; conversions: number }>();
  const affiliateNameMap = new Map<string, string>();
  (affiliates ?? []).forEach((a: any) => affiliateNameMap.set(a.id, a.name || a.email || "Unknown"));

  (conversions ?? []).filter((c: any) => c.status === "approved").forEach((c: any) => {
    const existing = affiliateRevMap.get(c.affiliate_id) || {
      name: affiliateNameMap.get(c.affiliate_id) || "Unknown",
      revenue: 0,
      commission: 0,
      conversions: 0,
    };
    existing.revenue += Number(c.revenue) || 0;
    existing.commission += Number(c.commission) || 0;
    existing.conversions++;
    affiliateRevMap.set(c.affiliate_id, existing);
  });

  const topAffiliates = Array.from(affiliateRevMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const totalRevenue = (conversions ?? []).filter((c: any) => c.status === "approved").reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0);
  const totalCommission = (conversions ?? []).filter((c: any) => c.status === "approved").reduce((s: number, c: any) => s + (Number(c.commission) || 0), 0);

  return (
    <AnalyticsDashboard
      brandId={brandId ?? ""}
      chartData={chartData}
      topAffiliates={topAffiliates}
      totalClicks={clicks?.length ?? 0}
      totalConversions={(conversions ?? []).filter((c: any) => c.status === "approved").length}
      totalRevenue={totalRevenue}
      totalCommission={totalCommission}
    />
  );
}
