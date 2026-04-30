import { createBrandedClient } from "@/lib/supabase/branded-query";
import ReviewsClient from "./reviews-client";

export default async function ReviewsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: reviews },
    { data: pending },
    { data: qa },
    { data: imports },
    { data: ugcAssets },
    { data: requestSettings },
  ] = await Promise.all([
    eq(supabase.from("reviews").select("*")).order("created_at", { ascending: false }).limit(200),
    eq(supabase.from("reviews").select("id,customer_name,rating,title,created_at")).eq("status", "pending"),
    eq(supabase.from("review_qa").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("review_imports").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("ugc_assets").select("*")).order("quality_score", { ascending: false }).limit(50),
    brandId
      ? supabase.from("review_request_settings").select("*").eq("brand_id", brandId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <ReviewsClient
      brandId={brandId ?? ""}
      reviews={reviews ?? []}
      pending={pending ?? []}
      qa={qa ?? []}
      imports={imports ?? []}
      ugcAssets={ugcAssets ?? []}
      requestSettings={requestSettings}
    />
  );
}
