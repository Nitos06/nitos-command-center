import { createBrandedClient } from "@/lib/supabase/branded-query";
import CreativeCenterView from "./creative-center-view";

export default async function CreativeCenterPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: assets } = await eq(
    supabase.from("ugc_assets").select("*")
  )
    .order("created_at", { ascending: false })
    .limit(200);

  return <CreativeCenterView brandId={brandId ?? ""} assets={assets ?? []} />;
}
