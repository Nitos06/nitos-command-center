import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { HeadphonesIcon, MessageSquare, BookOpen, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import { TicketsChart } from "./tickets-chart";

export default async function CustomerServicePage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  // Last 14 days for chart
  const since14 = new Date();
  since14.setDate(since14.getDate() - 13);
  const since14Iso = since14.toISOString();

  const [
    { data: open, count: openCount },
    { data: resolved, count: resolvedCount },
    { data: all },
    { data: faq },
    { data: recentLogs },
    { data: last14 },
  ] = await Promise.all([
    eq(supabase.from("cs_tickets").select("*", { count: "exact" })).in("status", ["open", "waiting_customer", "waiting_internal"]).order("created_at", { ascending: false }).limit(10),
    eq(supabase.from("cs_tickets").select("*", { count: "exact" })).eq("status", "resolved").limit(1),
    eq(supabase.from("cs_tickets").select("created_at, first_response_at, resolved_at, status")).limit(100),
    eq(supabase.from("cs_faq").select("*")).order("times_used", { ascending: false }).limit(20),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "customer-service").order("created_at", { ascending: false }).limit(20),
    eq(supabase.from("cs_tickets").select("created_at, resolved_at, status")).gte("created_at", since14Iso),
  ]);

  const avgFirstResponseMin = (() => {
    const withResponse = all?.filter((t: any) => t.first_response_at) ?? [];
    if (!withResponse.length) return null;
    const mins = withResponse.map((t: any) => (new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60000);
    return mins.reduce((s: number, v: number) => s + v, 0) / mins.length;
  })();

  // Build 14-day chart data
  const dayMap: Record<string, { opened: number; resolved: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap[key] = { opened: 0, resolved: 0 };
  }
  for (const t of last14 ?? []) {
    const key = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dayMap[key]) dayMap[key].opened++;
    if (t.resolved_at) {
      const rkey = new Date(t.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap[rkey]) dayMap[rkey].resolved++;
    }
  }
  const chartData = Object.entries(dayMap).map(([day, v]) => ({ day, ...v }));

  return (
    <>
      <PageHeader title="Customer Service" subtitle="Tickets, DMs, email — agent handles everything" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Open tickets" value={String(openCount ?? 0)} />
        <Kpi label="Resolved" value={String(resolvedCount ?? 0)} />
        <Kpi label="Avg first response" value={avgFirstResponseMin ? `${Math.round(avgFirstResponseMin)} min` : "—"} />
        <Kpi label="Total handled" value={String((openCount ?? 0) + (resolvedCount ?? 0))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Tickets trend chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3">Tickets — last 14 days</h2>
          <TicketsChart data={chartData} />
        </div>

        {/* Agent activity log */}
        <div className="card overflow-y-auto max-h-[280px]">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            Agent activity
          </h2>
          {(recentLogs?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No activity yet. Agent logs appear here as it runs.</p>
          ) : (
            <ul className="space-y-2">
              {recentLogs!.map((log: any) => (
                <li key={log.id} className="text-xs border-l-2 border-primary-200 pl-2">
                  <div className="text-ink-muted">
                    {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    <span className={log.type === "error" ? "text-red-500" : log.type === "action" ? "text-green-600" : "text-ink-muted"}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-ink leading-snug mt-0.5">{log.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Open tickets table */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Open tickets
          </h2>
          {(open?.length ?? 0) === 0 ? (
            <EmptyState icon={HeadphonesIcon} title="No open tickets" hint="Connect Gmail/IG from Settings to pull tickets automatically." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Customer</th><th>Channel</th><th>Priority</th><th>Opened</th></tr>
              </thead>
              <tbody>
                {open!.map((t: any) => (
                  <tr key={t.id} className="border-t border-surface-border">
                    <td className="py-1.5">
                      <div className="font-medium text-ink text-xs">{t.customer_name || t.customer_email || "—"}</div>
                      <div className="text-ink-subtle text-[11px] truncate max-w-[140px]">{t.subject ?? "(no subject)"}</div>
                    </td>
                    <td className="text-ink-muted text-xs">{t.channel}</td>
                    <td><span className={t.priority === "urgent" ? "badge-crit" : t.priority === "high" ? "badge-warn" : "badge-primary"}>{t.priority}</span></td>
                    <td className="text-ink-muted text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FAQ management */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              FAQ library
            </h2>
            <span className="text-xs text-ink-muted">{faq?.length ?? 0} entries</span>
          </div>
          {(faq?.length ?? 0) === 0 ? (
            <EmptyState icon={BookOpen} title="No FAQ entries yet" hint="Add brand-specific Q&A so the agent handles them with confidence." />
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {faq!.map((f: any) => (
                <li key={f.id} className="px-3 py-2 rounded-xl bg-surface-tint border border-surface-border">
                  <div className="font-medium text-ink text-xs leading-snug">{f.question}</div>
                  <div className="text-ink-muted text-xs mt-1 line-clamp-2">{f.answer}</div>
                  <div className="text-ink-subtle text-[10px] mt-1">Used {f.times_used ?? 0}×</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
