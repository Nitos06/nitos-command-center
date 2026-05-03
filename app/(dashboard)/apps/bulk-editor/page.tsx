import { createBrandedClient } from "@/lib/supabase/branded-query";
import BulkManager from "./bulk-manager";

export default async function BulkEditorPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: jobs } = await eq(
    supabase.from("bulk_jobs").select("*")
  )
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <BulkManager
      brandId={brandId ?? ""}
      recentJobs={jobs ?? []}
    />
  );
}
