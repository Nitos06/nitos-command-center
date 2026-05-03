import { createClient } from "@/lib/supabase/server";
import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { Settings as SettingsIcon } from "lucide-react";
import {
  BrandForm,
  SubscriptionForm,
  ConnectionForm,
  NicheForm,
  BenchmarkForm,
  TaxEntityForm,
  BrandSettingsForm,
  DeleteButton,
} from "./forms";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [
    { data: brands },
    { data: subs },
    { data: connections },
    { data: benchmarks },
    { data: niches },
    { data: taxEntity },
    { data: brandSettingsList },
  ] = await Promise.all([
    supabase.from("brands").select("*").order("created_at", { ascending: true }),
    supabase.from("subscriptions").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("connections").select("*"),
    supabase.from("benchmarks").select("*").limit(50),
    supabase.from("niches").select("*"),
    supabase.from("tax_entities").select("*").limit(1).maybeSingle(),
    supabase.from("brand_settings").select("*"),
  ]);

  const totalMonthlyUsd = subs?.reduce((s: number, r: any) => s + Number(r.monthly_cost_usd ?? 0), 0) ?? 0;
  const totalMonthlyIls = subs?.reduce((s: number, r: any) => s + Number(r.monthly_cost_ils ?? 0), 0) ?? 0;
  const brandsLite = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));

  return (
    <>
      <PageHeader title="Settings" subtitle="Brands, subscriptions, MCP connections, niches, benchmarks, tax entity" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Brands" value={String(brands?.length ?? 0)} />
        <Kpi label="Active subscriptions" value={String(subs?.length ?? 0)} />
        <Kpi label="Monthly cost (USD)" value={formatMoney(totalMonthlyUsd, "USD")} />
        <Kpi label="Monthly cost (ILS)" value={formatMoney(totalMonthlyIls)} />
      </div>

      {/* PER-BRAND SETTINGS */}
      {(brands?.length ?? 0) > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Per-brand settings</h2>
            <span className="text-xs text-ink-muted">SES · Meta · Shopify · Gemini</span>
          </div>
          <div className="space-y-3">
            {brands!.map((brand: any) => {
              const bs = brandSettingsList?.find((s: any) => s.brand_id === brand.id);
              return (
                <div key={brand.id} className="px-4 py-3 rounded-xl bg-surface-tint border border-surface-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-ink text-sm">{brand.name}</div>
                    <BrandSettingsForm brandId={brand.id} current={bs} />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-ink-muted">SES from:</span> <span className="text-ink">{bs?.ses_sender_email ?? <span className="text-red-400">not set</span>}</span></div>
                    <div><span className="text-ink-muted">Shopify:</span>{" "}
                      {bs?.shopify_domain
                        ? <span className="text-ink">{bs.shopify_domain}</span>
                        : <a href={`/connect/shopify?brandId=${brand.id}`} className="text-primary-600 underline">Connect store</a>
                      }
                    </div>
                    <div><span className="text-ink-muted">Meta account:</span> <span className="text-ink">{bs?.meta_account_id ?? "—"}</span></div>
                    <div><span className="text-ink-muted">Brand bible:</span> <span className="text-ink">{bs?.brand_bible ? "✓ configured" : "—"}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BRANDS */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Brands</h2>
            <BrandForm />
          </div>
          {(brands?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No brands.</p>
          ) : (
            <ul className="space-y-2">
              {brands!.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-50">
                  <div>
                    <div className="font-medium text-ink">{b.name}</div>
                    <div className="text-xs text-ink-muted">{b.domain ?? "no domain"} · {b.country} · {b.base_currency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={b.status === "active" ? "badge-success" : "badge-warn"}>{b.status}</span>
                    <DeleteButton table="brands" id={b.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CONNECTIONS */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Connections (MCPs & APIs)</h2>
            <ConnectionForm brands={brandsLite} />
          </div>
          {(connections?.length ?? 0) === 0 ? (
            <EmptyState icon={SettingsIcon} title="No connections" hint="Add Meta Ads, Shopify, Klaviyo etc. to pull data automatically." />
          ) : (
            <ul className="space-y-2">
              {connections!.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-surface-border">
                  <div>
                    <div className="font-medium text-ink text-sm">{c.platform}</div>
                    <div className="text-xs text-ink-muted">{c.account_ref ?? "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={c.status === "connected" ? "badge-success" : c.status === "error" ? "badge-crit" : "badge-warn"}>{c.status}</span>
                    <DeleteButton table="connections" id={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SUBSCRIPTIONS */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Subscriptions (manually entered)</h2>
            <SubscriptionForm />
          </div>
          {(subs?.length ?? 0) === 0 ? (
            <EmptyState icon={SettingsIcon} title="No subscriptions tracked" hint="Add the apps you pay for (Klaviyo, Canva, ElevenLabs, etc.) so we can subtract them from profit." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted">
                <tr><th className="py-2">App</th><th>Category</th><th>USD/mo</th><th>ILS/mo</th><th>Billed</th><th></th></tr>
              </thead>
              <tbody>
                {subs!.map((s: any) => (
                  <tr key={s.id} className="border-t border-surface-border">
                    <td className="py-2 font-medium text-ink">{s.app_name}</td>
                    <td className="text-ink-muted">{s.category ?? "—"}</td>
                    <td className="text-ink-muted">{formatMoney(s.monthly_cost_usd, "USD")}</td>
                    <td className="text-ink-muted">{formatMoney(s.monthly_cost_ils)}</td>
                    <td className="text-ink-muted">day {s.billing_day ?? "—"}</td>
                    <td><DeleteButton table="subscriptions" id={s.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* TAX ENTITY */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Tax entity (Israel)</h2>
            <TaxEntityForm brands={brandsLite} current={taxEntity} />
          </div>
          {!taxEntity ? (
            <p className="text-sm text-ink-muted">Not configured. Set it so the Taxes page can calculate VAT correctly.</p>
          ) : (
            <div className="text-sm grid grid-cols-2 lg:grid-cols-3 gap-2">
              <div><span className="text-ink-muted">Type:</span> <span className="font-medium text-ink">{taxEntity.entity_type}</span></div>
              <div><span className="text-ink-muted">Legal name:</span> <span className="font-medium text-ink">{taxEntity.legal_name ?? "—"}</span></div>
              <div><span className="text-ink-muted">VAT #:</span> <span className="font-medium text-ink">{taxEntity.vat_number ?? "—"}</span></div>
              <div><span className="text-ink-muted">Company ID:</span> <span className="font-medium text-ink">{taxEntity.company_id ?? "—"}</span></div>
              <div><span className="text-ink-muted">VAT frequency:</span> <span className="font-medium text-ink">{taxEntity.vat_frequency}</span></div>
              <div><span className="text-ink-muted">Bituach Leumi #:</span> <span className="font-medium text-ink">{taxEntity.bituach_leumi_file_no ?? "—"}</span></div>
            </div>
          )}
        </div>

        {/* NICHES */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Niches</h2>
            <NicheForm brands={brandsLite} />
          </div>
          {(niches?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No niches defined.</p>
          ) : (
            <ul className="space-y-2">
              {niches!.map((n: any) => (
                <li key={n.id} className="flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-accent-warm">
                  <div>
                    <div className="font-medium text-ink text-sm">{n.name}</div>
                    <div className="text-xs text-ink-muted">{n.description ?? ""}</div>
                  </div>
                  <DeleteButton table="niches" id={n.id} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* BENCHMARKS */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Benchmarks</h2>
            <BenchmarkForm brands={brandsLite} />
          </div>
          {(benchmarks?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No benchmarks set. These override defaults in audits.</p>
          ) : (
            <ul className="space-y-2">
              {benchmarks!.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-surface-border text-sm">
                  <span className="font-medium text-ink">{b.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">target {b.target ?? "—"} {b.unit ?? ""}</span>
                    <DeleteButton table="benchmarks" id={b.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
