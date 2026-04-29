import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Gift } from "lucide-react";
import { LeadMagnetForm, PublishToggle, DeleteLeadMagnetButton } from "./forms";

export default async function LeadMagnetsPage() {
  const supabase = await createClient();

  const [{ data: brands }, { data: magnets }, { data: sequences }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("lead_magnets").select("*").order("created_at", { ascending: false }),
    supabase.from("email_sequences").select("id,name").order("name"),
  ]);

  const brandsLite = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));
  const seqLite = (sequences ?? []).map((s: any) => ({ id: s.id, name: s.name }));

  return (
    <>
      <PageHeader
        title="Lead Magnets"
        subtitle="Gate resources behind email capture forms. Connect to email sequences for automatic follow-up."
        action={<LeadMagnetForm brands={brandsLite} sequences={seqLite} />}
      />

      {(magnets?.length ?? 0) === 0 ? (
        <EmptyState icon={Gift} title="No lead magnets yet" hint="Create a gated PDF, checklist, or video — visitors provide their email to unlock it." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {magnets!.map((m: any) => (
            <div key={m.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-ink">{m.title}</h2>
                  <PublishToggle id={m.id} is_published={m.is_published} />
                </div>
                <DeleteLeadMagnetButton id={m.id} />
              </div>

              {m.description && <p className="text-sm text-ink-muted">{m.description}</p>}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-primary-50 px-3 py-2">
                  <div className="text-lg font-semibold text-ink">{m.views}</div>
                  <div className="text-xs text-ink-muted">Views</div>
                </div>
                <div className="rounded-xl bg-primary-50 px-3 py-2">
                  <div className="text-lg font-semibold text-ink">{m.signups}</div>
                  <div className="text-xs text-ink-muted">Sign-ups</div>
                </div>
                <div className="rounded-xl bg-primary-50 px-3 py-2">
                  <div className="text-lg font-semibold text-ink">
                    {m.views > 0 ? `${Math.round((m.signups / m.views) * 100)}%` : "—"}
                  </div>
                  <div className="text-xs text-ink-muted">Conv. rate</div>
                </div>
              </div>

              <div className="text-xs text-ink-muted space-y-0.5">
                {m.file_url && <div>📎 <span className="truncate">{m.file_url}</span></div>}
                {m.thank_you_url && <div>↪ Thank-you: {m.thank_you_url}</div>}
                {m.sequence_id && <div>✉ Linked to email sequence</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
