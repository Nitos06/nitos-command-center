import { PageHeader } from "@/components/page-header";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import BundlesClient from "./bundles-client";

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

  return (
    <>
      <PageHeader
        title="Bundles"
        subtitle="Frequently Bought Together + volume discounts — replacing KaChingBundles"
      />
      <BundlesClient brandId={brandId ?? ""} bundles={bundles ?? []} quantityBreaks={[]} />
    </>
  );
}
