import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Mail } from "lucide-react";
import { SequenceForm, StepForm, SequenceToggle, DeleteSequenceButton, DeleteStepButton } from "./forms";

const SOURCE_LABELS: Record<string, string> = {
  lead_magnet: "Lead Magnet",
  landing_page: "Landing Page",
  link_in_bio: "Link in Bio",
  auto_dm: "Auto DM",
  manual: "Manual",
};

export default async function EmailFlowsPage() {
  const supabase = await createClient();

  const [{ data: brands }, { data: sequences }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("email_sequences").select("*, email_sequence_steps(*)").order("created_at", { ascending: false }),
  ]);

  const brandsLite = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));
  const seqLite = (sequences ?? []).map((s: any) => ({ id: s.id, name: s.name, brand_id: s.brand_id }));

  return (
    <>
      <PageHeader
        title="Email Flows"
        subtitle="Mailjet-powered drip sequences triggered from lead magnets, landing pages, DMs, and bio pages."
        action={
          <div className="flex items-center gap-2">
            <StepForm sequences={seqLite} brands={brandsLite} />
            <SequenceForm brands={brandsLite} />
          </div>
        }
      />

      {(sequences?.length ?? 0) === 0 ? (
        <EmptyState icon={Mail} title="No email sequences yet" hint="Create a sequence and add email steps. Connect it to lead magnets or DM triggers to auto-enroll contacts." />
      ) : (
        <div className="space-y-4">
          {sequences!.map((seq: any) => {
            const steps = (seq.email_sequence_steps ?? []).sort((a: any, b: any) => a.position - b.position);
            return (
              <div key={seq.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-ink">{seq.name}</h2>
                      <SequenceToggle id={seq.id} is_active={seq.is_active} />
                      {seq.trigger_source && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-surface-border text-ink-muted">
                          From: {SOURCE_LABELS[seq.trigger_source] ?? seq.trigger_source}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5 flex gap-3">
                      <span>{steps.length} emails</span>
                      <span>{seq.enrolled_count} enrolled</span>
                      {seq.mailjet_list_id && <span>List ID: {seq.mailjet_list_id}</span>}
                    </div>
                  </div>
                  <DeleteSequenceButton id={seq.id} />
                </div>

                {steps.length === 0 ? (
                  <p className="text-sm text-ink-muted">No email steps yet. Use "Add email step" above to add the first email in this sequence.</p>
                ) : (
                  <div className="space-y-2">
                    {steps.map((step: any, idx: number) => (
                      <div key={step.id} className="flex items-start gap-3 px-3 py-3 rounded-xl bg-primary-50">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                            {step.position}
                          </div>
                          {idx < steps.length - 1 && <div className="w-px h-4 bg-primary-200 mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink text-sm">{step.subject}</span>
                            {step.delay_days > 0 && (
                              <span className="text-xs text-ink-muted">+{step.delay_days}d</span>
                            )}
                            {idx === 0 && <span className="text-xs text-primary-600 font-medium">Immediate</span>}
                          </div>
                          {step.preview_text && <p className="text-xs text-ink-muted mt-0.5">{step.preview_text}</p>}
                          <div className="text-xs text-ink-muted mt-1 flex gap-3">
                            <span>{step.sent_count} sent</span>
                            <span>{step.open_count} opens</span>
                            <span>{step.click_count} clicks</span>
                            {step.mailjet_template_id && <span>TPL: {step.mailjet_template_id}</span>}
                          </div>
                        </div>
                        <DeleteStepButton id={step.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
