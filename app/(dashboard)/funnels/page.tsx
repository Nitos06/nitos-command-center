import { createClient } from "@/lib/supabase/server";
import { PageHeader, Kpi } from "@/components/page-header";
import { Filter, TrendingUp, Users, MessageCircle, Mail } from "lucide-react";

export default async function FunnelsPage() {
  const supabase = await createClient();

  const [
    { count: contactCount },
    { count: dmCount },
    { count: pageCount },
    { count: sequenceCount },
    { data: recentContacts },
    { data: topPages },
  ] = await Promise.all([
    supabase.from("funnel_contacts").select("*", { count: "exact", head: true }),
    supabase.from("dm_triggers").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("link_in_bio_pages").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("email_sequences").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("funnel_contacts").select("email,first_name,source,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("link_in_bio_pages").select("title,slug,views").order("views", { ascending: false }).limit(5),
  ]);

  const sourceLabel: Record<string, string> = {
    link_in_bio: "Link in Bio",
    lead_magnet: "Lead Magnet",
    landing_page: "Landing Page",
    auto_dm: "Auto DM",
    manual: "Manual",
  };

  return (
    <>
      <PageHeader
        title="Funnels"
        subtitle="Lead capture, auto-DMs, link in bio, email automations — all in one place"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total contacts" value={String(contactCount ?? 0)} />
        <Kpi label="Active DM triggers" value={String(dmCount ?? 0)} />
        <Kpi label="Published bio pages" value={String(pageCount ?? 0)} />
        <Kpi label="Active email sequences" value={String(sequenceCount ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600" /> Recent contacts
          </h2>
          {(recentContacts?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No contacts yet. Set up a lead magnet or link in bio to start capturing.</p>
          ) : (
            <ul className="space-y-2">
              {recentContacts!.map((c: any) => (
                <li key={c.email} className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-50">
                  <div>
                    <div className="font-medium text-ink text-sm">{c.first_name ? `${c.first_name} — ` : ""}{c.email}</div>
                    <div className="text-xs text-ink-muted">{sourceLabel[c.source] ?? c.source} · {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="badge-primary text-xs">{sourceLabel[c.source] ?? c.source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Top bio pages by views
          </h2>
          {(topPages?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No published bio pages yet.</p>
          ) : (
            <ul className="space-y-2">
              {topPages!.map((p: any) => (
                <li key={p.slug} className="flex items-center justify-between px-3 py-2 rounded-xl border border-surface-border">
                  <div>
                    <div className="font-medium text-ink text-sm">{p.title}</div>
                    <div className="text-xs text-ink-muted">/{p.slug}</div>
                  </div>
                  <span className="text-sm font-medium text-ink">{p.views.toLocaleString()} views</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-600" /> Quick-start guide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "🔗", title: "Link in Bio", desc: "Create your brand's bio page with links, forms, and content blocks.", href: "/funnels/link-in-bio" },
              { icon: "🎁", title: "Lead Magnets", desc: "Gate a PDF, checklist, or video behind an email capture form.", href: "/funnels/lead-magnets" },
              { icon: "💬", title: "Auto DMs", desc: "Auto-reply to Instagram comments and story replies with a direct message.", href: "/funnels/auto-dms" },
            ].map((item) => (
              <a key={item.href} href={item.href} className="block p-4 rounded-xl border border-surface-border hover:border-primary-300 hover:bg-primary-50 transition">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-medium text-ink text-sm mb-1">{item.title}</div>
                <div className="text-xs text-ink-muted">{item.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
