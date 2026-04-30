import GiftClient from "./gift-client";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function GiftPage() {
  const { supabase, brandId } = await createBrandedClient();

  const { data: giftRules } = await supabase
    .from("gift_rules")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  return <GiftClient brandId={brandId ?? ""} giftRules={giftRules ?? []} />;
}
