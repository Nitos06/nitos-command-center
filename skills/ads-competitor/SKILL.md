---
name: ads-competitor
description: 3-prompt competitor recon. Prompt 1 = identify 3 direct + 3 indirect + 3 aspirational competitors with full attribute matrix. Prompt 2 = Dan Kennedy persona scrapes Meta Ads Library + TikTok + Google with 5 keyword variations, qualifies by 6-7+ active ads + page-transparency age. Prompt 3 = pattern recognition. Weekly Sun.
trigger:
  scheduled: "0 4 * * 0 Asia/Jerusalem"
mcp_dependencies:
  required:
    - playwright   # Meta Ads Library, TikTok, Google
    - supabase
inputs:
  - state/market-research/offer-brief.json    # product + audience
  - state/market-research/customer-avatar.json
outputs:
  - state/ads-competitor/competitors.json     # full matrix
  - state/ads-competitor/patterns.json        # cross-competitor pattern lift
references:
  - references/my-competitor-prompts.md
  - references/my-competitor-matrix.md
  - ../copy-website/SKILL.md   # used to clone each qualified competitor's LP
aviv_refs:
  - ../../skills/_aviv/ads-competitor/SKILL.md
  - ../../skills/_aviv/competitor-alternatives/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Ads Competitor Agent

Weekly recon. 3 prompts in sequence. Owner approval gate after Prompt 1.

## Process

### Phase 1 — Inputs check

Required: `offer-brief.json` (for product/audience). If missing → halt.

### Phase 2 — Run Prompt 1 (verbatim)

Persona: combination of Philip Kotler + Jack Trout + Michael Porter + Dan Kennedy.

Find:
- 3 direct competitors
- 3 indirect competitors
- 3 aspirational competitors

For each, fill the full attribute matrix (see `references/my-competitor-matrix.md`).

Output: provisional competitor list to `competitors.json` (status: `awaiting_validation`).

**Owner approval gate.**

### Phase 3 — Run Prompt 2 (verbatim)

Persona: Dan Kennedy.

Search Meta Ads Library + TikTok + Google with **at least 5 different keywords/variations**.

Qualify each found brand by:
- **6–7+ active ads minimum** (10+ better) — means it's working
- **Page transparency** — older page = more credible (not brand-new)

For each qualified brand, fill same attribute matrix.

Use Playwright:
- `https://www.facebook.com/ads/library` with each keyword
- TikTok creative center / search
- Google with `[keyword] ads` and direct site discovery

Append to `competitors.json` (status: `validated`).

### Phase 4 — Run Prompt 3 (verbatim)

Pattern recognition across all competitors. Identify recurring:
- Hooks (top first-3-second devices)
- Offers (free shipping thresholds, bundles, BOGOs)
- Guarantees (30/60/90-day)
- Scarcity tactics
- LP structures
- Creative formats
- Price clusters

Output: `patterns.json` — array of patterns with frequency + example competitor IDs.

### Phase 5 — Persist & route

- Insert Supabase `competitor_research`
- Email digest with top 3 patterns
- Route to:
  - `ads-creative` (hooks + angles for our next batch)
  - `branding` (positioning gaps)
  - `website-builder` (LP structure benchmarks)
  - `ads-meta` (offer benchmarks for our own ads)

## Revenue estimation formula

Per owner: `Revenue ≈ Ad Spend × (AOV × CVR ÷ CPC)`

Apply to each competitor where ad-spend signal is observable (active-ad count × avg CPM × est. impressions).

## Output contract

```
🕵️ Competitors — {brand}
Direct: 3
Indirect: 3
Aspirational: 3
Validated via Ads Library: 5 / 9
Patterns extracted: 12
Top hook pattern: "{pattern}" (7/9 competitors use it)
```

---

## Owner's playbook (verbatim)

### Context

> When we want to do competitor research we will use the output of section "1" to make this section work, we will use claude coworker or claude code with playwright mcps (whic is better?)
> We will start by prompting the following:

### Prompt 1

> claude the product i sell is[X] and as of now i don't have any market research , branding, website or knowledge. Imagine you are a combination of the great founders of competitors research method (Philip Kotler , jack trout , mciheal porter , dan kennedy). First, go and find at least 3 direct competitors , 3 indirect competitors and 3 Aspirational Competitors. For every brand (competitor) you have found, "write" their: target audience (assumption), main promise, brand angle, main offer, upsells\crosells , guarantees, scarcity, emotion they target, landing page style (CTA…), creatives and ads (hooks, angles, format, repeated creatives (very important), amount of running ads, product price, revenue assumption (Revenue ≈ Ad Spend × (AOV × CVR ÷ CPC)).

*after user checked if approved go next*

### Prompt 2

> you are Dan Kennedy, search meta ads for competitors, use at least 5 different keywords and variations. Any brand that's running ads (10+ is better) (minimum 6\7) is means thats working. Find their page transpercacy and check to make sure their website page is not really new (older - better). Do the same on tiktok and google. For every brand (competitor) you have found, "write" their: target audience (assumption), main promise, brand angle, main offer, upsells\crosells , guarantees, scarcity, emotion they target, landing page style (CTA…), creatives and ads (hooks, angles, format, repeated creatives (very important), amount of running ads, product price, revenue assumption (Revenue ≈ Ad Spend × (AOV × CVR ÷ CPC)).

### Prompt 3

> from all the competitors available you have found, do a pattern recognition research and try to find and extract the patterns


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
