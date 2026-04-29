import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { FileText } from "lucide-react";
import { LandingPageForm, HtmlEditor, StatusToggle, DeleteLandingPageButton } from "./forms";

export default async function LandingPagesPage() {
  const supabase = await createClient();

  const [{ data: brands }, { data: pages }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("landing_pages").select("*").order("created_at", { ascending: false }),
  ]);

  const brandsLite = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));

  return (
    <>
      <PageHeader
        title="Landing Pages"
        subtitle="Design pages with Claude Preview, paste the HTML here, and publish. Each page gets a unique URL."
        action={<LandingPageForm brands={brandsLite} />}
      />

      <div className="mb-4 p-4 rounded-xl border border-primary-200 bg-primary-50 text-sm text-ink-muted">
        <strong className="text-ink">How to use Claude Preview:</strong> Open Claude in another tab, ask it to design a landing page, then click "Copy HTML" in the Preview panel and paste it into the editor below.
      </div>

      {(pages?.length ?? 0) === 0 ? (
        <EmptyState icon={FileText} title="No landing pages yet" hint="Create a page, then use Claude Preview to design it and paste the HTML." />
      ) : (
        <div className="space-y-4">
          {pages!.map((page: any) => (
            <div key={page.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-ink">{page.title}</h2>
                    <StatusToggle id={page.id} status={page.status} />
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    /{page.slug} · {page.views} views · {page.conversions} conversions
                    {page.meta_description && <span> · {page.meta_description}</span>}
                  </div>
                </div>
                <DeleteLandingPageButton id={page.id} />
              </div>

              <div className="flex items-center gap-3">
                <HtmlEditor id={page.id} currentHtml={page.html_content} />
                {page.html_content && (
                  <span className="text-xs text-green-600">✓ HTML saved ({page.html_content.length.toLocaleString()} chars)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
