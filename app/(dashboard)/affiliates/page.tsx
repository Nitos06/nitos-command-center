import { PageHeader } from "@/components/page-header";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import AffiliatesClient from "./affiliates-client";

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
    { data: programs },
    { data: payouts },
  ] = await Promise.all([
    eq(supabase.from("affiliates").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("affiliate_clicks").select("affiliate_id, clicked_at")).gte("clicked_at", since30Iso),
    eq(supabase.from("affiliate_conversions").select("*")).gte("converted_at", since30Iso),
    eq(supabase.from("affiliate_programs").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("affiliate_payouts").select("*")).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Affiliate Marketing"
        subtitle="Full affiliate program management — UpPromote replacement"
      />
      <AffiliatesClient
        brandId={brandId ?? ""}
        affiliates={affiliates ?? []}
        clicks={clicks ?? []}
        conversions={conversions ?? []}
        programs={programs ?? []}
        payouts={payouts ?? []}
      />
    </>
  );
}
