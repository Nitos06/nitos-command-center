import { createBrandedClient } from "@/lib/supabase/branded-query";
import MotivationHub from "./motivation-hub";

export default async function MotivationPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: motivation },
    { data: affiliates },
    { data: conversions },
  ] = await Promise.all([
    eq(supabase.from("affiliate_motivation").select("*")),
    eq(supabase.from("affiliates").select("*")).eq("status", "active"),
    eq(supabase.from("affiliate_conversions").select("affiliate_id, revenue, commission, status")),
  ]);

  // Build leaderboard from real data
  const affiliateMap = new Map<string, any>();
  (affiliates ?? []).forEach((a: any) => {
    affiliateMap.set(a.id, {
      id: a.id,
      name: a.name || a.email || "Unknown",
      email: a.email,
      revenue: 0,
      conversions: 0,
      commission: 0,
      points: 0,
    });
  });

  (conversions ?? []).filter((c: any) => c.status === "approved").forEach((c: any) => {
    const aff = affiliateMap.get(c.affiliate_id);
    if (aff) {
      aff.revenue += Number(c.revenue) || 0;
      aff.conversions += 1;
      aff.commission += Number(c.commission) || 0;
      aff.points += Math.floor((Number(c.revenue) || 0) * 10);
    }
  });

  const leaderboard = Array.from(affiliateMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  return (
    <MotivationHub
      brandId={brandId ?? ""}
      leaderboard={leaderboard}
      motivation={motivation ?? []}
      totalAffiliates={affiliates?.length ?? 0}
    />
  );
}
