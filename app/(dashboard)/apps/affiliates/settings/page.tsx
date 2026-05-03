import { createBrandedClient } from "@/lib/supabase/branded-query";
import AffiliateSettings from "./affiliate-settings";

export default async function SettingsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  // Try to load existing settings; fall back to defaults
  const { data: settings } = await eq(
    supabase.from("affiliate_programs").select("*")
  ).eq("is_default", true).limit(1).single();

  const defaults = {
    default_commission_rate: settings?.commission_value ?? 10,
    commission_type: settings?.commission_type ?? "percentage",
    cookie_duration: settings?.cookie_duration ?? 30,
    auto_approve: settings?.auto_approve ?? false,
    min_payout_threshold: settings?.min_payout_threshold ?? 50,
    payment_method: settings?.payment_method ?? "paypal",
    paypal_email: settings?.paypal_email ?? "",
    bank_info: settings?.bank_info ?? "",
    signup_page_url: settings?.signup_page_url ?? "",
    signup_page_heading: settings?.signup_page_heading ?? "Join Our Affiliate Program",
    signup_page_description: settings?.signup_page_description ?? "",
  };

  return (
    <AffiliateSettings
      brandId={brandId ?? ""}
      settings={defaults}
    />
  );
}
