---
name: social-tiktok
description: Daily TikTok content agent. Strategy = scrape niche-trending TikToks → model 1-2 → remix with higgsfield-image (Seedance 2.0 route) or fresh footage via screen-demo or founder UGC → Submagic edit → brand-anchor check → schedule via tiktok-content for IL prime hours (19:00–22:00). Always anchored to brand-strategy-blueprint. 1–2 posts/day = 7–14/week. Distinct from ads-multi-platform (TikTok ads).
trigger:
  scheduled: "0 10 * * * Asia/Jerusalem"
  manual: "/tiktok {scrape|publish|test}"
mcp_dependencies:
  required:
    - tiktok-content
    - apify
    - playwright           # higgsfield-image, Submagic
    - supabase
  optional:
    - higgsfield-image
    - submagic
inputs:
  - state/branding/brand-strategy-blueprint.json
  - state/branding/copy-assets.json
  - state/social-instagram/founder-ugc/         # shared founder UGC pool from finance-il Telegram poll
  - state/avatar-builder/avatars.json
outputs:
  - state/social-tiktok/posts/{slug}/
  - state/social-tiktok/scrape-pool/{date}.json
  - state/social-tiktok/latest.json
  - state/social-tiktok/latest-status.json
references:
  - references/my-tiktok-strategy.md
aviv_refs:
  - ../../skills/_aviv/ads-tiktok/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Social TikTok Agent

Daily 10:00 IL. **Content** agent — separate from `ads-multi-platform` (which handles TikTok paid ads).

## Process

### Phase 1 — Scrape niche-trending TikToks

`apify/tiktok-scraper` — top 20 videos from last 48h in brand niche hashtags. Filter:
- Views > 50k
- Engagement rate > 5%

Persist `state/social-tiktok/scrape-pool/{date}.json`.

### Phase 2 — Pick 1–2 to model

Decision tree:
- **Product-shot trend** → run `screen-demo` with `style: product-shot` for fresh footage
- **Lifestyle/niche edit** (football, fitness, etc.) → scrape + remix with `higgsfield-image` (Seedance 2.0 route — replace shots, sync new audio, change hooks)
- **Founder POV** → use `state/social-instagram/founder-ugc/` pool

### Phase 3 — Edit (higgsfield-image + Submagic via Playwright)

- Apply trending audio (verify rights — TikTok library check)
- Captions in brand font/color
- Hard cuts on hook beats
- 9:16 vertical, 15–60s

### Phase 4 — Brand-anchor check (this Claude session)

Must reference brand value prop in **first 3s OR last 3s**. Fail → regenerate (max 2 retries). Brand voice + forbidden-words check from `state/branding/brand-strategy-blueprint.json`.

### Phase 5 — Caption + hashtags

- Short, scroll-friendly
- 3–5 niche hashtags + 2 trending
- Brand-tone overlay

### Phase 6 — Schedule via `tiktok-content`

Native TikTok Content Posting API. Prime IL TikTok hours: **19:00–22:00**.

### Phase 7 — Persist + dashboard

`state/social-tiktok/posts/{slug}/` (source video, edited video, caption, scheduled_at, brand_anchor_score). Push status to `dashboard-bridge`.

## Dashboard contract

`state/social-tiktok/latest-status.json`:
```json
{
  "status": "ok",
  "headline": "1 TT scheduled — niche-edit (footy) · brand-anchor 9/10",
  "kpis": {"posts_this_week": 8, "avg_views": 124000, "engagement_rate": 0.071},
  "next_run": "2026-04-28T10:00:00Z",
  "alerts": []
}
```

## Daily digest

```
🎵 TikTok — {date}
Scraped: 20 niche videos · Picked 2 to model
Posted: 1 · Scheduled: 1 (19:30 IL)
Brand-anchor: 9.2/10 avg
Last 7d: 8 posts · 124k avg views · 7.1% ER
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
