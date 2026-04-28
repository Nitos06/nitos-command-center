---
name: meta-ads
description: Mega-agent — full Meta Ads autonomy. Owner mandate "I don't even need to log in." Replaces ads-meta + ads-budget + ads-creative + ads-generate. Daily 09:00 audit → classify → scale/hold/refresh/kill → create CBO/ABO campaigns → autonomous creative regen pipeline (Higgsfield image GPT-image-2.0 route → Higgsfield video Seedance-2.0 route → Submagic → Claude self-scores quality → upload) → context-driven auto-action (no fixed daily-delta cap) → adaptive learning loop. Pushes LP-issue flags to seo + website-builder. Verbatim playbook at bottom is canonical.
trigger:
  scheduled: "0 9 * * * Asia/Jerusalem"
  manual: "/meta {audit|scale|kill|create|regen}"
mcp_dependencies:
  required:
    - meta-ads
    - supabase
    - playwright           # higgsfield-image (GPT-image 2.0 + Seedance 2.0 routes), Submagic
    - higgsfield-image
    - submagic
  optional:
    - telegram             # quick-approve buttons + edge-case flag
inputs:
  - state/context.json
  - state/avatar-builder/avatars.json
  - state/hook-mining/library.json
  - state/branding/brand-strategy-blueprint.json
  - state/branding/copy-assets.json
  - state/ads-competitor/{week}/matrix.json
outputs:
  - state/meta-ads/audit-report.json
  - state/meta-ads/actions/{date}.json
  - state/meta-ads/spend.json
  - state/meta-ads/pending-approval.json
  - state/meta-ads/lp-issues.json
  - state/meta-ads/decisions.json
  - state/meta-ads/creative/{concept_id}/
  - state/meta-ads/latest.json
  - state/meta-ads/latest-status.json
references:
  - references/my-3-2-2-playbook.md
  - references/my-meta-thresholds.md
  - references/my-creative-workflow.md
  - references/my-creative-design-rules.md
  - references/my-1.5x-be-rule.md
  - references/my-scaling-tiers.md
  - references/my-sce-formula.md
  - ../../skills/_external/ads-manager-template/SKILL.md
aviv_refs:
  - ../../skills/_aviv/ads-meta/SKILL.md
  - ../../skills/_aviv/paid-ads/SKILL.md
  - ../../skills/_aviv/ads-audit/SKILL.md
  - ../../skills/_aviv/ads-math/SKILL.md
  - ../../skills/_aviv/ads-dna/SKILL.md
  - ../../skills/_aviv/ads-test/SKILL.md
  - ../../skills/_aviv/ads-plan/SKILL.md
  - ../../skills/_aviv/meta-verification/SKILL.md
  - ../../skills/_aviv/ads-budget/SKILL.md
  - ../../skills/_aviv/ad-creative/SKILL.md
  - ../../skills/_aviv/ads-creative/SKILL.md
  - ../../skills/_aviv/ads-photoshoot/SKILL.md
  - ../../skills/_aviv/copywriting/SKILL.md
  - ../../skills/_aviv/copy-editing/SKILL.md
  - ../../skills/_aviv/storytelling/SKILL.md
  - ../../skills/_aviv/humanizer/SKILL.md
  - ../../skills/_aviv/ads-create/SKILL.md
  - ../../skills/_aviv/ads-generate/SKILL.md
  - ../../skills/_aviv/ads-landing/SKILL.md
  - ../../skills/_aviv/heygen/SKILL.md
  - ../../skills/_aviv/remotion/SKILL.md
  - ../../skills/_aviv/video-creator/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Meta Ads Mega-Agent

Daily 09:00 IL. Reads owner playbook before acting (verbatim section below).

## Process — 10 step adaptive loop

### Step 1 — Pull insights
`mcp__meta-ads__get_insights` per ad/adset/campaign with windows: **3d**, **7d**, **14d**. Breakdowns: age, gender, placement, device, hour-of-day. Fields per `Phase 2` of verbatim playbook.

### Step 2 — Compute owner's metric set
Per `references/my-meta-thresholds.md`: Hook Rate, Thumb Stop, uCTR, CTR, Outbound CTR, CPM, CPC, 3s/25%/50%/75%/100% view rate, Avg Watch Time, LP View Rate, ATC Rate, IC Rate, CVR, CPA, ROAS, Frequency, Cost per ATC, Cost per IC.

### Step 3 — Classify
Each metric → `bad | weak | ok | good | strong`. Surface action per threshold catalog.

### Step 4 — Decide actions per ad
Failure-diagnosis tree (verbatim):
- Low CTR → creative problem
- Good CTR, low ATC → product/offer problem
- Good ATC, low purchases → website/checkout problem (→ flag `lp-issues.json`)
- Good everything but no profit → offer problem

Then:
- **Scale** (ROAS ≥ 1.5× BE AND winners): per `my-scaling-tiers.md` — P1 +30% q48-72h / P2 +20-30% q2-3d / P3 +10-20% q2-3d → `mcp__meta-ads__update_adset_budget`
- **Hold:** no action
- **Tweak hook only** (strong CTR, weak Hook Rate): trigger Step 6 with `hook_only=true`
- **Tweak full creative** (weak CTR + weak Hook): full Step 6 regen
- **Kill** (3× target CPA, 0 purchases / Freq>3 + ROAS declining): `mcp__meta-ads__pause_ad`
- **Flag LP** (high CTR, low CVR): write to `state/meta-ads/lp-issues.json` for `seo` + `website-builder`

### Step 5 — Campaign-level decisions

- **CBO winner identified** (1 adset >70% spend share + ROAS strong): split into ABO with 2× budget on winner + duplicate to test new audiences
- **ABO scaling well**: consolidate into CBO if 3+ adsets all ROAS-strong
- **New launch needed** (low ad count for active spend tier): create new CBO with 3-2-2 structure (3 hooks × 2 angles × 2 CTAs = 12 ads). Per verbatim 1.1.
- All campaign ops via `mcp__meta-ads__create_campaign` / `create_adset` / `create_ad`
- DPA / Advantage+ Catalog: per verbatim 1.2 — for retargeting + broad prospecting

### Step 6 — Autonomous creative regen sub-pipeline

1. Read avatar from `state/avatar-builder/avatars.json`
2. Pull top hooks from `state/hook-mining/library.json` for this brand
3. Compose: 3 hooks (S.C.E) + 2 angles (pain/desire/curiosity/authority/FOMO) + 1 CTA per concept
4. **Generate images** via `higgsfield-image` (Playwright wrapper, GPT-image 2.0 route) using realism prompt taxonomy from `_aviv/ads-photoshoot`
5. **Generate videos**: image-to-video via `higgsfield-image` (Seedance 2.0 route, same Playwright wrapper); multi-shot concat per `my-creative-workflow.md`
6. **Submagic**: captions + audio + SFX
7. **Quality scoring 1–10**: this Claude session self-scores (realism / brand-fit / hook / composition). Reject <7. Re-roll up to 2×
8. **Naming + UTM**: per `_external/ads-manager-template/naming-convention.md`, UTM keyed off `concept_id`
9. **Upload** via `mcp__meta-ads__create_ad` into target adset
10. Pause replaced old ad (do NOT delete original test ad if still profitable per verbatim "rules")

Persist all artifacts: `state/meta-ads/creative/{concept_id}/` (prompts, frames, video, captions, quality_score).

### Step 7 — Context-driven auto-action

No fixed daily-delta cap. The agent decides autonomously based on full context:
- ROAS trajectory (3d/7d/14d windows)
- Frequency + fatigue signals
- Funnel health (CTR/ATC/CVR ratios)
- `finance-il` cash position (read latest-status.json)
- Tax-bracket position (avoid pushing past a stair if marginal rate spikes)
- Competitor pressure (`ads-competitor` weekly matrix)

The agent has the knowledge — it must decide what to do when. Edge cases that warrant owner glance (e.g., a 10×-ROAS scaling jump, anomalous spend swings, MCP quality drop) → queue to `state/meta-ads/pending-approval.json` + mirror to Telegram. Otherwise execute.

### Step 8 — Adaptive learning

- After every action, log `(decision, ad_id, reasoning)` to Supabase `meta_ads_decisions`
- 7 days later: log outcome → `(decision_id, outcome_metrics, was_correct)`
- Weekly aggregation → adjust agent's threshold-confidence model (e.g., "Hook Rate predicts ROAS at r=0.7 for this brand → bias creative regen toward stronger hooks")
- Output learning summary in `state/meta-ads/decisions.json` for dashboard adaptive-learning view

### Step 9 — Persist
- `audit-report.json`, `actions/{date}.json`, `spend.json`, `pending-approval.json`, `lp-issues.json`, `decisions.json`
- Insert Supabase `audits` (category=`ads-meta`)
- Push status to `dashboard-bridge`

### Step 10 — Telegram + email digest

```
🎯 Meta Ads — daily
Spend ₪842 · Rev ₪2,310 · ROAS 2.74
Auto-scaled: 3 ads (+₪220/d)
Auto-killed: 2 (Freq 4.1, ROAS 1.1)
Regenerated + uploaded: 4 new creatives live
Created: 1 new ABO test campaign (3 audiences)
Awaiting approval: 1 (10× ROAS scale flagged for owner glance)
LP CRO flag: product-page X (CTR 4.1%, CVR 0.9%)
Adaptive: Hook Rate↔ROAS r=0.71 (this brand)
```

## Dashboard contract

`state/meta-ads/latest-status.json`:
```json
{
  "status": "ok",
  "headline": "₪842 spend · ROAS 2.74 · 3 scaled / 2 killed / 4 regen",
  "kpis": {"spend": 842, "revenue": 2310, "roas": 2.74, "cpa": 23.4, "freq_avg": 1.8},
  "next_run": "2026-04-28T09:00:00Z",
  "alerts": ["1 awaiting approval", "1 LP CRO flag"]
}
```

---

## Owner's playbook (verbatim)

> Source: owner's Google Doc, 2026-04. This section is canonical. When this section conflicts with the Process section above, **this wins**.

### Setting up accounts

In FB account we need to add six metrics:
- Add to cart
- Checkout rate
- Conversion rate
- Hold rate
- AOV
- CR%
- Hook rate

### 1. FACEBOOK & IG (meta)

#### 1.1) The 3-2-2 campaign

As recommended - we want to start a testing campaign with a 35$ budget and we need to know it may take 4-5 days for results to arrive, after 3 days we will take a look at campaigns metrics and stats and decide if it good - scale (as of our scaling rules), if it's bad - delete (per deletion rules in scale part).

We choose only "Sales" campaign objective.
ADS catalog toggled "off"
Budget is on all of the campaign - CBO campaign
Budget is on adsets level, not campaign level - ABO
Conversion location always on "website"
We always start a campaign for tomorrow 12AM midnight
Name the campaign and add the date

On ad sets optimization:
Media setup to "manual upload"
Format is "single image or video"
Name the adset and add the date

Inside the creative setup:
Toggle everything "off"
Upload media
Add primary text "one good sentence and 4 benefits" and headline.
In enhancements toggle only "videos touch ups" "text improvements" "add video effects" on.
CTA should be only "shop now"
Click the 3 dots and duplicate then change creative text and media to create more.
- Headline under 40 chars, primary text under 125 chars

**Campaign itself:**
- Main campaign - CBO campaign — One adset (more at scaling) — 3 creatives
- Testing campaign - ABO campaign — Budget in ad set level — Three adsets — Three creatives

*High performing creatives we duplicate to CBO via post ID method* — we click "edit" on the testing campaign then we click "preview" then we select "facebook post with comments" then in the URL copy the list of numbers appear after the /posts/ - that's the Post ID.
Move to the Big CBO campaign and click edit then click "quick duplicate", delete the older ads from the duplicated content and in the ad setup choose "use existing post" then enter the post id and accept (if there is an easier process - just do it)

**Few rules:**
- Cannot add more than 3 ads in one adset - if that happens you need to open new adset.
- If you find no performing — Toggle off non revenue driven ads to give more for revenue driven ads.
- Do not delete original ad in test until as long as it is profitable.

**Possible reasons to fail in tests:**
- The creatives
- The offer
- The website / landing page
- The product

**Failure-diagnosis tree:**
- Low CTR → Creative problem
- Good CTR, low ATC → Product / offer problem
- Good ATC, low purchases → Website / checkout problem
- Good everything but no profit → Offer problem

**The Testing Phase (ABO):** ABO forces system to spend equally across audiences. Budget formula = 25 NIS × number of ads × 3 days. Goal: find winning creatives.

**The Extraction:** After 3 days, review data. Any creative that met KPIs = "winner."

**The Scaling Phase (CBO):** Winning creatives → new higher-budget CBO (115 NIS/day). Algorithm distributes freely. Ad Set 1 baseline; Ad Sets 2/3/4 built using proven, de-risked creatives.

#### 1.2) Facebook Dynamic Product Ads (DPAs) / Advantage+ Catalog Ads

DPA = automated campaign type where Meta acts as media buyer + creative designer. Give Meta a Catalog (spreadsheet of products/prices/images/URLs) + dynamic ad template. Meta's algorithm automatically pairs right product with right user.

**When to Use DPAs:**
- **Bottom of Funnel (Retargeting):** highest-ROI use case. User clicks site, looks at specific kit, ATC, leaves. DPA "follows" them onto FB/IG, shows the exact kit they abandoned + carousel of similar items, "Did you forget something?" (banger for retargeting)
- **Top of Funnel (Broad Prospecting):** target broad audience. Meta's AI knows User A has been reading articles about X, automatically pulls X-product from catalog. (rarely used for top of funnel)

You create new campaign in Ads Manager, Sales objective, turn on catalog feature. Instead of upload, create Dynamic Template with dynamic placeholders. Meta ML generates thousands of personalized ads.

### Scaling

**Horizontal (structure↑):**
- Duplicate campaigns/ad sets
- Add new creatives
- Expand audiences

**Vertical (budget↑):**
- Gradually

**Minimum to scale = 1.5× of break-even.**
E.g., BE=1.5 → ROAS must be 1.5×1.5 = 2.25 minimum to scale.

**Vertical Scale tiers:**
- **Phase 1 (under $100/day):** +30% every 48–72h
- **Phase 2 ($100→$500):** +20–30% every 2–3 days
- **Phase 3 ($500+):** +10–20% every 2–3 days

**Horizontal scale:**
1. Duplicate winning ad set into same campaign — keeps learning context
2. Duplicate into new campaign — tests fresh delivery
3. Add new creatives

> Scaling fails because of creatives. You scale creatives that work.

**Loop:** launch → find winners → scale → fatigue → variations → repeat

### In non-profit case

Look 4 days back. Check every 2–3 days. Use 3-day, 7-day, 14-day windows.

**If doesn't work — from 1 winning ad:**
- 3 new hooks
- 2 new angles
- 1 new CTA

Tweak (change hook voice or other parameters) to relive the video.

If 4 days post-tweak still unprofitable → close campaign, redo with new creatives.

### Metrics (full threshold catalog)

**ATC rate:** 5–6% solid. <3% → product/page problem.
**uCTR:** 1.5–2.5% good. 2.5%+ strong.
**Hook Rate (3s hold):** <20 bad | 20–30 weak | 30–40 good | 40%+ strong. Action low → change first 3s.
**Thumb Stop:** <20 bad | 20–30 ok | 30%+ strong. Action low → more aggressive visual / pattern break.
**CPM:** varies. High + low CTR → creative sucks (not audience).
**CTR (link):** <1 bad | 1–1.5 weak | 1.5–2.5 good | 2.5%+ strong. Action low → change angle.
**Outbound CTR:** <1 weak | 1–2 ok | 2%+ strong. Low → weak intent / mismatch.
**CPC:** high → fix CTR.
**3s View Rate:** 25–40 good. Low → hook weak.
**25% View:** <20 bad | 20–30 ok | 30%+ strong. Drop → boring pacing.
**50% View:** <10 bad | 10–20 good | 20%+ strong. Drop → loses interest.
**75–100%:** lower normal. Low → weak storytelling.
**Avg Watch Time:** higher better. Low → fix pacing.
**LP View Rate:** <60 bad | 60–80 ok | 80%+ good. Low → slow site / tracking.
**ATC Rate:** <3 bad | 3–5 ok | 5–8 good | 8%+ strong. Low → fix product page / offer / price.
**Initiate Checkout Rate:** ~50–70% of ATC. Low → friction.
**CVR:** <1 bad | 1–2 ok | 2–4 good | 4%+ strong. Low → trust / pricing / UX.
**CPA:** high → check CTR + ATC.
**ROAS:** <1 loss | 1–1.5 BE | 1.5–2 good | 2+ strong. Low → check funnel.
**Frequency:** 1–2 fresh | 2–3 ok | 3+ fatigue. High + bad perf → new creatives.
**Cost per ATC / IC:** high → product/offer weak / checkout friction. (3%+ excellent)

### Retargeting

**Low budgets:** 1 campaign / 1 ad set, audience: VC + ATC (last 7–14 days)
**Higher budgets:** 1 campaign with 2 ad sets:
- Ad set 1: 1–3 days (HOT)
- Ad set 2: 7–14 days (WARM)

### Creating creatives

Every creative must follow **S.C.E** (Skimmable / Clear&Concise / Engaging — see `my-sce-formula.md`).

**Design rules:**
- Button clear, nice contrast
- Large enough buttons
- Clear CTA
- Centered CTA
- Simplicity, clarity
- Minimal copy
- Clear headlines + main points

**Video creation guardrails (built from 2500+ ads scraped + analyzed):**
Formulas / Subformulas / Angles / Hooks / Copywriting formulas / Editing variables / CTAs

Inside guardrails — be as creative as possible.

### Workflow (videos)

Use meta data to know what to create next. Start text-to-image OR image+text-to-image in Higgsfield (Playwright). Add reference image + prompt → video. (See prompt doc for full instructions.)

Recommend: use brand models, don't switch models all the time if UGC.

Then Submagic → audio, SFX, captions → upload.

Tools: **gptimage 2.0**, **seedance 2.0** or **kling 3.0**.


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
