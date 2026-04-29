import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Users } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  link_in_bio: "Bio page",
  lead_magnet: "Lead magnet",
  landing_page: "Landing page",
  auto_dm: "Auto DM",
  manual: "Manual",
};

const SOURCE_COLORS: Record<string, string> = {
  link_in_bio: "bg-blue-100 text-blue-700",
  lead_magnet: "bg-purple-100 text-purple-700",
  landing_page: "bg-orange-100 text-orange-700",
  auto_dm: "bg-pink-100 text-pink-700",
  manual: "bg-gray-100 text-gray-600",
};

export default async function ContactsPage() {
  const supabase = await createClient();

  const [{ data: contacts, count }, { data: brands }] = await Promise.all([
    supabase
      .from("funnel_contacts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("brands").select("id,name"),
  ]);

  const brandMap = Object.fromEntries((brands ?? []).map((b: any) => [b.id, b.name]));

  const bySource = (contacts ?? []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});

  const subscribed = (contacts ?? []).filter((c: any) => c.subscribed).length;

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="All leads captured across link in bio, lead magnets, landing pages, and auto-DMs."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-ink">{count ?? 0}</div>
          <div className="text-xs text-ink-muted mt-1">Total contacts</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-ink">{subscribed}</div>
          <div className="text-xs text-ink-muted mt-1">Subscribed</div>
        </div>
        {Object.entries(bySource).slice(0, 2).map(([source, num]) => (
          <div key={source} className="card text-center">
            <div className="text-2xl font-bold text-ink">{num}</div>
            <div className="text-xs text-ink-muted mt-1">From {SOURCE_LABELS[source] ?? source}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">All contacts</h2>
          <span className="text-xs text-ink-muted">Showing up to 100 · Total {count ?? 0}</span>
        </div>

        {(contacts?.length ?? 0) === 0 ? (
          <EmptyState icon={Users} title="No contacts yet" hint="Set up a lead magnet, link in bio, or landing page with a capture form to start building your list." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted border-b border-surface-border">
                <tr>
                  <th className="pb-2 pr-4">Contact</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Brand</th>
                  <th className="pb-2 pr-4">Tags</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Added</th>
                </tr>
              </thead>
              <tbody>
                {contacts!.map((c: any) => (
                  <tr key={c.id} className="border-t border-surface-border hover:bg-primary-50 transition">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-ink">
                        {c.first_name || c.last_name
                          ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                          : "—"}
                      </div>
                      <div className="text-xs text-ink-muted">{c.email}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[c.source] ?? "bg-gray-100 text-gray-600"}`}>
                        {SOURCE_LABELS[c.source] ?? c.source}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-ink-muted text-xs">
                      {brandMap[c.brand_id] ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).map((tag: string) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-surface border border-surface-border text-ink-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.subscribed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {c.subscribed ? "Subscribed" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-ink-muted whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
