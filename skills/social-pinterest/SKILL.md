---
name: social-pinterest
description: Daily Pinterest bulk uploader. Owner mandate "more the better." Pulls asset queue (every higgsfield-image generation, every product photo, every Submagic still grab gets queued by other agents) → generates 5 variants per asset (original / 2:3 crop / brand overlay / CTA badge / seasonal frame) → DataForSEO long-tail KW for title+description (Pinterest SEO is real) → bulk uploads 30–50 pins/day to brand boards.
trigger:
  scheduled: "0 12 * * * Asia/Jerusalem"
  manual: "/pinterest {bulk|setup-boards}"
mcp_dependencies:
  required:
    - pinterest             # Pinterest API
    - dataforseo
    - supabase
  optional:
    - playwright            # higgsfield-image for variants
    - higgsfield-image
inputs:
  - pinterest_asset_queue   # Supabase table populated by other agents
  - state/branding/brand-strategy-blueprint.json
  - state/branding/copy-assets.json
outputs:
  - state/social-pinterest/uploads/{date}.json
  - state/social-pinterest/board-map.json
  - state/social-pinterest/latest.json
  - state/social-pinterest/latest-status.json
references:
  - references/my-pinterest-bulk-rules.md
aviv_refs: []
self_heal: skills/_lib/self-heal.md
---

# Social Pinterest Agent

Daily 12:00 IL. Bulk + variants — Pinterest rewards volume.

## Process

### Phase 1 — Pull asset queue

Read `pinterest_asset_queue` from Supabase. Populated by:
- `meta-ads` (higgsfield-image generations)
- `social-instagram` (carousel slides, static posts)
- `seo` (blog hero images)
- `ads-generate` (product shots, scenes)
- `screen-demo` (frame grabs)

### Phase 2 — Generate 5 variants per asset

1. **Original** (as queued)
2. **Cropped 2:3** (Pinterest standard)
3. **Brand overlay text** — 3 variants of headline (higgsfield-image / Photoshop-via-Playwright)
4. **Product price/CTA badge**
5. **Seasonal frame** (if seasonal context applies)

### Phase 3 — Auto-title + description (DataForSEO)

Pinterest SEO is real. For each pin:
- Long-tail KW in title (DataForSEO `keywords_for_keywords` on brand niche)
- Description: 2–3 sentences naturally including KW + 5 hashtags
- Brand-voice overlay from `state/branding/brand-strategy-blueprint.json`

### Phase 4 — Categorize to brand boards

Read `board-map.json` (set up at brand-onboarding). Pin to relevant board(s) — every pin goes to ≥1 board.

### Phase 5 — Bulk upload

Pinterest API. Target **30–50 pins/day**. Throttle if rate-limited (exp backoff).

### Phase 6 — Persist + dashboard

`state/social-pinterest/uploads/{date}.json`. Update `pinterest_asset_queue` rows to `uploaded`. Push status.

## Dashboard contract

```json
{
  "status": "ok",
  "headline": "42 pins uploaded · 8 boards · top KW 'minimalist nightstand'",
  "kpis": {"pins_today": 42, "pins_mtd": 1280, "monthly_impressions": 240000},
  "next_run": "2026-04-28T12:00:00Z",
  "alerts": []
}
```

## Daily digest

```
📌 Pinterest — {date}
Queue size: 12 source assets → 60 pins generated
Uploaded: 42 · Failed: 0 · Throttled: 0
Top board: "Living Room Inspo" (15 pins)
KW gap discovered: 4 (queued to seo topic-plan)
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
