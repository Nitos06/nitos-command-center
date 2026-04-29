import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Link2 } from "lucide-react";
import { BioPageForm, BioItemForm, PublishToggle, DeletePageButton, DeleteItemButton } from "./forms";

export default async function LinkInBioPage() {
  const supabase = await createClient();

  const [{ data: brands }, { data: pages }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("link_in_bio_pages").select("*, link_in_bio_items(*)").order("created_at", { ascending: false }),
  ]);

  const brandsLite = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));
  const pagesLite = (pages ?? []).map((p: any) => ({ id: p.id, title: p.title, brand_id: p.brand_id }));

  return (
    <>
      <PageHeader
        title="Link in Bio"
        subtitle="Create Linktree-style pages for your brands. Each page has a public URL."
        action={<BioPageForm brands={brandsLite} />}
      />

      {(pages?.length ?? 0) === 0 ? (
        <EmptyState icon={Link2} title="No bio pages yet" hint="Create your first link-in-bio page and add blocks like links, forms, and text." />
      ) : (
        <div className="space-y-4">
          {pages!.map((page: any) => (
            <div key={page.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-ink">{page.title}</h2>
                    <PublishToggle id={page.id} is_published={page.is_published} />
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    /{page.slug} · {page.views} views
                    {page.bio && <span> · {page.bio}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BioItemForm pages={pagesLite.filter(p => p.id === page.id)} brands={brandsLite} />
                  <DeletePageButton id={page.id} />
                </div>
              </div>

              {(page.link_in_bio_items?.length ?? 0) === 0 ? (
                <p className="text-sm text-ink-muted">No blocks yet. Click "Add block" to add links, forms, or content.</p>
              ) : (
                <ul className="space-y-2">
                  {page.link_in_bio_items
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((item: any) => (
                      <li key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-ink-muted w-4">{item.position}</span>
                          <span className="badge-primary text-xs capitalize">{item.type}</span>
                          <span className="font-medium text-ink text-sm">{item.label}</span>
                          {item.url && <span className="text-xs text-ink-muted truncate max-w-[200px]">{item.url}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-ink-muted">{item.clicks} clicks</span>
                          <DeleteItemButton id={item.id} />
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
