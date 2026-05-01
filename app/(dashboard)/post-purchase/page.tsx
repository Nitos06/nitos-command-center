import { PageHeader } from "@/components/page-header";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import PPClient from "./pp-client";

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
    eq(supabase.from("pp_conversions").select("*")).gte("created_at", since30.toISOString()),
  ]);

  return (
    <>
      <PageHeader
        title="Post-Purchase Upsells"
        subtitle="Multi-step funnels on the Shopify Thank You page — one-click accept"
      />
      <PPClient brandId={brandId ?? ""} funnels={funnels ?? []} conversions={conversions ?? []} />
    </>
  );
}
