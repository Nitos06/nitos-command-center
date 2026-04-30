import { Search, FileText, Wrench, TrendingUp, Bot, AlertCircle, CheckCircle2, Clock, BarChart2, Link2 } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";
import { FixRequestPanel, ApplyFixButton } from "./fix-request";
import SeoTabs from "./seo-tabs";

export default async function SeoPage() {
  const { supabase, brandId } = await createBrandedClient();
  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: keywords, count: kwCount },
    { data: pages, count: pageCount },
    { data: audits },
    { data: backlinks, count: blCount },
    { data: blogPosts },
    { data: agentLogs },
    { data: allAudits },
    { data: seoPages },
    { data: pendingFixes },
  ] = await Promise.all([
    eq(supabase.from("seo_keywords").select("*", { count: "exact" })).eq("is_active", true).order("current_rank", { ascending: true }).limit(50),
    eq(supabase.from("seo_pages").select("*", { count: "exact" })).limit(1),
    eq(supabase.from("seo_audits").select("*")).order("run_at", { ascending: false }).limit(1),
    eq(supabase.from("backlinks").select("*", { count: "exact" })).eq("status", "live").limit(1),
    eq(supabase.from("seo_pages").select("*")).eq("page_type", "blog").order("published_at", { ascending: false }).limit(50),
    eq(supabase.from("agent_logs").select("*")).or("agent_name.ilike.seo%").order("created_at", { ascending: false }).limit(100),
    eq(supabase.from("seo_audits").select("run_at, overall_score, issues_json")).order("run_at", { ascending: false }).limit(10),
    eq(supabase.from("seo_pages").select("*")).order("updated_at", { ascending: false }).limit(100),
    eq(supabase.from("agent_logs").select("*")).eq("type", "fix_request").order("created_at", { ascending: false }).limit(50),
  ]);

  const latest = audits?.[0];
  const fixes: any[] = latest?.issues_json
    ? (Array.isArray(latest.issues_json) ? latest.issues_json : Object.values(latest.issues_json))
    : [];

  const healthScore = latest?.overall_score ?? null;

  const issuesByCategory = {
    Crawlability: fixes.filter((f: any) => f.category === "crawlability" || f.type === "crawlability"),
    HTTPS: fixes.filter((f: any) => f.category === "https" || f.type === "https"),
    "Meta tags": fixes.filter((f: any) => f.category === "meta" || f.type === "meta" || f.title?.toLowerCase().includes("meta")),
    "Content quality": fixes.filter((f: any) => f.category === "content" || f.type === "content"),
    Links: fixes.filter((f: any) => f.category === "links" || f.type === "links" || f.title?.toLowerCase().includes("link")),
    Performance: fixes.filter((f: any) => f.category === "performance" || f.type === "performance" || f.title?.toLowerCase().includes("speed")),
    "Structured data": fixes.filter((f: any) => f.category === "schema" || f.type === "schema" || f.title?.toLowerCase().includes("schema")),
  };

  const errors = fixes.filter((f: any) => f.severity === "error" || f.priority === "high");
  const warnings = fixes.filter((f: any) => f.severity === "warning" || f.priority === "medium");
  const notices = fixes.filter((f: any) => f.severity === "notice" || f.priority === "low" || (!f.severity && !f.priority));

  const missingMeta = seoPages?.filter((p: any) => !p.meta_description) ?? [];
  const missingAlt = seoPages?.filter((p: any) => (p.missing_alt_count ?? 0) > 0) ?? [];
  const totalMissingAlt = missingAlt.reduce((s: number, p: any) => s + (p.missing_alt_count ?? 0), 0);

  const scoreColor = (score: number | null | undefined) => {
    if (!score) return "text-ink-muted";
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const gaugeColor = (score: number) =>
    score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  const scoreBarColor = (score: number) =>
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">SEO Dashboard</h1>
          <p className="text-xs text-ink-muted mt-1">Site audit · fixes · improvements · agent log · blog posts</p>
        </div>
        <FixRequestPanel brandId={brandId} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Tracked keywords", value: String(kwCount ?? 0) },
          { label: "Pages indexed", value: String(pageCount ?? 0) },
          { label: "Live backlinks", value: String(blCount ?? 0) },
          { label: "Last audit score", value: latest?.overall_score ? `${latest.overall_score}/100` : "—" },
        ].map(k => (
          <div key={k.label} className="card py-3 px-4">
            <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">{k.label}</div>
            <div className="text-xl font-bold text-ink">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tab sections — client component handles switching */}
      <SeoTabs
        brandId={brandId}
        healthScore={healthScore}
        gaugeColor={gaugeColor}
        scoreColor={scoreColor}
        scoreBarColor={scoreBarColor}
        errors={errors}
        warnings={warnings}
        notices={notices}
        fixes={fixes}
        issuesByCategory={issuesByCategory}
        latest={latest}
        allAudits={allAudits ?? []}
        pendingFixes={pendingFixes ?? []}
        keywords={keywords ?? []}
        missingMeta={missingMeta}
        totalMissingAlt={totalMissingAlt}
        agentLogs={agentLogs ?? []}
        blogPosts={blogPosts ?? []}
        seoPages={seoPages ?? []}
      />
    </>
  );
}
