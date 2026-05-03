import { createBrandedClient } from "@/lib/supabase/branded-query";
import QuizSettings from "./quiz-settings";

export default async function SettingsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const { data: quizzes } = await eq(
    supabase.from("quizzes").select("id,name,meta")
  ).order("created_at", { ascending: false });

  return (
    <QuizSettings
      brandId={brandId ?? ""}
      quizzes={quizzes ?? []}
    />
  );
}
