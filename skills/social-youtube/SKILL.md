---
name: social-youtube
description: YouTube Shorts + UGC video agent. 3 production paths daily — Path 1 (Submagic Shorts extraction from owner long-form) most common, Path 2 (niche scrape + higgsfield-image remix), Path 3 (UGC from Telegram drop, edit + CTA card, publish as regular video). Daily run: 1 short + optional UGC. Plus daily channel check. Onboarding via youtube-init (one-time).
trigger:
  scheduled: "0 11 * * * Asia/Jerusalem"   # daily 11:00 — pipeline run + channel check
  event: "video-brief.json arrived"
  manual: "/youtube {audit|research|script|thumbnail|publish|extract|scrape}"
mcp_dependencies:
  required:
    - youtube-data        # YouTube Data API for upload + analytics
    - playwright          # Submagic + higgsfield-image
    - supabase
  optional:
    - higgsfield-image    # image + video gen for path 2
    - submagic
inputs:
  - state/branding/brand-strategy-blueprint.json
  - state/market-research/customer-avatar.json
  - state/branding/copy-assets.json
  - state/social-youtube/long-form/        # owner's long-form drop folder for Path 1
  - state/social-instagram/founder-ugc/    # shared UGC pool for Path 3
outputs:
  - state/social-youtube/audits/{date}.json
  - state/social-youtube/shorts/{slug}/
  - state/social-youtube/videos/{slug}/
  - state/social-youtube/scripts/{slug}.md
  - state/social-youtube/thumbnails/{slug}/
  - state/social-youtube/published.json
  - state/social-youtube/latest.json
  - state/social-youtube/latest-status.json
references:
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-init/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-audit/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-analysis/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-research/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-script/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-title/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-thumbnail/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-description/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-preview/SKILL.md
  - ../../skills/_external/youtube-assistant/.claude/skills/youtube-presentation/SKILL.md
aviv_refs:
  - ../../skills/_aviv/youtube-ideas/SKILL.md
  - ../../skills/_aviv/video-creator/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Social YouTube Agent

Daily 11:00 IL. 3 production paths. Always pick path based on input availability.

## Path 1 — Submagic Shorts extraction (most common)

1. Scan `state/social-youtube/long-form/` for unprocessed videos (owner drops here)
2. Submit each to Submagic API (or Playwright wrapper) — "extract key points → short clips"
3. Submagic returns 3–5 short candidates per long video
4. Score each (hook strength, retention prediction, brand fit) — this Claude session self-scores
5. Top 1–2 → final edit pass + caption overlay (brand font/color)
6. Brand-anchor check (value prop in first 3s OR last 3s)
7. Schedule via YouTube Data API
8. Persist `state/social-youtube/shorts/{slug}/`

## Path 2 — Niche scrape + tweak

1. Scrape top YT Shorts in niche via YouTube Data API (search by KW, sort views, last 7d)
2. Pull transcripts → analyze hook structure
3. Build similar-but-better short with brand twist using `higgsfield-image` (GPT-image 2.0 + Seedance 2.0 routes)
4. Submagic captions
5. Brand-anchor check
6. Publish

## Path 3 — UGC product video (regular YT, not Short)

1. Owner uploads product UGC to Telegram drop folder (caught by `finance-il` Job D, tagged `#ugc` → routed to `state/social-instagram/founder-ugc/`)
2. Auto-edit via Submagic for captions/audio/SFX
3. Add product CTA card at end (last 5s)
4. Title/description/tags from `_aviv/youtube-ideas` SEO playbook
5. Publish as regular video (not Short)
6. Persist `state/social-youtube/videos/{slug}/`

## Daily run rule

- 1 short (Path 1 if long-form available, else Path 2) — every day
- Optional 1 regular UGC (Path 3) — only if folder has new content

## Daily channel check (within same 11:00 run)

1. Pull last 24h via YouTube Data API (subs, views, watch-time, CTR per video)
2. Compute deltas vs 7-day avg
3. Flag winners (>2× avg views) + losers (<0.5×)
4. Loser thumbnail/title → queue regenerate (re-run Path 2 with stronger hook)

## Onboarding (`/youtube init` — one-time)

Run `_external/youtube-assistant/youtube-init` to set up channel CLAUDE.md, audit baseline, brand-style anchors. After init, daily pipeline takes over.

## Owner-brand overlay (every output)

- Tone of voice from `brand-strategy-blueprint.json`
- Forbidden words (`branding/references/my-brand-guardrails.md`)
- Thumbnail style: anti-corporate, raw, film-grain (per "No Copycats")
- Title formula: per `_aviv/youtube-ideas` (curiosity gap + power word)
- Brand font + color on captions (Submagic config preset per brand)

## Dashboard contract

`state/social-youtube/latest-status.json`:
```json
{
  "status": "ok",
  "headline": "1 short scheduled (Path 1 — extracted from long-form #42) · 47k subs (+312 wk)",
  "kpis": {"subs": 47000, "weekly_videos": 7, "avg_views_7d": 8200, "avg_ctr": 0.062},
  "next_run": "2026-04-28T11:00:00Z",
  "alerts": []
}
```

## Daily digest

```
📺 YouTube — {date}
Path used: Path 1 (Submagic extracted 4 candidates from long-form #42, picked top 2)
Posted: 1 short + 1 UGC video
Last 7d: 7 videos | avg 8.2k views | CTR 6.2%
Winner: "{title}" (24k views, CTR 9.2%)
Loser: "{title}" (1.1k views, CTR 2.8%) → regen via Path 2 queued
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
