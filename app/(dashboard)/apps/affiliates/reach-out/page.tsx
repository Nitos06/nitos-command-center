import { createBrandedClient } from "@/lib/supabase/branded-query";
import ReachOutManager from "./reach-out-manager";

export default async function ReachOutPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: outreach },
    { data: affiliates },
  ] = await Promise.all([
    eq(supabase.from("affiliate_outreach").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("affiliates").select("id, status, created_at, source")),
  ]);

  const templates = (outreach ?? []).filter((o: any) => o.type === "template");
  const invites = (outreach ?? []).filter((o: any) => o.type === "invite");

  const totalInvitesSent = invites.length;
  const signedUp = (affiliates ?? []).filter((a: any) => a.source === "invite").length;
  const activeFromInvite = (affiliates ?? []).filter((a: any) => a.source === "invite" && a.status === "active").length;

  return (
    <ReachOutManager
      brandId={brandId ?? ""}
      templates={templates}
      stats={{
        totalInvitesSent,
        signedUp,
        activeFromInvite,
        signupRate: totalInvitesSent > 0 ? Math.round((signedUp / totalInvitesSent) * 100) : 0,
        activeRate: signedUp > 0 ? Math.round((activeFromInvite / signedUp) * 100) : 0,
      }}
    />
  );
}
