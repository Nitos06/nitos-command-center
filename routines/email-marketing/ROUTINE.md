---
name: email-marketing
schedules:
  setup:    "event:brand-onboarding"         # one-time — write 4 flows to DB
  monthly:  "0 0 1 * * Asia/Jerusalem"       # 1st of month 00:00 — topic bank + calendar
  weekly:   "0 7 * * 1 Asia/Jerusalem"       # Mon 07:00 — 3 campaigns
  nightly:  "0 3 * * * Asia/Jerusalem"       # 03:00 — deliverability + segments + RFM
trigger_skill: email-marketing
budgets: { max_minutes: 90, max_usd: 3, max_tokens: 2_000_000 }
state_dir: state/email-marketing/
notify: { on_complete: email, on_fail: email+telegram }
env:
  API_BASE: "https://nitaiecompro-nine.vercel.app"
  API_KEY: "ek_live_..."   # generate at Settings → API Keys in the app
---

# Routine: email-marketing

Sending layer: Amazon SES via the app's public API at `$API_BASE/api/v1/`.
Auth header on all requests: `Authorization: Bearer $API_KEY`.

---

## Job: setup (one-time, `brand-onboarding` event)

Write 4 automation flows into `email_flows` table. After this, Shopify webhooks trigger them automatically.

1. Read `state/branding/brand-strategy-blueprint.json` + `state/market-research/customer-avatar.json`
2. Read `skills/email-marketing/SKILL.md` flows section for copy structure + S.C.E formula
3. For each flow, draft full email copy (subject + MJML body) for every step
4. Save each step as a template:
   ```
   POST $API_BASE/api/v1/templates
   { "brandId": "...", "name": "welcome-1", "subject": "...", "mjml": "..." }
   ```
5. Insert each flow via Supabase MCP `execute_sql`:
   ```sql
   INSERT INTO email_flows (brand_id, name, trigger_event, is_active, steps, channel, provider)
   VALUES ('<id>', 'Welcome Flow', 'welcome', true, '[{"subject":"...","html_template":"...","delay_hours":0}]'::jsonb, 'email', 'ses');
   ```

**4 flows:**
- **Welcome** (8 emails / 7–14 days) — triggered by signup/quiz/popup capture
- **Abandoned Cart** (8 emails) — triggered by `checkouts/create` webhook, first email 4h later
- **Post-Purchase** (3 emails) — triggered by `orders/paid` webhook, starts 1h after
- **Win-back** (4 emails) — triggered by Job: nightly for 90-day-inactive customers

---

## Job: monthly (1st of month 00:00)

Generate 12 campaign topics and populate the calendar for the coming month.

1. Read `state/branding/brand-strategy-blueprint.json` + `state/market-research/customer-avatar.json`
2. Run topic generation (see SKILL.md Job B prompt verbatim) → 3 macro topics × 4 microtopics = 12
3. Save to `state/email-marketing/topic-bank.json` (mark each as `used: false`)
4. Plan 3 send dates per week (Mon/Wed/Fri), flag holidays
5. Bulk-create calendar entries:
   ```
   POST $API_BASE/api/v1/calendar
   {
     "brandId": "...",
     "entries": [
       { "title": "...", "scheduled_date": "YYYY-MM-DD", "brief": { "topic": "...", "type": "educational", "tier": "gruns" } }
     ]
   }
   ```

---

## Job: weekly (Mon 07:00)

Draft and send 3 campaigns this week (2 educational + 1 fun).

1. Read `state/email-marketing/topic-bank.json` — pick 3 unused microtopics
2. Read `skills/email-marketing/references/my-30-campaign-types.md` — pick type per topic
3. Decide design tier per campaign (Gruns-style / Hybrid / Text-only)
4. Draft each email following S.C.E (see SKILL.md): skimmable, one takeaway, brand tone
5. For each campaign:
   ```
   POST $API_BASE/api/v1/campaigns
   {
     "brandId": "...",
     "name": "2026-05-05-topic-slug",
     "subject": "...",
     "previewText": "...",
     "mjml": "<mjml>...</mjml>",
     "segmentId": "<active-segment-id>",
     "scheduledAt": "2026-05-05T08:00:00Z"
   }
   ```
   Then send:
   ```
   POST $API_BASE/api/v1/send
   { "brandId": "...", "campaignId": "..." }
   ```
6. Mark 3 topics as `used: true` in topic-bank.json
7. Write `state/email-marketing/latest.json` + `latest-status.json`

---

## Job: nightly (03:00)

Check health, refresh segments, find win-back candidates.

1. Pull stats:
   ```
   GET $API_BASE/api/v1/deliverability?brandId=...&days=30
   ```
2. Check targets:
   - Open Rate ≥ 45% ✅ | below → restrict next send to 14-day-engaged segment only
   - Bounce < 1%, Spam < 0.01%
3. Refresh segments:
   ```
   POST $API_BASE/api/email/segments/evaluate  { "brandId": "..." }
   ```
4. Recalculate RFM:
   ```
   POST $API_BASE/api/email/contacts/rfm  { "brandId": "..." }
   ```
5. Find win-back candidates — customers with `last_order_at < now() - interval '90 days'` and no active win-back queue entry — insert into `automation_queue` with `flow_type = 'win_back'`
6. Write `state/email-marketing/deliverability.json` + `state/email-marketing/latest-status.json`

---

## Dashboard output (`latest-status.json`)

```json
{
  "status": "ok",
  "headline": "3 campaigns sent · Open 47% · Segments refreshed",
  "kpis": { "open_rate": 0.47, "click_rate": 0.014, "bounce": 0.003, "campaigns_mtd": 12 },
  "next_run": "2026-05-06T03:00:00Z",
  "alerts": []
}
```
