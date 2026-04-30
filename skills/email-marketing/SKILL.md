---
name: email-marketing
description: Amazon SES-powered email engine. 4 mandatory one-time flows (Welcome 8 / Cart+Checkout 8 / Post-Purchase 3 / Win-back 4). 30-type weekly campaign catalog with Gruns/hybrid/text-only tiering. Macro→micro topic engine produces 3 campaigns/week (2 educational + 1 fun). Deliverability shrink-to-win when Open<45%. Nightly segmentation refresh. Ecom quiz + popup form specs.
trigger:
  scheduled:
    - "0 7 * * 1 Asia/Jerusalem"        # weekly Mon 07:00 — campaign engine
    - "0 0 1 * * Asia/Jerusalem"        # monthly 1st — topic-bank refresh
    - "0 3 * * * Asia/Jerusalem"        # nightly — deliverability + segmentation
  event: "brand-onboarding"             # one-time 4-flow + quiz + popup setup
mcp_dependencies:
  required:
    - supabase
  optional:
    - shopify
    - playwright
inputs:
  - state/branding/copy-assets.json
  - state/branding/brand-strategy-blueprint.json
  - state/market-research/customer-avatar.json
  - state/market-research/silent-frustration.md
  - state/seo/published.json           # blog promo campaigns reference these
outputs:
  - state/email-marketing/flows/{flow_name}.json
  - state/email-marketing/campaigns/{week}/{slug}.json
  - state/email-marketing/topic-bank.json
  - state/email-marketing/deliverability.json
  - state/email-marketing/segments.json
  - state/email-marketing/quiz.json
  - state/email-marketing/popup.json
  - state/email-marketing/latest.json
  - state/email-marketing/latest-status.json
references:
  - references/my-mailjet-flows.md
  - references/my-30-campaign-types.md
  - references/my-deliverability-protocol.md
  - references/my-segmentation.md
  - references/my-ecom-quiz.md
  - references/my-popup-form.md
  - references/my-gruns-style-rules.md
  - references/my-sce-formula.md
aviv_refs:
  - ../../skills/_aviv/email-sequence/SKILL.md
  - ../../skills/_aviv/cold-email/SKILL.md
  - ../../skills/_aviv/gmail-organizer/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Email Marketing Agent (Amazon SES)

**Sending layer: Amazon SES v2.** All outbound email goes through `POST /api/email/send` (which calls `lib/ses.ts`). Mailjet is no longer used. Bounce/complaint/open/click events come back via SNS → `POST /api/webhooks/ses` → written to `email_sends` + `email_deliverability` Supabase tables.

**SES config (from `brand_settings`):**
- `ses_sender_email` — verified FROM address
- `SES_CONFIGURATION_SET` — env var pointing to the SES configuration set that publishes events to SNS

Single agent. Four jobs.

## Process

### Job A — One-time 4-flow setup (on `brand-onboarding` event)

Build all 4 flows in Mailjet via MCP. Email-by-email copy from `references/my-mailjet-flows.md`. Every email follows S.C.E formula (`my-sce-formula.md`).

#### A.1 Welcome flow (8 emails / 7–14 days)
Trigger: list subscribe.
1. Discount/offer delivery (immediate)
2. Founder story + brand mission
3. Brand USPs — why we stand out
4. Discount reminder + urgency
5. Social proof (reviews/testimonials/UGC)
6. Educational content about product
7. Last-chance discount, heavy urgency
8. Personal "everything okay?" text-only from founder

#### A.2 Cart + Checkout abandon (8 emails — TWO sub-flows)
- Cart trigger = `Added to Cart` (custom event, not Mailjet default)
- Checkout trigger = `Checkout Started`
- Dynamic content: line items + checkout url
1. Brief reminder — show what they left
2. Founder personal nudge (text-only)
3. Social proof (reviews of abandoned product)
4. FAQ / objection handling
5. Discount intro (only if needed)
6. More social proof + discount reminder
7. Last-chance urgency
8. "What happened?" founder personal touch

#### A.3 Post-Purchase (3 emails)
1. Heartfelt thank you + brand mission + add-to-order option
2. Community building, social links
3. Product education — get the most from purchase

#### A.4 Win-back (4 emails) — NEW vs prior spec
Trigger: customer no purchase in 90 days AND last open <60d.
1. "We miss you" — soft + personal
2. Curated bestsellers selection for them
3. Comeback offer (15% off)
4. Final goodbye + unsub-or-buy bifurcation

### Job B — Monthly 1st 00:00 — topic-bank refresh

Run owner's prompt verbatim:
> "I have a [niche] brand that sells [products and their purpose]. Our brand is meant to [2-3 sentences of brand info and mission statement / benefits of brand]. Our average customer [5-6 sentences about your customer demographics, their daily lives, their desires, their wants, and their needs]. I want you to give me 3 overarching topics that my brand can create content about. The topics should be very general and tie into our product benefits and the lives of our customer. Then with those 3 overarching topics I want you to create 4 subtopics under each. The subtopics should be very specific and should educate the customer on the topic and potentially position our products as a solution."

Output: 3 macros × 4 micros = 12 microtopics. Persist to `topic-bank.json`. Plus calendar dates: insert holidays, product launches, sales (per `my-mailjet-flows.md` calendar rules).

### Job C — Weekly Mon 07:00 — campaign engine

#### C.1 Pick 3 microtopics
- 2 educational (real value)
- 1 fun (teaser / social proof / pure entertainment)
- Ratio enforced 2:1 educational

#### C.2 Per microtopic — pick campaign type
From the 30-catalog (`references/my-30-campaign-types.md`).

#### C.3 Pick design tier per campaign
Per owner's weekly tiering:
- **Gruns-style** (image-rich, infographics, comparison charts) — usually 1-2 of week
- **Hybrid** (mixed text+image)
- **Text-only** — used for ELITE-tier value info (per owner's "drive Only the ELITE tier value info through text-only mails")

#### C.4 Scrape source material
PubMed / Reddit / Quora for angles per microtopic.

#### C.5 Draft via S.C.E
Skimmable + Clear&Concise + Engaging. Bolded main points. ONE main takeaway per email. Brand-tone overlay from `state/branding/brand-strategy-blueprint.json` (forbidden words check).

#### C.6 Design
Per `my-gruns-style-rules.md` for image campaigns. Infographics: checklists, icons, comparison charts, timelines, numbered lists, flow charts, graphs. CTAs obvious. Mobile-first.

#### C.7 Send via SES
Call `POST /api/email/send` with `{ bulk: true, to: [email array], subject, html, brand_id, campaign_id }`.
3 sends per week. Send to base segment (X-Day Engaged). Insert `email_campaigns` row before sending, update `status='sent'` after.

### Job D — Nightly 03:00 — deliverability + segmentation

#### D.1 Pull metrics from Supabase
Query `email_deliverability` for last 30 days per brand. Compute:
- Open Rate (target >45%) — `opened / delivered`
- Click Rate (target >1%) — `clicked / delivered`
- Bounce Rate (target <1%) — `bounced / sent`
- Spam Complaint Rate (target <0.01%) — `complaints / sent`
- Unsubscribe Rate (target <0.5%)

Also upsert today's row in `email_deliverability`:
```sql
INSERT INTO email_deliverability (brand_id, date, sent, delivered, bounced, complaints, opened, clicked, delivery_rate)
SELECT brand_id, CURRENT_DATE,
  COUNT(*), COUNT(*) FILTER (WHERE delivered), COUNT(*) FILTER (WHERE bounced),
  COUNT(*) FILTER (WHERE complained), COUNT(*) FILTER (WHERE opened),
  COUNT(*) FILTER (WHERE clicked),
  ROUND(COUNT(*) FILTER (WHERE delivered)::numeric / NULLIF(COUNT(*),0) * 100, 2)
FROM email_sends WHERE sent_at::date = CURRENT_DATE GROUP BY brand_id
ON CONFLICT (brand_id, date) DO UPDATE SET
  sent=EXCLUDED.sent, delivered=EXCLUDED.delivered, bounced=EXCLUDED.bounced,
  complaints=EXCLUDED.complaints, opened=EXCLUDED.opened, clicked=EXCLUDED.clicked,
  delivery_rate=EXCLUDED.delivery_rate;
```

#### D.2 Shrink-to-win recovery (if Open <45%)
Per `my-deliverability-protocol.md`:
- **Weeks 1–3:** pause non-essential auto. Send campaigns ONLY to 14-day-engaged → boost open rates artificially
- **Hit target:** wait until 14-day group consistently 50%+
- **Weeks 3–6+:** gradually expand 30 → 60 → 90-day
- **Standard:** never send regular campaigns to >90-day-unengaged

#### D.3 Segmentation refresh
Maintain segments per `my-segmentation.md`:
- X-Day Engaged (base — start 30, expand 60/90/120 as health improves)
- Unengaged (1×/month re-engagement)
- Collection/Category Interest (1-2× extra/month)
- Cross-Sell (X→Y)
- Received-but-not-opened (re-send w/ new subject)

Persist `state/email-marketing/segments.json` + `deliverability.json`.

### Job E — Ecom quiz + popup form (one-time, optional)

On `/quiz build` or `/popup build` triggers, follow `my-ecom-quiz.md` and `my-popup-form.md`. Both must be customer-research-based, purpose-driven, mobile-optimized. Quiz builds belief that recommendation is right.

### Cross-cut — dashboard contract

`state/email-marketing/latest-status.json`:
```json
{
  "status": "ok",
  "headline": "3 campaigns sent · Open 47% · 2 edu + 1 fun · Segments 5",
  "kpis": {"open_rate": 0.47, "click_rate": 0.014, "bounce": 0.003, "campaigns_mtd": 12},
  "next_run": "2026-04-29T03:00:00Z",
  "alerts": []
}
```

## Output contract — weekly digest

```
📧 Email Marketing — {brand}
Flows: 4/4 (Welcome 8 ✅ | Cart+Checkout 8 ✅ | Post-Purchase 3 ✅ | Win-back 4 ✅)
This week: 3 campaigns (2 edu + 1 fun · Gruns 1 + hybrid 1 + text 1)
Deliverability: Open 47% | Click 1.4% | Bounce 0.3% | Spam 0.002% ✅
Segments refreshed: 5
```

---

## Owner's playbook (verbatim — see `references/my-mailjet-flows.md` for full 4-flow detail, S.C.E, design rules, deliverability, segmentation, quiz, popup)


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
