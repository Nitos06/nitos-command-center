import { createBrandedClient } from "@/lib/supabase/branded-query";
import ReviewSettingsForm from "./review-settings-form";

export default async function SettingsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: settings } = await eq(
    supabase.from("review_settings").select("*")
  ).maybeSingle();

  return <ReviewSettingsForm brandId={brandId ?? ""} settings={settings} />;
}
