import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney, formatPct } from "@/lib/utils";
import { Mail, Zap, Users, TrendingUp } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import { DeliverabilityChart } from "./deliverability-chart";

export default async function EmailsSmsPage() {
  const { supabase, brandId } = await createBrandedClient();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Iso = since30.toISOString();
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
    eq(supabase.from("email_flows").select("*")).eq("is_active", true),
    eq(supabase.from("email_campaigns").select("*")).order("sent_at", { ascending: false }).limit(10),
    eq(supabase.from("email_sends").select("opened, clicked, converted, revenue, bounced, delivered")).gte("sent_at", since30Iso),
    eq(supabase.from("segments").select("*")).order("subscriber_count", { ascending: false }).limit(10),
    eq(supabase.from("email_deliverability").select("*")).gte("date", since30Date).order("date", { ascending: true }),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "email-marketing").order("created_at", { ascending: false }).limit(15),
  ]);

  const total = sends?.length ?? 0;
  const opens = sends?.filter((s: any) => s.opened).length ?? 0;
  const clicks = sends?.filter((s: any) => s.clicked).length ?? 0;
  const bounces = sends?.filter((s: any) => s.bounced).length ?? 0;
  const revenue = sends?.reduce((s: number, r: any) => s + Number(r.revenue ?? 0), 0) ?? 0;
  const openRate = total > 0 ? (opens / total) * 100 : 0;
  const ctr = total > 0 ? (clicks / total) * 100 : 0;
  const bounceRate = total > 0 ? (bounces / total) * 100 : 0;

  const chartData = (deliverability ?? []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    openRate: d.sent > 0 ? Math.round((d.opened / d.sent) * 100) : 0,
    clickRate: d.sent > 0 ? Math.round((d.clicked / d.sent) * 100) : 0,
    bounceRate: d.sent > 0 ? Math.round((d.bounced / d.sent) * 100) : 0,
    sent: d.sent ?? 0,
  }));

  const deliveryHealthColor =
    openRate >= 45 ? "text-green-600" : openRate >= 30 ? "text-amber-500" : "text-red-500";

  return (
    <>
      <PageHeader title="Email Marketing" subtitle="Amazon SES · flows, campaigns, deliverability, segments" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Active flows" value={String(flows?.length ?? 0)} />
        <Kpi label="Open rate (30d)" value={formatPct(openRate)} hint="Target >45%" />
        <Kpi label="Click rate (30d)" value={formatPct(ctr)} hint="Target >1%" />
        <Kpi label="Attributed revenue" value={formatMoney(revenue)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Deliverability chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Deliverability — last 30 days</h2>
            <span className={`text-sm font-semibold ${deliveryHealthColor}`}>
              {openRate >= 45 ? "Healthy" : openRate >= 30 ? "Monitor" : "At risk"}
            </span>
          </div>
          <DeliverabilityChart data={chartData} />
          <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-primary-500 inline-block" /> Open rate</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-green-500 inline-block" /> Click rate</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-red-400 inline-block" /> Bounce rate</span>
          </div>
        </div>

        {/* Health metrics */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Health metrics
          </h2>
          <div className="space-y-3">
            {[
              { label: "Open rate", value: openRate, target: 45, unit: "%", good: openRate >= 45 },
              { label: "Click rate", value: ctr, target: 1, unit: "%", good: ctr >= 1 },
              { label: "Bounce rate", value: bounceRate, target: 1, unit: "%", good: bounceRate < 1, invert: true },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-muted">{m.label}</span>
                  <span className={`font-semibold ${m.good ? "text-green-600" : "text-red-500"}`}>
                    {m.value.toFixed(1)}{m.unit}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-tint rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${m.good ? "bg-green-500" : "bg-red-400"}`}
                    style={{ width: `${Math.min(100, m.invert ? Math.max(0, 100 - m.value * 50) : (m.value / (m.target * 2)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Agent activity */}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <div className="text-xs font-semibold text-ink mb-2">Agent activity</div>
            {(agentLogs?.length ?? 0) === 0 ? (
              <p className="text-xs text-ink-muted">No activity yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {agentLogs!.map((log: any) => (
                  <li key={log.id} className="text-xs border-l-2 border-primary-200 pl-2">
                    <span className="text-ink-muted">
                      {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                    </span>
                    <span className="text-ink leading-snug">{log.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Active flows */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Email flows
          </h2>
          {(flows?.length ?? 0) === 0 ? (
            <EmptyState icon={Zap} title="No flows set up" hint="Run the email-marketing agent with the brand-onboarding event to set up all 4 flows." />
          ) : (
            <ul className="space-y-2">
              {flows!.map((f: any) => (
                <li key={f.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-tint border border-surface-border">
                  <div>
                    <div className="text-sm font-medium text-ink">{f.name}</div>
                    <div className="text-xs text-ink-muted">{f.trigger_event} · {f.email_count ?? "?"} emails</div>
                  </div>
                  <span className={f.is_active ? "badge-success" : "badge-warn"}>
                    {f.is_active ? "active" : "paused"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Segments */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-500" />
            Segments
          </h2>
          {(segments?.length ?? 0) === 0 ? (
            <EmptyState icon={Users} title="No segments yet" hint="Segments refresh nightly from Shopify purchase behaviour." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Segment</th><th>Subscribers</th><th>Type</th></tr>
              </thead>
              <tbody>
                {segments!.map((seg: any) => (
                  <tr key={seg.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-ink text-xs font-medium">{seg.name}</td>
                    <td className="text-ink-muted text-xs">{(seg.subscriber_count ?? 0).toLocaleString()}</td>
                    <td><span className="badge-primary text-[10px]">{seg.type ?? "static"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="card">
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Recent campaigns
        </h2>
        {(campaigns?.length ?? 0) === 0 ? (
          <EmptyState icon={Mail} title="No campaigns yet" hint="Set up Amazon SES in Settings → Email to start sending campaigns." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted text-xs">
              <tr><th className="py-2">Campaign</th><th>Segment</th><th>Sent</th><th>Open</th><th>Click</th><th>Status</th></tr>
            </thead>
            <tbody>
              {campaigns!.map((c: any) => (
                <tr key={c.id} className="border-t border-surface-border">
                  <td className="py-1.5 font-medium text-ink text-xs">{c.name}</td>
                  <td className="text-ink-muted text-xs">{c.segment ?? "—"}</td>
                  <td className="text-ink-muted text-xs">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "—"}</td>
                  <td className="text-xs">{c.open_rate != null ? `${Math.round(c.open_rate * 100)}%` : "—"}</td>
                  <td className="text-xs">{c.click_rate != null ? `${Math.round(c.click_rate * 100)}%` : "—"}</td>
                  <td><span className={c.status === "sent" ? "badge-success" : c.status === "draft" ? "badge-primary" : "badge-warn"}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
