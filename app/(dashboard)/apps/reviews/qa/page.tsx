import { createBrandedClient } from "@/lib/supabase/branded-query";
import QAManager from "./qa-manager";

export default async function QAPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: questions } = await eq(
    supabase.from("review_qa").select("*")
  )
    .order("created_at", { ascending: false })
    .limit(200);

  return <QAManager brandId={brandId ?? ""} questions={questions ?? []} />;
}
