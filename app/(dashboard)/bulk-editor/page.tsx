import { PageHeader } from "@/components/page-header";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import BulkClient from "./bulk-client";

export default async function BulkEditorPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: jobs } = await eq(
    supabase.from("bulk_jobs").select("*")
  ).order("created_at", { ascending: false }).limit(50);

  return (
    <>
      <PageHeader
        title="Bulk Editor"
        subtitle="Import & export any Shopify entity — Matrixify replacement"
      />
      <BulkClient
        brandId={brandId ?? ""}
        jobs={jobs ?? []}
      />
    </>
  );
}
