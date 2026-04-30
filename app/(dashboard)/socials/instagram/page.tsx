import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { Instagram, Image, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function InstagramPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: accounts }, { data: posts }, { data: activity }] = await Promise.all([
    eq(supabase.from("social_accounts").select("*")).eq("platform", "instagram"),
    eq(supabase.from("social_posts").select("*")).eq("platform", "instagram").order("posted_at", { ascending: false }).limit(20),
    eq(supabase.from("social_agent_activity").select("*")).eq("platform", "instagram").order("created_at", { ascending: false }).limit(20),
  ]);

  const mainAccount = accounts?.[0];
  const avgLikes = posts && posts.length > 0
    ? Math.round(posts.reduce((s: number, p: any) => s + (p.likes ?? 0), 0) / posts.length)
    : 0;
  const avgReach = posts && posts.length > 0
    ? Math.round(posts.reduce((s: number, p: any) => s + (p.reach ?? 0), 0) / posts.length)
    : 0;

  return (
    <>
      <PageHeader title="Instagram" subtitle="Reels · Carousels · DMs · HeyGen founder clone" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Followers" value={formatNumber(mainAccount?.followers ?? 0)} />
        <Kpi label="Posts tracked" value={String(posts?.length ?? 0)} />
        <Kpi label="Avg likes" value={formatNumber(avgLikes)} />
        <Kpi label="Avg reach" value={formatNumber(avgReach)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Recent posts
          </h2>
          {(posts?.length ?? 0) === 0 ? (
            <EmptyState icon={Instagram} title="No posts yet" hint="Agent posts Reels + carousels sourced from Reddit/YouTube with HeyGen founder clone for talking-head content." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Post</th><th>Type</th><th>Likes</th><th>Reach</th><th>Date</th></tr>
              </thead>
              <tbody>
                {posts!.map((p: any) => (
                  <tr key={p.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-xs font-medium text-ink max-w-[160px] truncate">{p.caption_preview ?? p.title ?? "—"}</td>
                    <td className="text-ink-muted text-xs">{p.post_type ?? "post"}</td>
                    <td className="text-xs">{formatNumber(p.likes ?? 0)}</td>
                    <td className="text-ink-muted text-xs">{formatNumber(p.reach ?? 0)}</td>
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
                <li key={a.id} className="text-xs border-l-2 border-pink-300 pl-2">
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
