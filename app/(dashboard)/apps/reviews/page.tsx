import { createBrandedClient } from "@/lib/supabase/branded-query";
import ReviewsDashboard from "./reviews-dashboard";

export default async function ReviewsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: reviews },
    { data: pending },
  ] = await Promise.all([
    eq(supabase.from("reviews").select("*")).order("created_at", { ascending: false }).limit(200),
    eq(supabase.from("reviews").select("id,customer_name,rating,title,created_at")).eq("status", "pending"),
  ]);

  return (
    <ReviewsDashboard
      brandId={brandId ?? ""}
      reviews={reviews ?? []}
      pending={pending ?? []}
    />
  );
}
