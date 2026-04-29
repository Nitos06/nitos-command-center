import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { Hammer, Plus, CheckCircle2, Circle, Clock, Palette, Globe, Users, FileText } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

const BUILD_PHASES = [
  { key: "market-research", label: "Market research", icon: FileText, description: "Niche analysis, competitors, demand validation" },
  { key: "branding", label: "Branding", icon: Palette, description: "Brand name, logo, colors, typography, voice" },
  { key: "avatar-builder", label: "Customer avatar", icon: Users, description: "ICP definition, pain points, desires" },
  { key: "website-builder", label: "Shopify store", icon: Globe, description: "Theme, copy, product pages, checkout" },
];

type PhaseStatus = "completed" | "in_progress" | "pending" | "owner_gate";

function PhaseIcon({ status }: { status: PhaseStatus }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "in_progress") return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
  return <Circle className="w-4 h-4 text-ink-subtle" />;
}

export default async function EcomBuilderPage() {
  const { supabase, brandId } = await createBrandedClient();

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [{ data: builds }, { data: buildAssets }] = await Promise.all([
    eq(supabase.from("builds").select("*")).order("started_at", { ascending: false }),
    eq(supabase.from("build_assets").select("*")).order("created_at", { ascending: false }).limit(50),
  ]);

  const active = builds?.filter((b: any) => !["handoff", "archived"].includes(b.stage)).length ?? 0;
  const launched = builds?.filter((b: any) => b.actual_launch).length ?? 0;

  const assetsByBuild = (buildAssets ?? []).reduce((acc: Record<string, any[]>, a: any) => {
    acc[a.build_id] = [...(acc[a.build_id] ?? []), a];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      <PageHeader
        title="E-Commerce Builder"
        subtitle="AI-powered brand creation — market research → branding → avatar → Shopify store"
        action={
          <form action="/api/ecom-builder/start" method="POST">
            <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Start new brand
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total builds" value={String(builds?.length ?? 0)} />
        <Kpi label="Active builds" value={String(active)} />
        <Kpi label="Launched" value={String(launched)} />
        <Kpi label="Avg build stages" value={builds?.length ? String(Math.round((builds ?? []).reduce((s: number, b: any) => {
          const stageIndex = BUILD_PHASES.findIndex(p => p.key === b.stage);
          return s + (stageIndex >= 0 ? stageIndex + 1 : 0);
        }, 0) / (builds?.length ?? 1))) : "—"} />
      </div>

      {(builds?.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState icon={Hammer} title="No brand builds yet" hint="Start a new brand — the AI agent guides you through market research, branding, customer avatar, and Shopify store setup with 4 owner approval gates." />
          <div className="mt-6">
            <div className="text-sm font-semibold text-ink mb-3">Build pipeline</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {BUILD_PHASES.map((phase, i) => {
                const Icon = phase.icon;
                return (
                  <div key={phase.key} className="p-3 rounded-xl bg-surface-tint border border-surface-border">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">{i + 1}</div>
                      <Icon className="w-3.5 h-3.5 text-ink-muted" />
                    </div>
                    <div className="text-xs font-semibold text-ink">{phase.label}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5 leading-relaxed">{phase.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {builds!.map((build: any) => {
            const currentPhaseIdx = BUILD_PHASES.findIndex(p => p.key === build.stage);
            const buildAssetsForBuild = assetsByBuild[build.id] ?? [];
            const logo = buildAssetsForBuild.find((a: any) => a.asset_type === "logo");
            const palette = buildAssetsForBuild.find((a: any) => a.asset_type === "palette");
            const avatar = buildAssetsForBuild.find((a: any) => a.asset_type === "avatar");
            const site = buildAssetsForBuild.find((a: any) => a.asset_type === "site_url");

            return (
              <div key={build.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {logo?.url ? (
                      <img src={logo.url} alt="" className="w-10 h-10 rounded-xl object-contain bg-surface-tint" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                        {build.project_name?.[0] ?? "B"}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-ink">{build.project_name}</div>
                      <div className="text-xs text-ink-muted">{build.niche ?? "—"}{build.client_name ? ` · ${build.client_name}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {build.actual_launch && (
                      <span className="badge-success text-[10px]">Launched</span>
                    )}
                    <span className={`badge-${build.stage === "owner_gate" ? "warn" : "primary"}`}>{build.stage}</span>
                  </div>
                </div>

                {/* Phase progress */}
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {BUILD_PHASES.map((phase, i) => {
                    const status: PhaseStatus = i < currentPhaseIdx ? "completed"
                      : i === currentPhaseIdx ? (build.stage === "owner_gate" ? "owner_gate" : "in_progress")
                      : "pending";
                    return (
                      <div key={phase.key} className={`px-2.5 py-2 rounded-lg border text-xs ${status === "completed" ? "bg-green-50 border-green-200" : status === "in_progress" || status === "owner_gate" ? "bg-amber-50 border-amber-200" : "bg-surface-tint border-surface-border"}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <PhaseIcon status={status} />
                          <span className="font-medium text-ink">{phase.label}</span>
                        </div>
                        {status === "owner_gate" && (
                          <div className="text-[10px] text-amber-600 font-medium">Awaiting approval</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Build assets preview */}
                {buildAssetsForBuild.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-surface-border">
                    {palette?.data?.colors && (
                      <div>
                        <div className="text-[10px] text-ink-muted mb-1 uppercase tracking-wide">Palette</div>
                        <div className="flex gap-1">
                          {(palette.data.colors as string[]).slice(0, 5).map((color: string) => (
                            <div key={color} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ background: color }} title={color} />
                          ))}
                        </div>
                      </div>
                    )}
                    {avatar?.data?.name && (
                      <div>
                        <div className="text-[10px] text-ink-muted mb-1 uppercase tracking-wide">Avatar</div>
                        <div className="text-xs font-medium text-ink">{avatar.data.name}</div>
                        <div className="text-[10px] text-ink-muted">{avatar.data.age_range}</div>
                      </div>
                    )}
                    {site?.url && (
                      <div>
                        <div className="text-[10px] text-ink-muted mb-1 uppercase tracking-wide">Store</div>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline truncate block max-w-[120px]">{site.url}</a>
                      </div>
                    )}
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
