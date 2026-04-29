import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { MessageCircle } from "lucide-react";
import { DmTriggerForm, ActiveToggle, DeleteTriggerButton } from "./forms";

const TRIGGER_LABELS: Record<string, string> = {
  comment_keyword: "Comment keyword",
  story_reply: "Story reply",
  reel_comment: "Reel comment",
  post_mention: "Post mention",
  dm_keyword: "DM keyword",
};

export default async function AutoDmsPage() {
  const supabase = await createClient();

  const [{ data: brands }, { data: triggers }, { data: sequences }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("dm_triggers").select("*").order("created_at", { ascending: false }),
    supabase.from("email_sequences").select("id,name").order("name"),
  ]);

  const brandsLite = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));
  const seqLite = (sequences ?? []).map((s: any) => ({ id: s.id, name: s.name }));

  const active = triggers?.filter((t: any) => t.is_active).length ?? 0;
  const totalFired = triggers?.reduce((s: number, t: any) => s + (t.trigger_count ?? 0), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Auto DMs"
        subtitle="Set keyword triggers on Instagram comments, story replies, and reels. Auto-send a DM when matched."
        action={<DmTriggerForm brands={brandsLite} sequences={seqLite} />}
      />

      <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
        <strong>Meta App Review required</strong> — Auto-DMs use the Instagram Graph API (Messaging). You need a verified Business account + Meta App Review approval before triggers fire in production. Until then, you can build and test triggers here.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-ink">{triggers?.length ?? 0}</div>
          <div className="text-xs text-ink-muted mt-1">Total triggers</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-ink">{active}</div>
          <div className="text-xs text-ink-muted mt-1">Active triggers</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-ink">{totalFired.toLocaleString()}</div>
          <div className="text-xs text-ink-muted mt-1">Total DMs fired</div>
        </div>
      </div>

      {(triggers?.length ?? 0) === 0 ? (
        <EmptyState icon={MessageCircle} title="No DM triggers yet" hint="Create your first trigger — e.g. anyone commenting 'guide' on your post gets an automatic DM." />
      ) : (
        <div className="space-y-3">
          {triggers!.map((t: any) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-ink">{t.name}</span>
                    <ActiveToggle id={t.id} is_active={t.is_active} />
                    <span className="badge-primary text-xs capitalize">{t.platform}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-surface-border text-ink-muted">
                      {TRIGGER_LABELS[t.trigger_type] ?? t.trigger_type}
                    </span>
                  </div>

                  {(t.keywords?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.keywords.map((kw: string) => (
                        <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-mono">{kw}</span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-ink border-l-2 border-primary-200 pl-3 italic line-clamp-2">{t.reply_message}</p>

                  <div className="text-xs text-ink-muted mt-2 flex gap-3">
                    {t.target_post_id && <span>Post: {t.target_post_id}</span>}
                    {t.sequence_id && <span>✉ Linked to sequence</span>}
                    <span>{t.trigger_count} DMs sent</span>
                  </div>
                </div>
                <DeleteTriggerButton id={t.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
