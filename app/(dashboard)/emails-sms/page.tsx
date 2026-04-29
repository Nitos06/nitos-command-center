import { createBrandedClient } from "@/lib/supabase/branded-query";
import { EmailTabs } from "./email-tabs";

export default async function EmailsSmsPage() {
  const { supabase, brandId } = await createBrandedClient();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Iso  = since30.toISOString();
  const since30Date = since30.toISOString().slice(0, 10);

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: flows },
    { data: campaigns },
    { data: sends },
    { data: segments },
    { data: deliverability },
    { data: agentLogs },
  ] = await Promise.all([
    eq(supabase.from("email_flows").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("email_campaigns").select("*")).order("sent_at", { ascending: false }).limit(30),
    eq(supabase.from("email_sends").select("opened, clicked, converted, revenue, bounced, delivered")).gte("sent_at", since30Iso),
    eq(supabase.from("segments").select("*")).order("subscriber_count", { ascending: false }),
    eq(supabase.from("email_deliverability").select("*")).gte("date", since30Date).order("date", { ascending: true }),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "email-marketing").order("created_at", { ascending: false }).limit(20),
  ]);

  const total   = sends?.length ?? 0;
  const opens   = sends?.filter((s: any) => s.opened).length ?? 0;
  const clicks  = sends?.filter((s: any) => s.clicked).length ?? 0;
  const bounces = sends?.filter((s: any) => s.bounced).length ?? 0;
  const revenue = sends?.reduce((s: number, r: any) => s + Number(r.revenue ?? 0), 0) ?? 0;
  const openRate   = total > 0 ? (opens  / total) * 100 : 0;
  const ctr        = total > 0 ? (clicks / total) * 100 : 0;
  const bounceRate = total > 0 ? (bounces/ total) * 100 : 0;

  const chartData = (deliverability ?? []).map((d: any) => ({
    date:       new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    openRate:   d.sent > 0 ? Math.round((d.opened  / d.sent) * 100) : 0,
    clickRate:  d.sent > 0 ? Math.round((d.clicked / d.sent) * 100) : 0,
    bounceRate: d.sent > 0 ? Math.round((d.bounced / d.sent) * 100) : 0,
    sent: d.sent ?? 0,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Email Marketing</h1>
        <p className="text-xs text-ink-muted mt-1">Amazon SES · flows · calendar · segments · deliverability</p>
      </div>

      <EmailTabs
        brandId={brandId}
        flows={flows ?? []}
        campaigns={campaigns ?? []}
        segments={segments ?? []}
        chartData={chartData}
        agentLogs={agentLogs ?? []}
        openRate={openRate}
        ctr={ctr}
        bounceRate={bounceRate}
        revenue={revenue}
        totalSent={total}
      />
    </>
  );
}
