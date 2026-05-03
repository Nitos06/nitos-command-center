import { createBrandedClient } from "@/lib/supabase/branded-query";
import RequestSettingsForm from "./request-settings-form";

export default async function RequestSettingsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: settings } = await eq(
    supabase.from("review_request_settings").select("*")
  ).maybeSingle();

  return <RequestSettingsForm brandId={brandId ?? ""} settings={settings} />;
}
