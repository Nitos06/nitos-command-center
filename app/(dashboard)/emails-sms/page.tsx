import { createBrandedClient } from "@/lib/supabase/branded-query";
import { EmailApp } from "./email-app";

export default async function EmailsSmsPage() {
  const { supabase, brandId } = await createBrandedClient();

  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  const since90Iso  = since90.toISOString();
  const since90Date = since90.toISOString().slice(0, 10);
  const since7Date  = new Date(Date.now() - 7  * 864e5).toISOString().slice(0, 10);
  const since30Date = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: flows },
    { data: campaigns },
    { data: sends },
    { data: segments },
    { data: deliverability90 },
    { data: agentLogs },
    { data: brandSettings },
    { data: contacts },
  ] = await Promise.all([
    eq(supabase.from("email_flows").select("*")).order("created_at", { ascending: false }),
    eq(supabase.from("email_campaigns").select("*")).order("created_at", { ascending: false }).limit(100),
    eq(supabase.from("email_sends").select("opened,clicked,converted,revenue,bounced,delivered,spam,sent_at")).gte("sent_at", since90Iso),
    eq(supabase.from("segments").select("*")).order("subscriber_count", { ascending: false }),
    eq(supabase.from("email_deliverability").select("*")).gte("date", since90Date).order("date", { ascending: true }),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "email-marketing").order("created_at", { ascending: false }).limit(50),
    brandId ? supabase.from("brand_settings").select("*").eq("brand_id", brandId).maybeSingle() : Promise.resolve({ data: null }),
    eq(supabase.from("segments").select("id,name,subscriber_count,type,created_at,last_synced_at")).order("subscriber_count", { ascending: false }),
  ]);

  // Aggregate stats
  const total     = sends?.length ?? 0;
  const delivered = sends?.filter((s: any) => s.delivered).length ?? 0;
  const opens     = sends?.filter((s: any) => s.opened).length   ?? 0;
  const clicks    = sends?.filter((s: any) => s.clicked).length  ?? 0;
  const bounces   = sends?.filter((s: any) => s.bounced).length  ?? 0;
  const spam      = sends?.filter((s: any) => s.spam).length     ?? 0;
  const revenue   = sends?.reduce((s: number, r: any) => s + Number(r.revenue ?? 0), 0) ?? 0;

  const openRate    = delivered > 0 ? (opens   / delivered) * 100 : 0;
  const ctr         = delivered > 0 ? (clicks  / delivered) * 100 : 0;
  const bounceRate  = total     > 0 ? (bounces / total)     * 100 : 0;
  const spamRate    = total     > 0 ? (spam    / total)     * 100 : 0;
  const deliverRate = total     > 0 ? (delivered / total)   * 100 : 0;

  const chartData = (deliverability90 ?? []).map((d: any) => ({
    date:       new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    delivered:  d.sent > 0 ? Math.round((d.delivered ?? d.sent) / d.sent * 100) : 0,
    openRate:   d.sent > 0 ? Math.round((d.opened   / d.sent) * 100) : 0,
    clickRate:  d.sent > 0 ? Math.round((d.clicked  / d.sent) * 100) : 0,
    bounceRate: d.sent > 0 ? Math.round((d.bounced  / d.sent) * 100) : 0,
    spamRate:   d.sent > 0 ? Math.round(((d.spam ?? 0) / d.sent) * 100) : 0,
    sent:       d.sent ?? 0,
    raw: d,
  }));

  // Total stats across all time from deliverability
  const totalDelivered90 = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.delivered ?? d.sent ?? 0), 0);
  const totalOpened90    = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.opened  ?? 0), 0);
  const totalClicked90   = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.clicked ?? 0), 0);
  const totalBounced90   = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.bounced ?? 0), 0);
  const totalSent90      = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.sent    ?? 0), 0);
  const totalSpam90      = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.spam    ?? 0), 0);
  const totalUnsub90     = (deliverability90 ?? []).reduce((s: number, d: any) => s + (d.unsubscribed ?? 0), 0);

  return (
    <EmailApp
      brandId={brandId}
      flows={flows ?? []}
      campaigns={campaigns ?? []}
      segments={segments ?? []}
      contacts={contacts ?? []}
      chartData={chartData}
      agentLogs={agentLogs ?? []}
      brandSettings={brandSettings}
      stats={{
        total, delivered, opens, clicks, bounces, spam, revenue,
        openRate, ctr, bounceRate, spamRate, deliverRate,
        totalSent90, totalDelivered90, totalOpened90, totalClicked90,
        totalBounced90, totalSpam90, totalUnsub90,
      }}
    />
  );
}
