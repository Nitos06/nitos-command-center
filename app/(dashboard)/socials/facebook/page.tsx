import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { Facebook, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function FacebookPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: accounts }, { data: posts }, { data: activity }] = await Promise.all([
    eq(supabase.from("social_accounts").select("*")).eq("platform", "facebook"),
    eq(supabase.from("social_posts").select("*")).eq("platform", "facebook").order("posted_at", { ascending: false }).limit(20),
    eq(supabase.from("social_agent_activity").select("*")).eq("platform", "facebook").order("created_at", { ascending: false }).limit(20),
  ]);

  const mainAccount = accounts?.[0];
  const avgReach = posts && posts.length > 0
    ? Math.round(posts.reduce((s: number, p: any) => s + (p.reach ?? p.views ?? 0), 0) / posts.length)
    : 0;

  return (
    <>
      <PageHeader title="Facebook" subtitle="Niche event posts · honest opinions · image + text" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Page likes" value={formatNumber(mainAccount?.followers ?? 0)} />
        <Kpi label="Posts tracked" value={String(posts?.length ?? 0)} />
        <Kpi label="Avg reach" value={formatNumber(avgReach)} />
        <Kpi label="Pages" value={String(accounts?.length ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Facebook className="w-4 h-4 text-blue-600" />
            Recent posts
          </h2>
          {(posts?.length ?? 0) === 0 ? (
            <EmptyState icon={Facebook} title="No posts yet" hint="Facebook agent posts niche event content, honest brand opinions, and image+text combos daily." />
          ) : (
            <ul className="space-y-2">
              {posts!.map((p: any) => (
                <li key={p.id} className="px-3 py-2 rounded-xl bg-surface-tint border border-surface-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-ink text-xs truncate flex-1">{p.caption_preview ?? p.title ?? "—"}</div>
                    <span className="text-xs text-ink-muted flex-shrink-0">{formatNumber(p.reach ?? p.views ?? 0)} reach</span>
                  </div>
                  <div className="text-[10px] text-ink-subtle mt-0.5">
                    {p.post_type ?? "post"} · {p.posted_at ? new Date(p.posted_at).toLocaleDateString() : "—"}
                    {p.likes != null && ` · ${p.likes} likes`}
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
                <li key={a.id} className="text-xs border-l-2 border-blue-300 pl-2">
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
