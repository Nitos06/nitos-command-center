import { PageHeader, Kpi } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { Instagram, Youtube, Facebook } from "lucide-react";
import Link from "next/link";
import { createBrandedClient } from "@/lib/supabase/branded-query";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", href: "/socials/instagram", color: "bg-gradient-to-br from-purple-500 to-pink-500", icon: Instagram },
  { key: "tiktok", label: "TikTok", href: "/socials/tiktok", color: "bg-gradient-to-br from-black to-gray-800", icon: null },
  { key: "youtube", label: "YouTube", href: "/socials/youtube", color: "bg-gradient-to-br from-red-600 to-red-700", icon: Youtube },
  { key: "pinterest", label: "Pinterest", href: "/socials/pinterest", color: "bg-gradient-to-br from-red-500 to-rose-600", icon: null },
  { key: "facebook", label: "Facebook", href: "/socials/facebook", color: "bg-gradient-to-br from-blue-600 to-blue-700", icon: Facebook },
];

export default async function SocialsPage() {
  const { supabase, brandId } = await createBrandedClient();

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: accounts }, { data: calendar }, { data: agentActivity }] = await Promise.all([
    eq(supabase.from("social_accounts").select("*")).order("followers", { ascending: false }),
    eq(supabase.from("content_calendar").select("*")).order("planned_for", { ascending: true }).gte("planned_for", new Date().toISOString()).limit(15),
    eq(supabase.from("social_agent_activity").select("*")).order("created_at", { ascending: false }).limit(20),
  ]);

  const totalFollowers = accounts?.reduce((s: number, a: any) => s + (a.followers ?? 0), 0) ?? 0;
  const scheduledCount = calendar?.filter((c: any) => c.status === "scheduled").length ?? 0;

  const byPlatform = (accounts ?? []).reduce((acc: Record<string, any[]>, a: any) => {
    acc[a.platform] = [...(acc[a.platform] ?? []), a];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      <PageHeader title="Social Media" subtitle="Instagram · TikTok · YouTube · Pinterest · Facebook" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total accounts" value={String(accounts?.length ?? 0)} />
        <Kpi label="Total followers" value={formatNumber(totalFollowers)} />
        <Kpi label="Scheduled posts" value={String(scheduledCount)} />
        <Kpi label="Agent actions (today)" value={String(agentActivity?.filter((a: any) => new Date(a.created_at).toDateString() === new Date().toDateString()).length ?? 0)} />
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {PLATFORMS.map((p) => {
          const accs = byPlatform[p.key] ?? [];
          const followers = accs.reduce((s: number, a: any) => s + (a.followers ?? 0), 0);
          const Icon = p.icon;
          return (
            <Link key={p.key} href={p.href} className="card hover:shadow-card-hover transition-all group">
              <div className={`w-8 h-8 rounded-xl ${p.color} flex items-center justify-center mb-2`}>
                {Icon ? <Icon className="w-4 h-4 text-white" /> : (
                  <span className="text-white text-xs font-bold">{p.label[0]}</span>
                )}
              </div>
              <div className="font-semibold text-ink text-sm group-hover:text-primary-600 transition-colors">{p.label}</div>
              <div className="text-xs text-ink-muted mt-0.5">
                {accs.length === 0 ? "Not connected" : `${formatNumber(followers)} followers`}
              </div>
              {accs.length > 0 && (
                <div className="text-[10px] text-ink-subtle mt-1">{accs.length} account{accs.length > 1 ? "s" : ""}</div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Unified content calendar */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3">Upcoming content</h2>
          {(calendar?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">Nothing scheduled. Agent fills the calendar automatically.</p>
          ) : (
            <ul className="space-y-2">
              {calendar!.map((c: any) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-tint border border-surface-border">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.platform === "instagram" ? "bg-pink-500" : c.platform === "tiktok" ? "bg-black" : c.platform === "youtube" ? "bg-red-500" : c.platform === "pinterest" ? "bg-red-400" : "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink truncate">{c.title}</div>
                    <div className="text-[10px] text-ink-muted capitalize">{c.platform} · {c.planned_for ? new Date(c.planned_for).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
                  </div>
                  <span className={`badge-${c.status === "posted" ? "success" : c.status === "scheduled" ? "primary" : "warn"} text-[10px]`}>{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agent activity */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-3">Agent activity</h2>
          {(agentActivity?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No activity yet.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {agentActivity!.map((a: any) => (
                <li key={a.id} className="text-xs border-l-2 border-primary-200 pl-2">
                  <div className="text-ink-muted capitalize">
                    {a.platform} · {new Date(a.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-ink leading-snug mt-0.5">{a.action}{a.details?.title ? ` — ${a.details.title}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
