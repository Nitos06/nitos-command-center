import { createBrandedClient } from "@/lib/supabase/branded-query";
import ImportManager from "./import-manager";

export default async function ImportPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: imports } = await eq(
    supabase.from("review_imports").select("*")
  )
    .order("created_at", { ascending: false })
    .limit(50);

  return <ImportManager brandId={brandId ?? ""} imports={imports ?? []} />;
}
