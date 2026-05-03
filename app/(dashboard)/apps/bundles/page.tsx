import { createBrandedClient } from "@/lib/supabase/branded-query";
import VolumeEditor from "./volume-editor";

export default async function BundlesVolumePage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: config } = await eq(
    supabase
      .from("bundle_volume_config")
      .select("*")
  )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <VolumeEditor
      brandId={brandId ?? ""}
      initialConfig={config}
    />
  );
}
