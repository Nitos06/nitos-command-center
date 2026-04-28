---
name: ads-multi-platform
description: Non-Meta paid ads bundle. Wraps Aviv's Google/TikTok/YouTube/Microsoft/Apple/LinkedIn skills. Same 3-2-2 + 1.5× BE rules as ads-meta carry over. Reads same campaign-brief.json, splits by platform, pushes per-platform spec. Daily audit folds into ads-meta dashboard.
trigger:
  scheduled: "0 9 * * * Asia/Jerusalem"
  event: "campaign-brief.json arrived"
  manual: "/ads {google|tiktok|youtube|linkedin|microsoft|apple} audit"
mcp_dependencies:
  required:
    - supabase
  optional:
    - google-ads
    - tiktok-ads
    - linkedin-ads
    - microsoft-ads
    - apple-search-ads
    - playwright
inputs:
  - state/ads-meta/audit-report.json
  - state/branding/copy-assets.json
  - {campaign-brief.json}
outputs:
  - state/ads-multi-platform/{platform}/audits/{date}.json
  - state/ads-multi-platform/{platform}/published.json
references:
  - ../../skills/_aviv/ads-google/SKILL.md
  - ../../skills/_aviv/ads-tiktok/SKILL.md
  - ../../skills/_aviv/ads-youtube/SKILL.md
  - ../../skills/_aviv/ads-microsoft/SKILL.md
  - ../../skills/_aviv/ads-apple/SKILL.md
  - ../../skills/_aviv/ads-linkedin/SKILL.md
  - ../ads-meta/references/my-3-2-2-playbook.md
  - ../ads-meta/references/my-meta-thresholds.md
self_heal: skills/_lib/self-heal.md
---

# Ads Multi-Platform Agent

Non-Meta routing. Same owner ops rules apply (3-2-2, 1.5× BE, S.C.E creatives).

## Process

### Phase 1 — Platform router
Read `campaign-brief.json` → for each platform in `concepts[].platforms`:
- `google_search` → delegate to `_aviv/ads-google`
- `youtube` → `_aviv/ads-youtube` (creative spec differs from Meta — needs longer cuts)
- `tiktok` → `_aviv/ads-tiktok`
- `linkedin` → `_aviv/ads-linkedin` (B2B angle from brief)
- `microsoft` (Bing) → `_aviv/ads-microsoft`
- `apple_search` → `_aviv/ads-apple` (iOS app context only)

### Phase 2 — Daily audits
Per active platform, pull last-7d insights via platform MCP, run owner thresholds (Hook Rate/CTR/CPA/ROAS), apply 1.5× BE rule. Output per-platform `audit-report.json`.

### Phase 3 — Cross-platform dashboard
Merge into `ads-meta` dashboard via Supabase `cross_platform_kpis`. Owner sees one view.

### Phase 4 — Reallocation suggestions
If a platform's ROAS > 1.3× another's for 7+ days → suggest budget shift (manual approve).

## Output contract
```
🎯 Multi-Platform — {date}
Google: 4 campaigns · ROAS 2.4 · 1 winner queued for scale
TikTok: 6 ads · ROAS 1.8 · 2 fatigue alerts
YouTube: 2 hero videos · CPV $0.04 · steady
LinkedIn: paused (ROAS 0.6)
Suggested shift: +$200/d Google ← TikTok
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
