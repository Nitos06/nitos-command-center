import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { Video, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function TikTokPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: accounts }, { data: posts }, { data: activity }] = await Promise.all([
    eq(supabase.from("social_accounts").select("*")).eq("platform", "tiktok"),
    eq(supabase.from("social_posts").select("*")).eq("platform", "tiktok").order("posted_at", { ascending: false }).limit(20),
    eq(supabase.from("social_agent_activity").select("*")).eq("platform", "tiktok").order("created_at", { ascending: false }).limit(20),
  ]);

  const mainAccount = accounts?.[0];
  const avgViews = posts && posts.length > 0
    ? Math.round(posts.reduce((s: number, p: any) => s + (p.views ?? p.reach ?? 0), 0) / posts.length)
    : 0;

  return (
    <>
      <PageHeader title="TikTok" subtitle="Entertaining short-form · no carousels · no owner talking head" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Followers" value={formatNumber(mainAccount?.followers ?? 0)} />
        <Kpi label="Videos posted" value={String(posts?.length ?? 0)} />
        <Kpi label="Avg views" value={formatNumber(avgViews)} />
        <Kpi label="Accounts" value={String(accounts?.length ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Recent videos
          </h2>
          {(posts?.length ?? 0) === 0 ? (
            <EmptyState icon={Video} title="No videos yet" hint="Agent posts entertaining TikToks — no carousels, no owner talking head. Entertaining-first, brand-second." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Caption</th><th>Views</th><th>Likes</th><th>Date</th></tr>
              </thead>
              <tbody>
                {posts!.map((p: any) => (
                  <tr key={p.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-xs font-medium text-ink max-w-[180px] truncate">{p.caption_preview ?? p.title ?? "—"}</td>
                    <td className="text-xs">{formatNumber(p.views ?? p.reach ?? 0)}</td>
                    <td className="text-ink-muted text-xs">{formatNumber(p.likes ?? 0)}</td>
                    <td className="text-ink-muted text-xs">{p.posted_at ? new Date(p.posted_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <li key={a.id} className="text-xs border-l-2 border-gray-400 pl-2">
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
