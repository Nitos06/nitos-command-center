---
name: social-instagram
description: Full IG cadence engine — 14–15 posts/week (60–70% carousels, ~20% reels, ~20% static) + 8 stories/week. Three sub-jobs — Sun 06:00 weekly calendar build (Apify competitor scrape + Camila pain/avatar prompts → 15 calendar slots), daily 08:00 post creation+publish (carousel/reel/static decision tree → instagram-graph schedule), daily 14:00 stories batch. Superprofile DM funnel handoff. Brand-tone + forbidden-words overlay on every output. Distinct from `dm-funnel` (separate agent for funnel mechanics).
trigger:
  scheduled:
    - "0 6 * * 0 Asia/Jerusalem"        # Sun 06:00 — weekly calendar
    - "0 8 * * * Asia/Jerusalem"        # daily 08:00 — post creation+publish
    - "0 14 * * * Asia/Jerusalem"       # daily 14:00 — stories batch
  event: "ig-brief.json arrived"
  manual: "/ig {audit|reel|carousel|plan|dm|calendar}"
mcp_dependencies:
  required:
    - instagram-graph
    - apify
    - playwright
    - supabase
  optional:
    - higgsfield-image
    - submagic
inputs:
  - state/branding/brand-strategy-blueprint.json
  - state/branding/copy-assets.json
  - state/market-research/customer-avatar.json
  - state/market-research/silent-frustration.md
  - state/ads-competitor/{week}/matrix.json
  - state/social-instagram/founder-ugc/      # Telegram drop folder from finance-il
outputs:
  - state/social-instagram/calendar/{week}.json
  - state/social-instagram/posts/{slug}/
  - state/social-instagram/stories/{date}.json
  - state/social-instagram/audits/{date}.json
  - state/social-instagram/published.json
  - state/social-instagram/latest.json
  - state/social-instagram/latest-status.json
references:
  - references/my-camila-prompts.md
  - references/my-15-post-cadence.md
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-audit
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-analysis
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-reel-script
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-thumbnail
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-carousel-preview
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-thread-carousel
  - ../../skills/_external/instagram-skills/.claude/skills/instagram-caption
  - ../../skills/_external/handdrawn-carousel/SKILL.md
  - ../../skills/_external/graphics-carousel/SKILL.md
aviv_refs:
  - ../../skills/_aviv/carousel-aviv-king/SKILL.md
  - ../../skills/_aviv/carousel-machine2/SKILL.md
  - ../../skills/_aviv/carousel-machine-english/SKILL.md
  - ../../skills/_aviv/social-content/SKILL.md
  - ../../skills/_aviv/social/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Social Instagram Agent

Three sub-jobs. Builds a full 14–15-post-per-week machine.

## Cadence target

| Format | Count | % |
|---|---|---|
| Carousels | 9–10 | 60–70% |
| Reels | 3 | ~20% |
| Static | 3 | ~20% |
| Stories | 8 | (separate from feed count) |

## Sub-job A — Weekly content calendar (Sun 06:00)

### A.1 Competitor scrape
1. Read `state/ads-competitor/{week}/matrix.json` — qualified competitors
2. For each, scrape last 30d IG content via Apify `apify/instagram-scraper`. Pull: caption, hashtags, format, engagement (saves/comments/likes/views), timestamp
3. Score each competitor post: `saves × 3 + comments × 2 + likes`, weighted by reach. Saves = strongest brand-affinity signal.

### A.2 Pain/problem mining (Camila Prompt 6 + Prompt 2)
1. Run **Camila Prompt 6** (Hormozi starving-crowd) with this week's avatar refresh
2. Run **Camila Prompt 2** (pain → 10-word hook) on top 10 pain points from `state/market-research/silent-frustration.md`
3. Output: 12–15 raw "real value" content seeds with scroll-stopping hooks

### A.3 Build calendar (15 slots/week)
1. Allocate: 9 carousels + 3 reels + 3 static = 15 posts (2/day except 1 light day)
2. Stories: 8 across week (BTS / polls / product use / customer DM screenshots / story-takeover from founder)
3. Map each slot to a specific seed:
   - Carousel = info-dense seed
   - Reel = trend or product-shot
   - Static = quote / proof / before-after
4. Persist `state/social-instagram/calendar/{week}.json`

## Sub-job B — Daily post creation + publish (daily 08:00)

For each post scheduled today:

### B.1 If carousel:
1. Read seed + slot's calendar entry
2. Source data: Reddit / Quora / blog refs (same sourcing as `seo` blog mode)
3. Generate carousel via `_external/instagram-skills/instagram-carousel-preview` + `_aviv/carousel-aviv-king` + `_external/handdrawn-carousel` or `_external/graphics-carousel` (pick style per slot)
4. **Caption** via `_external/instagram-skills/instagram-caption` OR Camila Prompt 4 (social proof) OR Camila Prompt 5 (saves-bait)
5. Brand-tone overlay + forbidden-words check (from `state/branding/brand-strategy-blueprint.json`)
6. **Schedule** via `instagram-graph` for next free 11:00 / 17:00 slot
7. Persist `state/social-instagram/posts/{slug}/`
8. Queue carousel slides to `pinterest_asset_queue`

### B.2 If reel:
Pick path:
- **Option A (most common):** scrape competitor reel via Apify → download → tweak via `higgsfield-image` (replace clips, change pacing, swap captions) → re-render
- **Option B:** product-shot — call `screen-demo` with `style: product-shot` for clean B-roll
- **Option C:** founder UGC — pull from `state/social-instagram/founder-ugc/` (Telegram drop folder); apply Submagic captions + brand overlay

Then:
1. Brand consistency check (color palette + forbidden words)
2. Caption per Camila Prompt 3 (30-sec script tone)
3. Schedule via `instagram-graph`

### B.3 If static:
1. Source: existing brand asset library OR generate via `higgsfield-image` (GPT-image 2.0 route) with avatar reference
2. Quote / proof / before-after layout via `_external/graphics-carousel` (single-slide mode)
3. Caption: 1–3 lines + 5 hashtags
4. Schedule via `instagram-graph`
5. Queue to `pinterest_asset_queue`

## Sub-job C — Stories (daily 14:00)

1. Pull today's pre-defined story brief from calendar (BTS / poll / proof / etc)
2. Auto-compose 1–2 stories per day from seed + asset library
3. Schedule via `instagram-graph` stories endpoint
4. Persist `state/social-instagram/stories/{date}.json`

## Sub-job D — DM funnel handoff

When a calendar post has `attach_funnel: true` → write campaign-spec to `state/dm-funnel/campaigns/{slug}.json` for the `dm-funnel` agent to deploy via Superprofile. (Funnel mechanics live in `dm-funnel`, not here.)

## Owner-brand overlay (every output)

- Tone of voice from `brand-strategy-blueprint.json` (Tone of Voice section)
- Forbidden words list (from `branding/references/my-brand-guardrails.md`) checked on every caption + script + DM before publish
- Visual style: anti-corporate, raw (per "No Copycats" guardrail)
- Hormozi starving-crowd avatar (Camila Prompt 6) result = audience anchor for every output

## Camila Markson prompt library

See `references/my-camila-prompts.md` — 8 prompts verbatim:
1. Viral content (10 trends → 5 ideas)
2. Pain → 10-word Reels hook
3. 30-sec Reels script
4. Social proof short phrases
5. Saves-bait practical tips
6. Hormozi starving-crowd avatar
7. 14-day content plan
8. 3-part DM sequence (consumed by `dm-funnel`)

## Dashboard contract

`state/social-instagram/latest-status.json`:
```json
{
  "status": "ok",
  "headline": "2 posts scheduled today (1 carousel, 1 reel) · 18.4k followers (+127 wk)",
  "kpis": {"followers": 18400, "weekly_posts": 14, "weekly_stories": 8, "avg_reach": 4200, "avg_saves": 87},
  "next_run": "2026-04-28T08:00:00Z",
  "alerts": []
}
```

## Daily digest

```
📷 Instagram — {date}
Calendar (week W18): 15 slots filled
Today: 2 posts scheduled (carousel 11:00, reel 17:00) · 1 story batch (14:00)
Last 7d: 14 posts | avg 4.2k reach | 87 saves avg
Winner: "{caption}" (12k reach, 340 saves) → repurpose queued
Loser: "{caption}" (1.8k reach, 11 saves) → archive
DM funnels active: 2 (spring-guide, niche-quiz)
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
