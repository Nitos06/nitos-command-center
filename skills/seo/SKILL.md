---
name: seo
description: Merged SEO agent — audit + autofix every 5 days + blog every Mon/Wed/Fri/Sun. Owner mandate "I want it simple. Every 5 days, full SEO report, then Shopify MCP implements all fixes + improvements. Same for keywords." Aggressive autofix (no owner approval needed) for alts, meta, schema, image compression, broken links, H1s, internal links, sitemap. Blog mode: 18 posts/month, 2k–6.5k words, EEAT-grade, 10-formula picker, content-from-content sourcing, Shopify publish. A11y baked into audit phase.
trigger:
  scheduled:
    - "0 2 */5 * * Asia/Jerusalem"            # every 5d 02:00 — audit + autofix
    - "0 6 * * 1,3,5,0 Asia/Jerusalem"        # Mon/Wed/Fri/Sun 06:00 — blog
  manual:
    - "/seo audit"
    - "/seo blog {microtopic}"
mcp_dependencies:
  required:
    - dataforseo
    - playwright
    - shopify
    - supabase
  optional:
    - google-search-console
    - pubmed
    - reddit
    - apify
inputs:
  - state/context.json
  - state/branding/brand-strategy-blueprint.json
  - state/market-research/customer-avatar.json
  - state/seo/topic-plan.json
  - state/meta-ads/lp-issues.json   # CRO flags from meta-ads → SEO+website fixes
outputs:
  - state/seo/audit/{date}.json
  - state/seo/audit/latest.json
  - state/seo/posts/{slug}.md
  - state/seo/posts/{slug}.meta.json
  - state/seo/published.json
  - state/seo/topic-plan.json
  - state/seo/latest.json
  - state/seo/latest-status.json
references:
  - references/my-audit-checklist.md
  - references/my-autofix-rules.md
  - references/my-10-blog-formulas.md
  - references/my-blog-rules.md
  - references/my-content-sourcing.md
  - ../../skills/_external/accessibility-audit/SKILL.md
aviv_refs:
  - ../../skills/_aviv/seo-audit/SKILL.md
  - ../../skills/_aviv/seo-technical/SKILL.md
  - ../../skills/_aviv/seo-schema/SKILL.md
  - ../../skills/_aviv/seo-sitemap/SKILL.md
  - ../../skills/_aviv/seo-images/SKILL.md
  - ../../skills/_aviv/seo-hreflang/SKILL.md
  - ../../skills/_aviv/site-architecture/SKILL.md
  - ../../skills/_aviv/schema-markup/SKILL.md
  - ../../skills/_aviv/seo-content/SKILL.md
  - ../../skills/_aviv/seo-page/SKILL.md
  - ../../skills/_aviv/seo-plan/SKILL.md
  - ../../skills/_aviv/seo-programmatic/SKILL.md
  - ../../skills/_aviv/seo-competitor-pages/SKILL.md
  - ../../skills/_aviv/seo-geo/SKILL.md
  - ../../skills/_aviv/programmatic-seo/SKILL.md
  - ../../skills/_aviv/ai-seo/SKILL.md
  - ../../skills/_aviv/seo/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# SEO Agent (merged audit + blog)

Owner mandate: **simple, aggressive, autonomous.** Every 5 days = audit + fix. Mon/Wed/Fri/Sun = blog post. No approval gates.

## Mode A — Audit + autofix (every 5d, 02:00)

### Phase A.1 — Precheck
- `dataforseo`, `playwright`, `shopify` connected? halt if missing.
- Last audit < 4d? exit.

### Phase A.2 — Collect (parallel)
1. **Lighthouse via Playwright** — CWV (LCP/INP/CLS/TTFB/FCP), mobile-friendliness
2. **DataForSEO crawl** — on-page, structured data, schema, links, sitemaps
3. **GSC pull** — impressions/clicks/queries, indexation status
4. **Shopify scan** — meta tags, alt text, schema-per-page, image weights
5. **`_external/accessibility-audit`** — WCAG 2.1 AA (contrast, focus, ARIA, alt, keyboard, screen-reader)

### Phase A.3 — Score
Per `references/my-audit-checklist.md` — `pass | warn | fail | na`.

### Phase A.4 — Diff
Load `state/seo/audit/latest.json`. Identify regressions, wins, carry-overs (with "days outstanding").

### Phase A.5 — Aggressive autofix (Shopify MCP) — owner mandate "MUST work to improve everything"

Execute all without owner approval:
- Generate + apply all missing alt text (from product/post title + image context)
- Generate + apply all missing meta descriptions (from first paragraph)
- Inject all missing schema (Product / Article / FAQ / BreadcrumbList / Organization)
- Compress all oversized images, convert to WebP
- Replace broken internal links — auto-replace if slug-similarity >0.85, queue lower
- Fix all H1 issues (missing / duplicate)
- Auto-add internal links to pages ranked 5–15 in GSC (rising-star boost)
- Fix sitemap entries + hreflang + canonical
- Apply CRO flags from `state/meta-ads/lp-issues.json` (high CTR / low CVR pages → tighten copy, restructure)

### Phase A.6 — Keyword discovery + implementation

1. DataForSEO `keywords_for_keywords` on every product page → identify gap KWs.
2. For each gap KW with `KD ≤ 25` AND `MSV ≥ 50`:
   - Update existing product/blog page meta + H1 to include it (Shopify MCP), OR
   - Queue new blog post in `state/seo/topic-plan.json`

### Phase A.7 — Persist + dashboard
- `state/seo/audit/{date}.json` + `latest.json`
- Insert Supabase `audits` (category=`seo`)
- Push status to dashboard

### Audit digest
```
🔍 SEO Audit — {date}
Score: {pct}% pass · {warn} warns · {fail} fails
Auto-fixed: {n} (alts, schemas, compressions, H1s, links)
Regressions vs last run: {n}
Outstanding for 10+ days: {n}
KW gaps queued: {n} (added to topic-plan)
A11y: {pct}% AA-compliant
```

## Mode B — Blog post (Mon/Wed/Fri/Sun 06:00)

### Phase B.1 — Pick microtopic
Pull next from `state/seo/topic-plan.json`. Empty → `crit` alert + exit. Topical focus mandatory.

### Phase B.2 — Source content
Per `references/my-content-sourcing.md`:
- Reddit niche questions
- Quora niche questions
- YouTube niche videos
- Existing Google blog posts (extract paragraph, expand)
- For research-grade: PubMed, Apify scrape

Save raw to `state/seo/sources/{slug}/`.

### Phase B.3 — Pick formula (Claude decides best fit)
1. Problem-Agitate-Solve · 2. How-to step-by-step · 3. List post · 4. Before-and-after · 5. Question-and-answer · 6. Story → listen → take-away · 7. Comparison · 8. Mistake-to-fix · 9. Framework · 10. Ultimate guide

### Phase B.4 — KW cluster (DataForSEO)
- ≥8 keywords
- All low competition + medium intent
- Map: 1 primary + 2–3 secondary + 4+ long-tail
- Save to `{slug}.meta.json` → `keywords[]`

### Phase B.5 — Write article (hard rules)

Per `references/my-blog-rules.md` (verbatim from owner):
- **Length:** 2,000–6,550 words
- **Tone:** informational + light-mooded mix
- **Title:** unconventional, dramatic, eye-catching, fault-provoking — NO "unlock"/"unlocking"
- **Headings:** 8–10 unique, interesting H2/H3 (no H1 at top)
- **Intro:** optimistic + funny + contains main keyword
- **Outro:** informative + impressive ("samurai" close)
- **Tone:** active, young audience, real value
- **No keyword spam**
- **Internal links** to product pages (resource mentions, not sales pitches)
- **External links** nofollow to Wikipedia + authoritative
- **YouTube:** embed actual video (not just link)
- **Forbidden words:** "unlock", "forbidden", "non-value", "not highly informative"
- **EEAT mandatory** — Experience/Expertise/Authoritativeness/Trustworthiness
- Brand-tone overlay from `state/branding/brand-strategy-blueprint.json` (forbidden words list applies)

### Phase B.6 — Internal product links
For each post, find Shopify product(s) that solve reader's problem. Insert as helpful resource mentions — not sales pitches.

### Phase B.7 — Publish (Shopify MCP)
Create blog article: title, body HTML, meta description, tags, author=brand. Save URL to `published.json`.

### Phase B.8 — Schema injection
Inject Article + FAQ schema (if Q&A formula) + BreadcrumbList JSON-LD via Shopify theme injection.

### Phase B.9 — Cross-promote
- Email campaign tease via `email-marketing` (queue post-link for next "Blog Promo" campaign type)
- Pinterest pin queue: `pinterest_asset_queue` row with blog hero image + title
- Internal-link sweep: re-run audit-Phase-A.5 step "rising-star boost" on the new post

### Phase B.10 — Persist + dashboard
- Insert Supabase `blog_posts` row
- Mark `topic-plan.json` microtopic as `published`
- Push to dashboard

### Blog digest
```
📝 SEO Blog — {brand}
Title: "{title}"
Words: 3,420 · KW cluster: 9 (1 primary + 3 sec + 5 long-tail)
Formula: ultimate-guide
Internal links: 4 product mentions · External: 6
URL: https://{brand}.com/blogs/news/{slug}
Cross-promoted: email + pinterest queued
```

## Cadence math

- Audit: every 5 days = ~6 audits/month
- Blog: 4 posts/week (Mon/Wed/Fri/Sun) ≈ 18/month ✅

## Dashboard contract

`state/seo/latest-status.json`:
```json
{
  "status": "ok",
  "headline": "Audit 92% pass · 18 autofixes · Blog: 'How to X' (3.4k words)",
  "kpis": {"audit_pct": 92, "autofixes": 18, "posts_mtd": 12, "kw_gaps_queued": 7},
  "next_run": "2026-04-29T06:00:00Z",
  "alerts": []
}
```

---

## Owner's playbook (verbatim)

### Audit mandate

> Now for the relevant SEO regular one, see X. I will paste later the things that I want Claude to do research about, audited about, and by. Meaning that I mean it will use data for SEO MCP. It will use Google Search Console and it can use Google Lighthouse. After it's done the audit, which needs to be done every five days, Claude needs to fix it. It will use the knowledge it generated from data for SEO and for Google Search Console and we'll fix everything it can either fix or improve from the audit every five days. We can use Shopify MCP and with that it will log in and use Shopify and with that it will do all the information.

> First, a full site audit: we want a site audit every 5 days to know issue / areas to improve. The site audit must be SEMrush level covering: Including Technical SEO, On-page SEO, Off-page SEO.

### SEMrush-level coverage taxonomy

#### Performance & Core Web Vitals
LCP, INP, CLS, TTFB, FCP, Caching (Browser/Server/Edge/CDN/Object/Redis), Minification (HTML/CSS/JS), Compression (Gzip/Brotli), Image opt (WebP/AVIF/Lazy/Srcset/decode), Resource Hints (Preload/Prefetch/Preconnect/DNS-Prefetch/Prerender), Critical Rendering Path, CSS/JS Deferral & Async, Third-Party Script & Pixel Management.

#### Mobile-Friendliness
Responsive Design, Viewport Meta, Touch Targets, Font Scaling & Interstitial Guidelines, Desktop/Mobile Content Parity.

#### Crawlability & Architecture
XML Sitemaps (Index/Image/Video/News/Mobile), HTML Sitemaps, robots.txt, Site Architecture (Flat vs Deep / Silo), Click-Depth, URL Structure (Subfolders/Subdomains/Absolute/Relative), URL Parameters, Trailing Slashes & Case Sensitivity, Faceted Nav Control, Orphan Pages, Crawl Budget, Log File Analysis.

#### Structured Data & Semantics
Schema.org (Product/Article/FAQPage/LocalBusiness/BreadcrumbList/Organization/Person/VideoObject), JSON-LD/Microdata/RDFa, Entity Association (@id, SameAs), Semantic HTML5.

#### Keyword Strategy & Mapping
Primary/Seed, Secondary/Long-Tail, Search Intent (Info/Nav/Trans/Commercial), KW Density & Prominence, TF-IDF & LSI, Heading Structure (H1 single+exact, H2 subtopics, H3-H6 nested).

#### Content Quality & Depth
EEAT, YMYL, Comprehensiveness vs Intent, Freshness/Decay, Original Data/UVP, No Cannibalization, No Thin/Duplicate.

#### UX & Formatting
Readability (Flesch-Kincaid), Paragraph Length & Whitespace (F/Z-Pattern), Bullets/Numbered Lists, Jump Links/TOC, Above-the-Fold.

#### Internal & External Linking
Contextual Internal Links, Anchor Text (Exact/Partial/Generic/Branded), Link Equity Distribution, Outbound Authority Links.

#### Image & Media
Alt Text (descriptive/keyword-aware/accessibility), Image File Names (dash-sep, KW-rich), Captions & Surrounding Text, Video Embed Context & Transcripts.

### Blog mandate

> Doing research in Reddit questions, Quora, YouTube, Google blog posts, and we create content from content by taking a question in Reddit for example and answering it in a comprehensive blog post... When we have the content we want cloud to decide which of the formulas is best for us to use [10 formulas listed above]... cloud is going to go for data for SEO MCP. Using this MCP, it is going to do a cluster of keywords for our article and decide to use them. We need, of course, to use at least eight keywords, but they need to be low competition, medium intent... we must insert our product links, not master image but a link.

### Most important rules (verbatim)

- **18 blog posts per month.**
- **Topical focus is mandatory.** Off-topic volume is penalized.
- **EEAT matters.**
- Modern volume — researched expert-level articles outperform 10 shallow ones.
- After research+framework+content extract → use **PubMed** or **Apify** to scrape highly informative info. **Our mission is to help.**
- Each article: **2,000–6,550 words** at least about our keywords.
- Tone: **informational + light-mooded mix.**
- HTML: omit body/H1 at top. Use **eye-catching, fault-provoking, interrogating title** based on dramatic story.
- **No "unlock" / "unlocking"** in title.
- 8–10 unique interesting headings.
- Optimistic + funny intro paragraph containing main keyword.
- Informative + impressive samurai outro paragraph.
- **No keyword spam.**
- Active tone for young audience. Real value.
- Forbidden phrases: "forbidden", "not highly informative", "non-values".
- External nofollow links to Wikipedia / YouTube.
- YouTube: embed video itself, not just link.
- Product mentions = helpful resources, not sales pitches.
- Formatting: bullets, comparison tables, white space.
- 2,000 to 6,550 words.
- No H1 in headings or intro.


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
