import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { Youtube, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function YoutubePage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: accounts }, { data: posts }, { data: activity }] = await Promise.all([
    eq(supabase.from("social_accounts").select("*")).eq("platform", "youtube"),
    eq(supabase.from("social_posts").select("*")).eq("platform", "youtube").order("posted_at", { ascending: false }).limit(15),
    eq(supabase.from("social_agent_activity").select("*")).eq("platform", "youtube").order("created_at", { ascending: false }).limit(20),
  ]);

  const mainAccount = accounts?.[0];
  const avgViews = posts && posts.length > 0
    ? Math.round(posts.reduce((s: number, p: any) => s + (p.views ?? p.reach ?? 0), 0) / posts.length)
    : 0;

  return (
    <>
      <PageHeader title="YouTube" subtitle="Long-form · Shorts via Submagic · HeyGen founder videos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Subscribers" value={formatNumber(mainAccount?.followers ?? 0)} />
        <Kpi label="Videos" value={String(posts?.length ?? 0)} />
        <Kpi label="Avg views" value={formatNumber(avgViews)} />
        <Kpi label="Channels" value={String(accounts?.length ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            Recent videos
          </h2>
          {(posts?.length ?? 0) === 0 ? (
            <EmptyState icon={Youtube} title="No videos yet" hint="Agent publishes HeyGen founder clone videos + Submagic-edited Shorts." />
          ) : (
            <ul className="space-y-2">
              {posts!.map((p: any) => (
                <li key={p.id} className="px-3 py-2 rounded-xl bg-surface-tint border border-surface-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-ink text-xs truncate flex-1">{p.caption_preview ?? p.title ?? "—"}</div>
                    <span className="text-xs text-ink-muted flex-shrink-0">{formatNumber(p.views ?? p.reach ?? 0)} views</span>
                  </div>
                  <div className="text-[10px] text-ink-subtle mt-0.5">
                    {p.post_type ?? "video"} · {p.posted_at ? new Date(p.posted_at).toLocaleDateString() : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            Agent activity
          </h2>
          {(activity?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No activity yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {activity!.map((a: any) => (
                <li key={a.id} className="text-xs border-l-2 border-red-300 pl-2">
                  <div className="text-ink-muted">{new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="text-ink leading-snug mt-0.5">{a.action}{a.details?.title ? ` — "${a.details.title}"` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
