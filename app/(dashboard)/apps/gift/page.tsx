import { createBrandedClient } from "@/lib/supabase/branded-query";
import GiftManager from "./gift-manager";

export default async function GiftPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: giftRules } = await eq(
    supabase.from("gift_rules").select("*")
  )
    .order("created_at", { ascending: false });

  return (
    <GiftManager
      brandId={brandId ?? ""}
      giftRules={giftRules ?? []}
    />
  );
}
