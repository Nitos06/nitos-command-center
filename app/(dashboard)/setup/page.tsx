import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import {
  Bot, Database, Zap, Globe, Server, CheckCircle2, Circle,
  AlertTriangle, Terminal, Key, RefreshCw, Clock, ArrowRight,
  Cpu, Link2, BookOpen, Shield,
} from "lucide-react";

const MCPS = [
  { name: "Supabase", id: "supabase", purpose: "Database, auth, storage — the backbone of everything", required: true, scope: "global" },
  { name: "Shopify Theme", id: "shopify-theme", purpose: "Read/write Liquid theme files for SEO auto-fixes", required: false, scope: "global" },
  { name: "Gmail", id: "gmail", purpose: "Customer service inbox, invoice scanning, email replies", required: false, scope: "global" },
  { name: "DataForSEO", id: "dataforseo", purpose: "Keyword research, SERP tracking, on-page audits, backlinks", required: false, scope: "global" },
  { name: "Google Search Console", id: "gsc", purpose: "Page performance, impressions, clicks, indexing status", required: false, scope: "global" },
  { name: "HeyGen", id: "heygen", purpose: "AI founder-clone videos for YouTube/TikTok/Facebook", required: false, scope: "global" },
  { name: "Submagic", id: "submagic", purpose: "Auto-captions + shorts extraction for video content", required: false, scope: "global" },
  { name: "YouTube Data", id: "youtube", purpose: "Trending topics, competitor videos, transcript extraction", required: false, scope: "global" },
  { name: "Apify", id: "apify", purpose: "Reddit scraping, Meta Ad Library, competitor research", required: false, scope: "global" },
  { name: "Slack", id: "slack", purpose: "Optional alert channel alongside Telegram", required: false, scope: "global" },
  { name: "ElevenLabs", id: "elevenlabs", purpose: "AI voiceovers for video content", required: false, scope: "global" },
  { name: "Sentry", id: "sentry", purpose: "Error tracking for production issues", required: false, scope: "global" },
];

const ENV_VARS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", desc: "Supabase project URL", required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Supabase anon/public key", required: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", desc: "Supabase service role key (server-side only)", required: true },
  { key: "AWS_SES_ACCESS_KEY_ID", desc: "AWS IAM key for SES email sending", required: true },
  { key: "AWS_SES_SECRET_ACCESS_KEY", desc: "AWS IAM secret for SES", required: true },
  { key: "AWS_SES_REGION", desc: "SES region (e.g. eu-west-1)", required: true },
  { key: "GEMINI_API_KEY", desc: "Google Gemini API key — hook analysis, ad concept generation", required: false },
  { key: "TELEGRAM_BOT_TOKEN", desc: "Telegram bot token for agent alerts", required: false },
  { key: "SHOPIFY_WEBHOOK_SECRET", desc: "Shared HMAC secret for Shopify webhook verification", required: false },
];

const BRAND_CONNECTIONS = [
  { platform: "shopify", label: "Shopify", desc: "Admin API access token — orders, products, customers, theme", icon: "🛍️" },
  { platform: "meta_ads", label: "Meta Ads", desc: "Meta Graph API token — ad campaigns, insights, custom audiences", icon: "📣" },
  { platform: "instagram", label: "Instagram", desc: "Instagram Graph API token — posts, stories, DMs, insights", icon: "📸" },
  { platform: "facebook", label: "Facebook Page", desc: "Page access token — posts, comments, page insights", icon: "👥" },
  { platform: "tiktok", label: "TikTok", desc: "TikTok API token — video publishing, analytics", icon: "🎵" },
  { platform: "pinterest", label: "Pinterest", desc: "Pinterest API token — pins, boards, analytics", icon: "📌" },
  { platform: "youtube", label: "YouTube", desc: "Google OAuth token — video upload, channel analytics", icon: "▶️" },
  { platform: "gmail", label: "Gmail OAuth", desc: "OAuth token for CS inbox reading and replying", icon: "📧" },
];

const AGENT_SCHEDULE = [
  { id: "finance-il-reconciliation",    label: "Finance: Daily reconciliation",    schedule: "04:00 daily",           purpose: "VAT, expenses, tax bracket snapshot" },
  { id: "finance-il-profit-watch",      label: "Finance: Profit watch",            schedule: "08:00 daily",           purpose: "Morning Telegram digest: revenue, margin, ad spend" },
  { id: "finance-il-monthly",           label: "Finance: Monthly reports",         schedule: "1st of month 06:00",    purpose: "VAT report, Bituach Leumi, income tax deposit" },
  { id: "finance-il-telegram-poll",     label: "Finance: Receipt scanner",         schedule: "Every 15 min",          purpose: "Telegram #receipt → OCR → expenses table" },
  { id: "reviews-daily",                label: "Reviews: Daily routine",           schedule: "06:00 daily",           purpose: "UGC scoring, review request emails, segment sync" },
  { id: "seo-audit-autofix",            label: "SEO: Audit + auto-fix",            schedule: "02:00 every 5 days",    purpose: "Shopify theme meta/schema fixes, GSC performance" },
  { id: "seo-blog-post",                label: "SEO: Blog post",                   schedule: "06:00 Mon/Wed/Fri",     purpose: "Keyword research → write → publish to Shopify" },
  { id: "email-weekly-campaign",        label: "Email: Weekly campaign",           schedule: "07:00 Monday",          purpose: "Generate + send via Amazon SES" },
  { id: "email-monthly-topic-bank",     label: "Email: Monthly topic bank",        schedule: "1st of month midnight", purpose: "Plan 30 days of email topics" },
  { id: "email-deliverability-nightly", label: "Email: Deliverability stats",      schedule: "03:00 daily",           purpose: "SES bounce/open/click rates → email_deliverability" },
  { id: "meta-ads-daily",               label: "Meta Ads: Adaptive loop",          schedule: "09:00 daily",           purpose: "Kill losers, scale winners, generate concepts" },
  { id: "ads-multi-platform-daily",     label: "Ads: TikTok/Pinterest/YouTube",    schedule: "09:00 daily",           purpose: "Cross-platform kill/scale optimization" },
  { id: "ads-competitor-weekly",        label: "Ads: Competitor research",         schedule: "04:00 Sunday",          purpose: "Ad Library scrape → hook patterns → new concepts" },
  { id: "hook-mining-daily",            label: "Hook Mining: YouTube + Reddit",    schedule: "11:00 daily",           purpose: "Extract top hooks, classify patterns, generate variants" },
  { id: "analytics-daily",              label: "Analytics: Daily sync",            schedule: "07:00 daily",           purpose: "Shopify orders + Meta spend → ROAS, daily KPIs" },
  { id: "advisory-weekly",              label: "Advisory: Weekly report",          schedule: "08:00 Sunday",          purpose: "Strategic Telegram report: performance, risks, actions" },
  { id: "social-instagram-weekly-calendar", label: "Instagram: Weekly planning",  schedule: "07:00 Monday",          purpose: "Plan 7-day content calendar aligned with campaigns" },
  { id: "social-instagram-daily",       label: "Instagram: Daily post",            schedule: "09:00 daily",           purpose: "Feed post or reel via Instagram Graph API" },
  { id: "social-tiktok-daily",          label: "TikTok: Daily post",               schedule: "10:00 daily",           purpose: "Trend-driven video concept + post" },
  { id: "social-youtube-weekly",        label: "YouTube: Weekly video",            schedule: "11:00 Tuesday",         purpose: "HeyGen founder video + Submagic captions" },
  { id: "social-pinterest-daily",       label: "Pinterest: Daily bulk pins",       schedule: "12:00 daily",           purpose: "10–15 product pins with SEO-optimized descriptions" },
  { id: "social-facebook-post",         label: "Facebook: Daily post",             schedule: "11:00 daily",           purpose: "3-day rotation: niche event / opinion / product story" },
  { id: "social-facebook-replies",      label: "Facebook: Comment replies",        schedule: "17:00 daily",           purpose: "Reply to comments, like genuine engagement" },
  { id: "customer-service-poll",        label: "Customer Service: Poll",           schedule: "Every 30 min, 09–22",   purpose: "Gmail tickets → FAQ match → auto-reply or escalate" },
  { id: "dm-funnel-nightly",            label: "DM Funnel: Nightly",               schedule: "01:00 daily",           purpose: "Instagram DMs → funnel stages → personalized sequences" },
  { id: "dashboard-bridge",             label: "Dashboard Bridge: Sync",           schedule: "Every 5 min",           purpose: "Real-time Shopify orders + ad spend sync" },
];

export default async function SetupPage() {
  const supabase = await createClient();

  const [
    { data: brands },
    { data: connections },
    { data: brandSettings },
  ] = await Promise.all([
    supabase.from("brands").select("id, name, status").order("created_at"),
    supabase.from("connections").select("brand_id, platform, status"),
    supabase.from("brand_settings").select("brand_id, shopify_domain, ses_sender_email, meta_account_id, telegram_chat_id"),
  ]);

  return (
    <>
      <PageHeader
        title="Setup & Architecture"
        subtitle="How the agents work, what needs configuring, and how everything connects"
      />

      {/* HOW IT WORKS */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary-500" /> How It Works
        </h2>
        <div className="card mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 text-sm">
            <div className="flex-1 rounded-xl bg-surface-tint border border-surface-border p-4 text-center">
              <div className="font-semibold text-ink mb-1">Claude Desktop App</div>
              <div className="text-xs text-ink-muted">Scheduled tasks live here</div>
              <div className="text-xs text-ink-muted">28 MCPs configured globally</div>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-muted shrink-0 rotate-90 lg:rotate-0" />
            <div className="flex-1 rounded-xl bg-primary-50 border border-primary-200 p-4 text-center">
              <div className="font-semibold text-primary-700 mb-1">Supabase (Database)</div>
              <div className="text-xs text-primary-600">Agents write results here</div>
              <div className="text-xs text-primary-600">agent_logs, social_posts, etc.</div>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-muted shrink-0 rotate-90 lg:rotate-0" />
            <div className="flex-1 rounded-xl bg-surface-tint border border-surface-border p-4 text-center">
              <div className="font-semibold text-ink mb-1">This App (Dashboard)</div>
              <div className="text-xs text-ink-muted">Reads Supabase and displays</div>
              <div className="text-xs text-ink-muted">the face of every agent</div>
            </div>
          </div>
          <p className="text-sm text-ink-muted mt-4 leading-relaxed">
            Every agent routine is a <strong className="text-ink">scheduled task in Claude desktop</strong> — it fires a new Claude session on a cron schedule.
            That session has all 28 MCPs available (Supabase, Shopify, Gmail, Meta, DataForSEO, HeyGen, etc.), reads the skill file at{" "}
            <code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded">skills/[agent]/SKILL.md</code>, and executes the job.
            The agent writes everything back to Supabase. The dashboard reads Supabase and shows you the results.
          </p>
        </div>

        {/* 24/7 section */}
        <div className="card border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800 mb-2">Agents are NOT 24/7 by default — read this</div>
              <p className="text-sm text-amber-700 leading-relaxed mb-3">
                Scheduled tasks only fire while <strong>Claude desktop is running on your machine</strong>. If the laptop sleeps or Claude closes, tasks are skipped until Claude reopens.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-amber-200">
                  <div className="font-medium text-ink text-sm mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Option 1: Always-on machine (simplest now)
                  </div>
                  <p className="text-xs text-ink-muted">Keep Claude desktop open on a machine that never sleeps — a dedicated Windows PC, a mini PC, or a VPS running Claude. Tasks fire on schedule 24/7.</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-200">
                  <div className="font-medium text-ink text-sm mb-1 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-primary-500" /> Option 2: Vercel Cron + Claude API (proper production)
                  </div>
                  <p className="text-xs text-ink-muted">Rewrite triggers as Vercel cron routes that call <code className="text-[11px] bg-surface-tint px-1 rounded">anthropic.messages.create()</code> with tool use. Agents run serverlessly, truly 24/7, no desktop needed.</p>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                <strong>Recommendation:</strong> Start with Option 1 today. When ready to go full production, migrate to Option 2 — the SKILL.md prompts and Supabase schemas stay the same, only the trigger mechanism changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MULTI-BRAND */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" /> Multi-Brand Architecture
        </h2>
        <div className="card">
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            MCPs are configured <strong className="text-ink">once globally</strong> in Claude desktop for your personal accounts (your Supabase project, your DataForSEO key, your HeyGen account, etc.).
            They are <strong className="text-ink">not</strong> configured per-brand. Instead, each brand's API credentials are stored in the <code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded">connections</code> Supabase table
            and read at runtime by the agents.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4 text-sm">
            <div className="rounded-xl bg-surface-tint border border-surface-border p-3">
              <div className="font-medium text-ink mb-2 flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-primary-500" /> Global (once in Claude MCPs)</div>
              <ul className="space-y-1 text-xs text-ink-muted">
                <li>· Supabase project</li>
                <li>· DataForSEO account</li>
                <li>· Google Search Console</li>
                <li>· HeyGen account</li>
                <li>· Submagic account</li>
                <li>· YouTube API</li>
                <li>· Apify account</li>
              </ul>
            </div>
            <div className="rounded-xl bg-surface-tint border border-surface-border p-3">
              <div className="font-medium text-ink mb-2 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-green-500" /> Global (once in .env.local)</div>
              <ul className="space-y-1 text-xs text-ink-muted">
                <li>· AWS SES credentials</li>
                <li>· Gemini API key</li>
                <li>· Telegram bot token</li>
                <li>· Shopify webhook secret</li>
                <li>· Supabase keys</li>
              </ul>
            </div>
            <div className="rounded-xl bg-primary-50 border border-primary-200 p-3">
              <div className="font-medium text-primary-700 mb-2 flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-primary-500" /> Per-brand (in this app)</div>
              <ul className="space-y-1 text-xs text-primary-600">
                <li>· Shopify Admin API token</li>
                <li>· Meta/Instagram token</li>
                <li>· Facebook page token</li>
                <li>· TikTok/Pinterest/YouTube token</li>
                <li>· Gmail OAuth token</li>
                <li>· SES sender email</li>
                <li>· Telegram chat ID</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            When a routine runs, it queries <code className="text-[11px] bg-surface-tint px-1.5 py-0.5 rounded">SELECT * FROM connections WHERE brand_id = &apos;x&apos; AND platform = &apos;shopify&apos;</code> to get the token for that specific brand, then calls the Shopify API directly with it.
            This way one Claude installation manages unlimited brands.
          </p>
        </div>
      </section>

      {/* BRAND STATUS */}
      {(brands?.length ?? 0) > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary-500" /> Brand Configuration Status
          </h2>
          <div className="space-y-3">
            {brands!.map((brand: any) => {
              const bs = brandSettings?.find((s: any) => s.brand_id === brand.id);
              const brandConns = connections?.filter((c: any) => c.brand_id === brand.id) ?? [];
              const connPlatforms = new Set(brandConns.map((c: any) => c.platform));

              const checks = [
                { label: "SES sender email", ok: !!bs?.ses_sender_email },
                { label: "Shopify domain", ok: !!bs?.shopify_domain },
                { label: "Telegram chat ID", ok: !!bs?.telegram_chat_id },
                { label: "Shopify connection", ok: connPlatforms.has("shopify") },
                { label: "Meta Ads connection", ok: connPlatforms.has("meta_ads") },
                { label: "Instagram connection", ok: connPlatforms.has("instagram") },
              ];
              const doneCount = checks.filter((c) => c.ok).length;

              return (
                <div key={brand.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-ink">{brand.name}</div>
                      <span className={brand.status === "active" ? "badge-success" : "badge-warn"}>{brand.status}</span>
                    </div>
                    <div className="text-xs text-ink-muted">{doneCount}/{checks.length} configured</div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5 text-xs">
                        {c.ok
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <Circle className="w-3.5 h-3.5 text-ink-muted shrink-0" />}
                        <span className={c.ok ? "text-ink" : "text-ink-muted"}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-muted mt-2">Configure per-brand settings in <a href="/settings" className="text-primary-600 hover:underline">Settings →</a></p>
        </section>
      )}

      {/* PER-BRAND CONNECTIONS */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary-500" /> Per-Brand Connections (Settings → Connections)
        </h2>
        <div className="card">
          <p className="text-sm text-ink-muted mb-4">Each brand needs these API tokens added in <a href="/settings" className="text-primary-600 hover:underline">Settings → Connections</a>. Agents read them at runtime from the <code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded">connections</code> table.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {BRAND_CONNECTIONS.map((c) => (
              <div key={c.platform} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-surface-border bg-surface-tint text-sm">
                <span className="text-base">{c.icon}</span>
                <div>
                  <div className="font-medium text-ink">{c.label} <code className="text-[11px] bg-white px-1 rounded ml-1">{c.platform}</code></div>
                  <div className="text-xs text-ink-muted mt-0.5">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENV VARS */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary-500" /> Environment Variables (.env.local)
        </h2>
        <div className="card">
          <p className="text-sm text-ink-muted mb-4">These are global — set once in <code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded">.env.local</code> at the project root.</p>
          <div className="space-y-2">
            {ENV_VARS.map((v) => (
              <div key={v.key} className="flex items-start gap-3 text-sm">
                <code className="text-xs bg-surface-tint px-2 py-1 rounded font-mono shrink-0 min-w-[280px]">{v.key}</code>
                <span className="text-ink-muted text-xs pt-1">{v.desc}</span>
                {v.required && <span className="badge-crit text-[10px] shrink-0">required</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCPs */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-500" /> MCP Servers (Configured in Claude Desktop)
        </h2>
        <div className="card">
          <p className="text-sm text-ink-muted mb-4">
            These are configured <strong className="text-ink">once</strong> in Claude desktop app settings → MCP Servers.
            They are your personal API connections — shared across all brands and all agent sessions.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {MCPS.map((m) => (
              <div key={m.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-surface-border text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${m.required ? "bg-red-400" : "bg-green-400"}`} />
                <div>
                  <div className="font-medium text-ink">{m.name}</div>
                  <div className="text-xs text-ink-muted">{m.purpose}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-3"><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5 align-middle" />Required &nbsp; <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5 align-middle" />Recommended</p>
        </div>
      </section>

      {/* SKILL FILES */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-500" /> Skill Files (Agent Instructions)
        </h2>
        <div className="card">
          <p className="text-sm text-ink-muted mb-4">
            Each agent reads its instructions from a <code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded">SKILL.md</code> file at{" "}
            <code className="text-xs bg-surface-tint px-1.5 py-0.5 rounded">C:\Users\97252\Desktop\Agents ai\skills\[agent]\SKILL.md</code>.
            These files define exactly what the agent does, which MCPs it uses, and what it writes to Supabase. Edit them to change agent behavior.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
            {["finance-il","customer-service","email-marketing","reviews","seo","meta-ads","ads-multi-platform","ads-competitor","analytics","advisory","social-instagram","social-tiktok","social-youtube","social-pinterest","social-facebook","dm-funnel","hook-mining","dashboard-bridge"].map((s) => (
              <div key={s} className="px-2.5 py-1.5 rounded-lg bg-surface-tint border border-surface-border text-ink-muted">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENT SCHEDULE */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" /> Agent Schedule (26 Scheduled Tasks)
        </h2>
        <div className="card overflow-x-auto">
          <p className="text-sm text-ink-muted mb-4">
            All tasks are registered in Claude desktop → Scheduled Tasks. They fire automatically when Claude is running.
            <strong className="text-ink"> First-time setup:</strong> click "Run now" on each task in Claude sidebar to pre-approve tool permissions.
          </p>
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted text-xs">
              <tr>
                <th className="py-2 pr-4">Agent</th>
                <th className="pr-4 whitespace-nowrap">Schedule</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_SCHEDULE.map((a) => (
                <tr key={a.id} className="border-t border-surface-border">
                  <td className="py-2 pr-4 font-medium text-ink whitespace-nowrap">{a.label}</td>
                  <td className="pr-4 text-xs text-primary-600 font-mono whitespace-nowrap">{a.schedule}</td>
                  <td className="text-xs text-ink-muted">{a.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FIRE FROM APP */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary-500" /> Should You Trigger Agents From the App?
        </h2>
        <div className="card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-ink mb-2">Current setup: Claude Scheduled Tasks</div>
              <ul className="space-y-1.5 text-ink-muted text-xs leading-relaxed">
                <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> Agents run fully autonomously on schedule</li>
                <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> All 28 MCPs available to every agent session</li>
                <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> Skill files editable — change behavior without code</li>
                <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Requires Claude desktop to be running</li>
                <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Can&apos;t trigger manually from the app today</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-ink mb-2">Recommended addition: Manual triggers</div>
              <p className="text-xs text-ink-muted leading-relaxed mb-2">
                Adding "Run now" buttons to this app is valuable for ad-hoc runs (e.g. "run the SEO audit now" or "send the weekly campaign early").
                This would work by calling a Next.js API route which uses the Anthropic SDK to invoke the agent with the skill prompt.
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                <strong className="text-ink">Verdict:</strong> Keep scheduled tasks for 24/7 automation.
                Add manual triggers for the high-value agents (Meta Ads, SEO, Email Campaign, Advisory) so you can run them on demand from here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ADD A NEW BRAND */}
      <section className="mb-4">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" /> Adding a New Brand — Checklist
        </h2>
        <div className="card">
          <ol className="space-y-3 text-sm">
            {[
              { step: 1, title: "Add brand in Settings", desc: "Settings → Brands → Add brand. Fill slug, name, domain, niche, currency." },
              { step: 2, title: "Configure per-brand settings", desc: "Settings → Per-brand settings → Edit. Set ses_sender_email (must be SES-verified), shopify_domain, meta_account_id, telegram_chat_id." },
              { step: 3, title: "Add Connections", desc: "Settings → Connections → Add connection. Add entries for shopify, meta_ads, instagram, facebook (one row per platform with the API token in account_ref)." },
              { step: 4, title: "Set up Tax Entity (IL brands)", desc: "Settings → Tax entity → Set tax entity. Choose osek_patur/osek_murshe/chevra_baam, add VAT number, set VAT frequency." },
              { step: 5, title: "Add benchmarks (optional)", desc: "Settings → Benchmarks → Add benchmark. Set roas_target, margin_target, cpa_max to give agents performance thresholds." },
              { step: 6, title: "Register Shopify webhooks", desc: "In Shopify Admin → Settings → Notifications → Webhooks, point orders/paid + orders/fulfilled + customers/create to /api/webhooks/shopify/orders and /customers." },
              { step: 7, title: "Agents start working automatically", desc: "All 26 scheduled tasks already iterate over all active brands. Once a brand has connections configured, agents pick it up on their next run." },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <div className="font-medium text-ink">{item.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{item.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
