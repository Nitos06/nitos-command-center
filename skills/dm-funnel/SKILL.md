---
name: dm-funnel
description: Superprofile-powered IG comment→DM→email→product funnel + link-in-bio. One-time setup per brand per campaign — keyword(s) trigger 3-step DM sequence (DM 1 instant hook+freebie, DM 2 24h qualifier, DM 3 48h product CTA), email capture wires to Mailjet contact list with tag. Superprofile also serves as link-in-bio. Nightly stats check — flag any step <30% conversion to advisory for tweak.
trigger:
  event: "campaign-launched"          # owner triggers /dm-funnel setup {campaign}
  scheduled: "0 1 * * * Asia/Jerusalem"   # nightly stats roll-up
  manual: "/dm-funnel {setup|stats|tweak} {campaign}"
mcp_dependencies:
  required:
    - instagram-graph    # interim DM send (24h conversation window) until Superprofile-clone ships
    - mailjet
    - supabase
  optional:
    - superprofile-clone # owner is building in-house — wire when ready
    - heygen-hyperframes # role TBD (see open question)
status: degraded-until-superprofile-clone-ready  # IG Graph DM works, but no automated comment-keyword trigger until clone ships
inputs:
  - state/branding/copy-assets.json
  - state/social-instagram/calendar/{week}.json   # which posts run funnels
  - state/branding/brand-strategy-blueprint.json
outputs:
  - state/dm-funnel/campaigns/{slug}.json
  - state/dm-funnel/stats/{date}.json
  - state/dm-funnel/latest.json
  - state/dm-funnel/latest-status.json
references:
  - references/my-superprofile-flows.md
  - ../social-instagram/references/my-camila-prompts.md   # Camila Prompt 8 = 3-part DM sequence
aviv_refs: []
self_heal: skills/_lib/self-heal.md
---

# DM Funnel Agent

Comment on a post → auto-reply → user enters email → deliver value + product link.

## Setup flow (one-time per campaign)

### Phase S.1 — Connect Superprofile
Already wired at brand-onboarding: Superprofile is connected to IG (DM automation + link-in-bio) and Mailjet (email capture). Superprofile MCP handles both DM automation and link-in-bio in one tool.

### Phase S.2 — Build funnel per campaign

For each campaign requested via `/dm-funnel setup {campaign}`:

1. **Define keyword(s)** that trigger the flow (e.g., "GUIDE", "INFO", "YES")
2. **Build 3-step DM sequence** per Camila Markson Prompt 8:
   - **DM 1 (instant)**: hook + freebie/link request
   - **DM 2 (24h)**: qualifying question
   - **DM 3 (48h)**: product CTA
3. **Wire email capture** → Mailjet contact list with tag `from-ig-funnel-{campaign}`
4. **Persist** `state/dm-funnel/campaigns/{slug}.json`:
   ```json
   {
     "campaign": "spring-guide",
     "keywords": ["GUIDE", "YES"],
     "post_id": "ig_post_xxx",
     "dm_1": "...",
     "dm_2": "...",
     "dm_3": "...",
     "mailjet_list_tag": "from-ig-funnel-spring-guide",
     "freebie_url": "https://{brand}.com/spring-guide.pdf",
     "product_cta_url": "https://{brand}.com/products/spring-set",
     "deployed_at": "..."
   }
   ```
5. **Deploy via Superprofile API** (also updates link-in-bio entry if `attach_to_bio: true`)

### Phase S.3 — Hand to social-instagram
The triggering post (carousel/reel/static) on IG must reference the keyword in caption + comment-pinned reply. `social-instagram` reads `state/dm-funnel/campaigns/{slug}.json` and bakes keyword into next scheduled post if `attach_funnel: true`.

## Nightly stats job (01:00 IL)

### Phase N.1 — Pull last 24h Superprofile funnel stats per campaign

### Phase N.2 — Compute conversion rates per step
- comments → DM 1 open rate
- DM 1 → email rate
- email → click rate
- click → purchase rate (cross-ref Shopify)

### Phase N.3 — Flag underperformers
Any step <30% → flag for `advisory` to recommend tweak. Write to `state/dm-funnel/stats/{date}.json` + push alert.

### Phase N.4 — Persist + dashboard

## Dashboard contract

```json
{
  "status": "ok",
  "headline": "3 active campaigns · 142 emails captured this week · best 47% C→DM",
  "kpis": {"campaigns_active": 3, "emails_captured_7d": 142, "best_conversion_pct": 0.47, "purchases_attributed_7d": 8},
  "next_run": "2026-04-28T01:00:00Z",
  "alerts": ["spring-guide DM2→email 24% (below 30% gate)"]
}
```

## Daily digest

```
🪝 DM Funnel — {date}
Active campaigns: 3 (spring-guide, niche-quiz, ugc-loop)
Last 24h: 38 comments → 31 DM1 opens (82%) → 18 emails (58%) → 7 clicks (39%) → 2 purchases
Underperformer flagged: spring-guide DM2→email 24% (advisory queued)
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
