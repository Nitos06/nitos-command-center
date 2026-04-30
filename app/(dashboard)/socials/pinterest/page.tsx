import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { ImageIcon, Bot } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function PinterestPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: accounts }, { data: posts }, { data: activity }] = await Promise.all([
    eq(supabase.from("social_accounts").select("*")).eq("platform", "pinterest"),
    eq(supabase.from("social_posts").select("*")).eq("platform", "pinterest").order("posted_at", { ascending: false }).limit(20),
    eq(supabase.from("social_agent_activity").select("*")).eq("platform", "pinterest").order("created_at", { ascending: false }).limit(20),
  ]);

  const mainAccount = accounts?.[0];
  const totalImpressions = posts?.reduce((s: number, p: any) => s + (p.views ?? p.reach ?? 0), 0) ?? 0;

  return (
    <>
      <PageHeader title="Pinterest" subtitle="10–15 product pins/day · variant generation · bulk schedule" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Monthly views" value={formatNumber(mainAccount?.monthly_views ?? 0)} />
        <Kpi label="Pins posted" value={String(posts?.length ?? 0)} />
        <Kpi label="Total impressions" value={formatNumber(totalImpressions)} />
        <Kpi label="Boards" value={String(mainAccount?.board_count ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-red-500" />
            Recent pins
          </h2>
          {(posts?.length ?? 0) === 0 ? (
            <EmptyState icon={ImageIcon} title="No pins yet" hint="Agent bulk-posts 10–15 product images daily with variant generation — different angles, backgrounds, lifestyle shots." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted text-xs">
                <tr><th className="py-1.5">Pin</th><th>Impressions</th><th>Saves</th><th>Date</th></tr>
              </thead>
              <tbody>
                {posts!.map((p: any) => (
                  <tr key={p.id} className="border-t border-surface-border">
                    <td className="py-1.5 text-xs font-medium text-ink max-w-[160px] truncate">{p.caption_preview ?? p.title ?? "—"}</td>
                    <td className="text-xs">{formatNumber(p.views ?? p.reach ?? 0)}</td>
                    <td className="text-ink-muted text-xs">{formatNumber(p.saves ?? p.likes ?? 0)}</td>
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
