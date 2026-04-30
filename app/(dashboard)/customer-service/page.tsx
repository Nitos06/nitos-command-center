import { createBrandedClient } from "@/lib/supabase/branded-query";
import GorgiasClient from "./gorgias-client";

export default async function CustomerServicePage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: tickets },
    { data: macros },
    { data: rules },
    { data: faq },
    { data: agentLogs },
  ] = await Promise.all([
    eq(supabase.from("cs_tickets").select("*, cs_messages(*)"))
      .order("created_at", { ascending: false })
      .limit(100),
    eq(supabase.from("cs_macros").select("*"))
      .order("usage_count", { ascending: false }),
    eq(supabase.from("cs_rules").select("*"))
      .order("run_order"),
    eq(supabase.from("cs_faq").select("*"))
      .order("times_used", { ascending: false }),
    eq(supabase.from("agent_logs").select("*"))
      .eq("agent_name", "customer-service")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const allTickets = tickets ?? [];

  // Open count
  const open = allTickets.filter((t: any) => t.status === "open").length;

  // Resolved today
  const resolved_today = allTickets.filter(
    (t: any) => t.resolved_at && t.resolved_at >= today.toISOString()
  ).length;

  // Average first response time in minutes
  const ticketsWithResponse = allTickets.filter((t: any) => t.first_response_at);
  const avg_response_min =
    ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((sum: number, t: any) => {
          const ms =
            new Date(t.first_response_at).getTime() -
            new Date(t.created_at).getTime();
          return sum + ms / 60000;
        }, 0) / ticketsWithResponse.length
      : 0;

  // CSAT average (from tickets that have a csat_score field)
  const ticketsWithCsat = allTickets.filter((t: any) => t.csat_score != null);
  const csat_avg =
    ticketsWithCsat.length > 0
      ? ticketsWithCsat.reduce((sum: number, t: any) => sum + Number(t.csat_score), 0) /
        ticketsWithCsat.length
      : 0;

  return (
    <GorgiasClient
      brandId={brandId ?? ""}
      tickets={allTickets}
      macros={macros ?? []}
      rules={rules ?? []}
      faq={faq ?? []}
      agentLogs={agentLogs ?? []}
      stats={{ open, resolved_today, avg_response_min, csat_avg }}
    />
  );
}
