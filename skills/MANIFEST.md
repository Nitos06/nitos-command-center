# Skills Manifest (v3)

Single index of every skill in `paidads/skills/`. Source of truth for the cron registrar.

## Routine agents (cron-fired) — 16 total

| # | Skill | Schedule (Asia/Jerusalem) | Notes |
|---|---|---|---|
| 1 | `finance-il` | mixed: `0 4 * * *` + `0 8 * * *` + `0 6 1 * *` + `*/15 * * * *` | 4 sub-jobs: daily reconcile + profit-watch, monthly invoices+BL deposits, 15-min Telegram poll |
| 2 | `seo` | `0 2 */5 * *` + `0 6 * * 1,3,5,0` | every 5d audit (aggressive autofix) + 4×/week blog (18/mo) |
| 3 | `email-marketing` | `0 7 * * 1` + monthly + nightly | Amazon SES 4-flow + monthly micro-ideas + weekly campaigns + nightly deliverability |
| 4 | `meta-ads` | `0 9 * * *` | full autonomy: insights → scale/kill/regen → CBO/ABO create → upload |
| 5 | `ads-multi-platform` | `0 9 * * *` | TikTok/Google/YT/LinkedIn/Microsoft/Apple ads |
| 6 | `ads-competitor` | `0 4 * * 0` | weekly Sun scrape via Apify |
| 7 | `analytics` | `0 7 * * *` | blended ROAS + GA4 + Clarity |
| 8 | `advisory` | `0 8 * * 0` | weekly strategic review |
| 9 | `social-instagram` | `0 6 * * 0` + `0 8 * * *` + `0 14 * * *` | 3 sub-jobs: weekly calendar + daily post + stories |
| 10 | `social-tiktok` | `0 10 * * *` | scrape + remix + post 1–2/day |
| 11 | `social-youtube` | `0 11 * * *` | Submagic Shorts extraction + UGC paths |
| 12 | `social-pinterest` | `0 12 * * *` | bulk 30–50 pins/day |
| 13 | `customer-service` | `*/30 9-22 * * *` | every 30 min, 09:00–22:00 only (human-like) |
| 14 | `dm-funnel` | event + `0 1 * * *` nightly stats | Superprofile-driven (DM automation + link-in-bio) |
| 15 | `hook-mining` | `0 11 * * *` | daily hook library refresh |
| 16 | `dashboard-bridge` | `*/5 * * * *` | every 5 min — aggregates all agent state for IU |
| 17 | `social-facebook` | `0 11 * * *` + `0 17 * * *` | daily post (11:00) + comment replies (17:00) |
| 18 | `reviews` | `0 6 * * *` + event `shopify.order.fulfilled` | daily UGC scan + quality scoring + review request emails (3d after fulfillment) |

## Event-fired (also have manual triggers)

| Skill | Event |
|---|---|
| `screen-demo` | `demo-brief.json` arrived |
| `social-youtube` | `video-brief.json` arrived |
| `social-instagram` | `ig-brief.json` arrived |
| `copy-website` | `copy-request.json` arrived |
| `email-marketing` | brand-onboarding (one-time flow setup) |
| `dm-funnel` | new Superprofile campaign trigger |

## Manual / on-demand

| Skill | Trigger |
|---|---|
| `brand-creator` | `/brand-creator start {brand_slug}` (orchestrates Doc 1 chain — auto-runs market-research → branding → avatar-builder → website-builder with 4 owner gates) |
| `market-research` | `/research start {product}` (also runs as Phase 1 of brand-creator) |
| `branding` | once-per-brand (also runs as Phase 2 of brand-creator) |
| `website-builder` | `/build site {brand}` (also runs as Phase 4 of brand-creator) |
| `avatar-builder` | once-per-brand-model (also runs as Phase 3 of brand-creator) |
| `screen-demo` | `/screen demo {url} {script}` |
| `social-youtube` | `/youtube {audit\|research\|script\|thumbnail\|publish\|extract\|scrape}` |
| `social-instagram` | `/ig {audit\|reel\|carousel\|plan\|dm\|calendar}` |
| `social-tiktok` | `/tiktok {scrape\|remix\|publish}` |
| `social-pinterest` | `/pinterest {bulk\|variants}` |
| `customer-service` | `/cx {triage\|reply\|escalate}` |
| `dm-funnel` | `/dm-funnel setup {campaign}` |
| `copy-website` | `/copy {url}` |
| `ads-multi-platform` | `/ads {google\|tiktok\|youtube\|linkedin\|microsoft\|apple} audit` |
| `meta-ads` | `/meta {audit\|scale\|regen\|create-campaign}` |
| `seo` | `/seo {audit\|blog\|kw}` |
| `email-marketing` | `/email {flow\|campaign\|seg}` |
| `finance-il` | `/finance {reconcile\|invoice\|deposit\|expenses}` |
| `lead-scraping` | `/leads {industry} {region}` |
| `analytics` | `/analytics {today\|7d\|30d}` |
| `advisory` | `/advise {question}` |
| `dashboard-bridge` | `/dashboard refresh` |
| `quiz-strategy` | `/quiz {build|audit|questions|email-gate|recommend|distribute}` |
| `quiz-email-flows` | `/quiz-email {setup|segment|results-flow|welcome|replenishment}` |
| `quiz-recommendations` | `/quiz-rec {map|test|bundle|tier}` |
| `mjml-email` | `/mjml {quiz-results|welcome|review-request|abandoned-cart|campaign|compile}` |
| `affiliate-strategy` | `/affiliate {setup|recruit|commission|audit|agreement|customers|launch-checklist}` |
| `affiliate-setup` | `/affiliate-setup {phase1|phase2|phase3|launch|monitor}` |

## Dependency graph (chain-contract via `state/{skill}/`)

```
brand onboarding (half-manual):
  market-research → branding → avatar-builder → website-builder

paid-ads loop:
  meta-ads (audit→scale→kill→regen→upload) ←→ ads-competitor (weekly)
  ads-multi-platform (TT/G/YT/LI/MS/Apple)
  hook-mining (daily) ──→ feeds meta-ads creative regen

content loop:
  seo (5d audit + 4×/wk blog) → shopify
  email-marketing (Mailjet 4-flow + weekly campaigns)
  social-instagram (15/wk + 8 stories) ←→ dm-funnel (Superprofile)
  social-tiktok (1–2/day)
  social-youtube (Shorts + UGC)
  social-pinterest (30–50 pins/day)

ops loop:
  finance-il (daily + monthly + Telegram poll)
  customer-service (every 30 min, 09:00–22:00)
  analytics (daily blended)
  advisory (weekly strategic review)

dashboard:
  dashboard-bridge (every 5 min) ← reads every agent's latest-status.json
                                 → state/dashboard/{feed,timeline,alerts,health}.json
                                 → Supabase agent_kpi_history + agent_decisions
                                 → IU dashboard (Next.js in paidads/app/) reads

quiz pipeline:
  quiz-strategy (build) → quiz-recommendations (match) → quiz-email-flows (nurture)
  quiz-email-flows ──→ email-marketing (SES delivery via /api/quiz/submit)

affiliate pipeline:
  affiliate-setup (launch) → affiliate-strategy (ongoing management)
  affiliate-strategy ──→ email-marketing (affiliate invite flows)
```

## Cross-Telegram routing (finance-il Job D)

Telegram drop folder is shared inbox. `finance-il` 15-min poll classifies by tag:
- `#receipt` (default if image+text) → `state/finance-il/inbox/receipts/`
- `#ugc` → `state/social-instagram/founder-ugc/` (consumed by social-instagram + social-youtube)
- `#product` → `state/social-pinterest/founder-product/`

## Aviv baseline (115 skills staged in `_aviv/`)

See `_aviv/README.md` for the full mapping. Every wrapper has an `aviv_refs:` frontmatter array pointing to relevant Aviv skills as **tactical baseline** — owner's `my-*.md` always wins.

## File structure convention

```
skills/{name}/
  SKILL.md                       # frontmatter + Process + verbatim playbook
  references/
    my-*.md                      # owner's bible (verbatim from docs)
    benchmarks.md (optional)     # Aviv baseline if applicable

skills/_external/{name}/         # untouched external skills (called as tools)
skills/_aviv/{name}/             # Aviv baseline library (115 skills, untouched)
skills/_lib/                     # shared contracts (self-heal, chain-contract)
```

## State files (chain-contract)

Every skill writes to `state/{skill-name}/`. Two files are MANDATORY for IU dashboard:
- `latest.json` — full output of last run
- `latest-status.json` — `{status, headline, kpis, next_run, alerts[]}` summary

Plus `agent_decisions` row inserts for every action with reasoning. See `_lib/chain-contract.md`.

## Override hierarchy (canonical)

1. **Owner's `my-*.md`** files in each skill's `references/` — beats everything
2. **`Owner's playbook (verbatim)`** section inside each `SKILL.md`
3. Wrapper's own Process phases
4. **Aviv baseline** in `skills/_aviv/{name}/`
5. **External skills** in `skills/_external/` — last word, only when nothing above covers it

When in doubt: owner's word wins.
