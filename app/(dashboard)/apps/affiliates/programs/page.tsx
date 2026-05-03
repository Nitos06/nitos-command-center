import { createBrandedClient } from "@/lib/supabase/branded-query";
import ProgramsManager from "./programs-manager";

export default async function ProgramsPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: programs },
    { data: affiliates },
  ] = await Promise.all([
    eq(supabase.from("affiliate_programs").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("affiliates").select("id, program_id, status")),
  ]);

  // Attach affiliate counts to programs
  const enriched = (programs ?? []).map((p: any) => ({
    ...p,
    affiliate_count: (affiliates ?? []).filter((a: any) => a.program_id === p.id).length,
    active_affiliate_count: (affiliates ?? []).filter((a: any) => a.program_id === p.id && a.status === "active").length,
  }));

  return (
    <ProgramsManager
      brandId={brandId ?? ""}
      programs={enriched}
    />
  );
}
