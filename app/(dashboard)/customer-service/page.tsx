import { HeadphonesIcon, MessageSquare, BookOpen, Bot, Globe } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import { TicketsChart } from "./tickets-chart";
import { ChatbotPanel } from "./chatbot-panel";

const TABS_META = [
  { id: "tickets",  label: "Tickets",      icon: MessageSquare  },
  { id: "faq",      label: "FAQ Library",  icon: BookOpen       },
  { id: "chatbot",  label: "Website Bot",  icon: Globe          },
  { id: "activity", label: "Agent Log",    icon: Bot            },
] as const;

export default async function CustomerServicePage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const since14 = new Date();
  since14.setDate(since14.getDate() - 13);
  const since14Iso = since14.toISOString();

  const [
    { data: open,     count: openCount     },
    { data: resolved, count: resolvedCount },
    { data: all },
    { data: faq },
    { data: recentLogs },
    { data: last14 },
    { data: chatbotTickets },
  ] = await Promise.all([
    eq(supabase.from("cs_tickets").select("*", { count: "exact" })).in("status", ["open", "waiting_customer", "waiting_internal"]).not("channel", "eq", "chatbot").order("created_at", { ascending: false }).limit(20),
    eq(supabase.from("cs_tickets").select("*", { count: "exact" })).eq("status", "resolved").limit(1),
    eq(supabase.from("cs_tickets").select("created_at, first_response_at, resolved_at, status")).limit(200),
    eq(supabase.from("cs_faq").select("*")).order("times_used", { ascending: false }).limit(30),
    eq(supabase.from("agent_logs").select("*")).eq("agent_name", "customer-service").order("created_at", { ascending: false }).limit(30),
    eq(supabase.from("cs_tickets").select("created_at, resolved_at, status")).gte("created_at", since14Iso),
    eq(supabase.from("cs_tickets").select("*")).eq("channel", "chatbot").order("created_at", { ascending: false }).limit(20),
  ]);

  const avgFirstResponseMin = (() => {
    const withResponse = all?.filter((t: any) => t.first_response_at) ?? [];
    if (!withResponse.length) return null;
    const mins = withResponse.map((t: any) =>
      (new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60000
    );
    return mins.reduce((s: number, v: number) => s + v, 0) / mins.length;
  })();

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://nitaiecompro-nine.vercel.app";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Customer Service</h1>
        <p className="text-xs text-ink-muted mt-1">Tickets · FAQ · AI website chatbot · agent activity</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open tickets",       value: String(openCount ?? 0)     },
          { label: "Resolved",           value: String(resolvedCount ?? 0) },
          { label: "Avg first response", value: avgFirstResponseMin ? `${Math.round(avgFirstResponseMin)} min` : "—" },
          { label: "Bot conversations",  value: String(chatbotTickets?.length ?? 0) },
        ].map(k => (
          <div key={k.label} className="card py-3 px-4">
            <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">{k.label}</div>
            <div className="text-xl font-bold text-ink">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar — client-side navigation via anchor/hash pattern kept server-safe with CSS */}
      <CSTabNav
        brandId={brandId}
        open={open ?? []}
        faq={faq ?? []}
        recentLogs={recentLogs ?? []}
        chartData={chartData}
        chatbotTickets={chatbotTickets ?? []}
        appUrl={appUrl}
      />
    </>
  );
}

// ── Client tab wrapper (avoids making the entire page "use client") ──
import { CSTabNav } from "./cs-tab-nav";
