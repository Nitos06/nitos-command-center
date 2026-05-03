import { createBrandedClient } from "@/lib/supabase/branded-query";
import AffiliatesDashboard from "./affiliates-dashboard";

export default async function AffiliatesDashboardPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: affiliates },
    { data: clicks },
    { data: conversions },
    { data: programs },
    { data: payouts },
    { data: recentConversions },
  ] = await Promise.all([
    eq(supabase.from("affiliates").select("*")),
    eq(supabase.from("affiliate_clicks").select("*")).gte("clicked_at", thirtyDaysAgo),
    eq(supabase.from("affiliate_conversions").select("*")).gte("converted_at", thirtyDaysAgo),
    eq(supabase.from("affiliate_programs").select("*")),
    eq(supabase.from("affiliate_payouts").select("*")).eq("status", "pending"),
    eq(supabase.from("affiliate_conversions").select("*")).order("converted_at", { ascending: false }).limit(10),
  ]);

  const totalAffiliates = affiliates?.length ?? 0;
  const activeAffiliates = affiliates?.filter((a: any) => a.status === "active").length ?? 0;
  const totalClicks = clicks?.length ?? 0;
  const totalConversions = conversions?.length ?? 0;
  const totalRevenue = conversions?.reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0) ?? 0;
  const commissionOwed = payouts?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0;

  return (
    <AffiliatesDashboard
      brandId={brandId ?? ""}
      kpis={{
        totalAffiliates,
        activeAffiliates,
        totalClicks,
        totalConversions,
        totalRevenue,
        commissionOwed,
      }}
      recentConversions={recentConversions ?? []}
      programCount={programs?.length ?? 0}
    />
  );
}
