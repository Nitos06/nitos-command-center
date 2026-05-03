import { createBrandedClient } from "@/lib/supabase/branded-query";
import PayoutsManager from "./payouts-manager";

export default async function PayoutsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: payouts },
    { data: affiliates },
  ] = await Promise.all([
    eq(supabase.from("affiliate_payouts").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("affiliates").select("id, name, email")),
  ]);

  // Build affiliate name map
  const affiliateMap = new Map<string, string>();
  (affiliates ?? []).forEach((a: any) => {
    affiliateMap.set(a.id, a.name || a.email || "Unknown");
  });

  const enriched = (payouts ?? []).map((p: any) => ({
    ...p,
    affiliate_name: p.affiliate_name || affiliateMap.get(p.affiliate_id) || "Unknown",
  }));

  const pending = enriched.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const approved = enriched.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const paidThisMonth = enriched
    .filter((p: any) => p.status === "paid" && p.paid_at && new Date(p.paid_at) >= new Date(firstOfMonth))
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  return (
    <PayoutsManager
      brandId={brandId ?? ""}
      payouts={enriched}
      summary={{ pending, approved, paidThisMonth }}
    />
  );
}
