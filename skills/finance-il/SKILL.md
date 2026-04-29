---
name: finance-il
description: Israeli e-com financial brain. Merges payments reconciliation + taxes + Hebrew invoice generation + Bank Leumi deposits + Telegram receipt poll into one mega-agent. Daily 04:00 reconciliation. Daily 08:00 profit + bracket watch. Monthly 1st invoice run + tax/BL deposit. 15-min Telegram poll for receipts (and tagged routing for non-receipt drops like founder UGC).
trigger:
  scheduled:
    - "0 4 * * * Asia/Jerusalem"        # daily 04:00 reconciliation
    - "0 8 * * * Asia/Jerusalem"        # daily 08:00 profit + bracket
    - "0 6 1 * * Asia/Jerusalem"        # monthly 1st 06:00 invoices + deposits
    - "*/15 * * * * Asia/Jerusalem"     # every 15 min Telegram poll
  manual: "/finance {reconcile|status|invoice|deposit} {arg}"
mcp_dependencies:
  required:
    - supabase
    - leumi-open-banking
    - shopify
  optional:
    - gmail
    - telegram
    - rashut-hamissim
    - playwright   # for PDF render
    - playwright   # HTML→PDF render path for Hebrew invoices (Hyperframes is video-only, no PDF)
inputs:
  - state/branding/copy-assets.json   # for invoice header brand voice
outputs:
  - state/finance-il/reconciliation/{date}.json
  - state/finance-il/mismatches.json
  - state/finance-il/profit/{date}.json
  - state/finance-il/invoices_issued/{month}.json
  - state/finance-il/expenses/{month}.json
  - state/finance-il/deposits/{month}.json
  - state/finance-il/latest.json
  - state/finance-il/latest-status.json
  - state/finance-il/inbox/{type}/{date}-{slug}.{ext}   # Telegram drop routing
references:
  - references/my-il-tax-stairs.md
  - references/my-bituach-leumi-rates.md
  - references/my-vat-rules.md
  - references/my-hebrew-invoice-template.md
  - references/my-expense-categories.md
aviv_refs: []
self_heal: skills/_lib/self-heal.md
---

# Finance IL Agent

One agent. Four jobs. The owner's full IL financial brain.

## Process

### Job A — Daily 04:00 reconciliation

**Phase A.1 — Pull**
- **Bank Leumi Open Banking** → yesterday's deposits + outflows
- **Shopify** → orders with `financial_status=paid` (Shopify Payments only — IL operation, no other processors)

**Phase A.2 — Match**
For each Shopify paid order: match to Bank Leumi deposit (T+1 to T+3). Compute fees withheld. Insert Supabase `bank_reconciliation` row.

**Phase A.3 — Flag mismatches**
- Order paid but no bank deposit after T+5 → fraud / chargeback risk → `crit` alert
- Bank deposit without matching order → manual review queue
- Fee variance >2% from expected → flag

**Phase A.4 — Persist**
`state/finance-il/reconciliation/{date}.json`. Mismatches → `state/finance-il/mismatches.json`.

### Job B — Daily 08:00 profit + bracket watch

**Phase B.1 — Profit refresh**
Read `v_daily_profit` + `v_monthly_profit` from Supabase. Annualize.
- `ytd_net_profit` = sum Jan 1 → today
- `projected_annual_net` = `ytd_net_profit / months_elapsed * 12`
- Wise FX fee 0.7% of foreign revenue → upserted as monthly `external_costs` row

**Phase B.2 — Bracket classification**
Per `references/my-il-tax-stairs.md` (owner drops verbatim 2026 brackets):
- מס הכנסה brackets (10/14/20/31/35/47/50%) — match `projected_annual_net`
- ביטוח לאומי per `my-bituach-leumi-rates.md` (7.7% reduced / 18% standard, monthly profit slice)
- Entity transitions:
  - `osek_patur` + `ytd_revenue > 122,833 ₪` → `crit` "מעבר לעוסק מורשה נדרש"
  - `osek_murshe` + `projected_annual_net > 300,000 ₪` → `info` "consider Chevra Ba'am"

**Phase B.3 — Amount-owed calc**
```
income_tax_owed   = stair-sum over filled brackets up to projected_monthly_net × bracket_rate
bituach_leumi_owed = monthly_net × (7.7% slice 0–7,703 + 18% slice 7,703–51,910)
vat_owed          = vat_reports view for current period (per my-vat-rules.md)
```

**Phase B.4 — Stair alert + snapshot**
Only emit alert if bracket changed since last run, or projected EOY would cross next sub-tier. Append to `state/finance-il/profit/{date}.json`.

**Also upsert `tax_bracket_snapshots`** (brand_id, year, month) with:
```sql
INSERT INTO tax_bracket_snapshots (brand_id, year, month, mas_hachnasa_bracket, monthly_deposit_required, projected_annual_net, ytd_net_profit, updated_at)
VALUES ($brand_id, $year, $month, $bracket_pct, $monthly_deposit, $projected_annual_net, $ytd_net_profit, now())
ON CONFLICT (brand_id, year, month) DO UPDATE SET
  mas_hachnasa_bracket = EXCLUDED.mas_hachnasa_bracket,
  monthly_deposit_required = EXCLUDED.monthly_deposit_required,
  projected_annual_net = EXCLUDED.projected_annual_net,
  ytd_net_profit = EXCLUDED.ytd_net_profit,
  updated_at = now();
```
This keeps the Taxes dashboard KPIs (`monthly_deposit_required`) always current without re-computing.

### Job C — Monthly 1st 06:00 — invoices + deposits

**Phase C.1 — Issue Hebrew invoices for last month's orders**
Owner has no third-party invoice provider. Generate חשבונית מס natively from Shopify order data using the Hebrew template at `references/my-hebrew-invoice-template.md`. PDF render via Playwright (HTML→PDF — Hyperframes is video-only). Owner may build a dedicated invoicing app later.

For every paid Shopify order from prior month with no `invoices_issued` row:
1. Translate items (`products.title_he` cache) — LLM if missing
2. Build payload: `invoice_number` = next sequential per-brand, customer_name or "לקוח אנונימי", currency ILS, VAT 18% IL / 0% export
3. **Allocation number gate** (post-Jan-2024 ITA rule): if `total > 25,000 ₪` AND IL customer → `mcp__rashut-hamissim__request_allocation_number` → store on `invoices_issued.cheshbonit_digitalit_id`
4. Render PDF via Playwright (HTML→PDF) + Hebrew RTL template (brand logo from `state/branding/...`). Store in Supabase Storage `invoices/` bucket
5. Insert `invoices_issued` row + email PDF to `customer_email`
6. Persist `state/finance-il/invoices_issued/{month}.json`

**Phase C.2 — Ingest expense invoices for last month**
Run in parallel:
- **Gmail search**: `subject:(invoice OR חשבונית OR receipt OR קבלה) newer_than:35d -from:me`. LLM-parse vendor/amount/VAT/ref/date/is_export. Insert `expenses` (`is_foreign_reverse_charge` if non-IL vendor). Categorize per `my-expense-categories.md`.
- **Telegram drops** (already collected by Job D below into `state/finance-il/inbox/receipts/`): this Claude session OCRs the image inline → same parse → `expenses`

Dedupe by `(vendor, invoice_ref)`.

**Phase C.3 — Bank Leumi deposit (gated)**
Only proceeds if all true:
- `alert_preferences.auto_pay = true` for `taxes` category
- `leumi-open-banking` connection = `connected`
- Computed amount > 0 AND ≤ `max_auto_pay_ils` cap

Flow:
1. Refresh OAuth token if expiring within 24h
2. `POST /payment-initiation` per Leumi Open Banking spec:
   - Creditor: רשות המסים (income tax / VAT) or ביטוח לאומי
   - Reference: tax period (e.g. `MAS-2026-Q2`)
3. On 2xx → insert `bituach_leumi_payments` / `vat_reports` row
4. On failure → `crit` alert, manual confirm deeplink

If gated off → `warn` alert "₪X owed, click to pay" + dashboard `/taxes` deeplink.

**Phase C.4 — Persist**
`state/finance-il/deposits/{month}.json`, `state/finance-il/expenses/{month}.json`.

### Job D — 15-min Telegram poll (continuous)

**Phase D.1 — Pull**
- Telegram bot listens on configured chat
- For each new media message from authorized user, classify by tag in caption:
  - `#receipt` → `state/finance-il/inbox/receipts/{date}-{slug}.{ext}` (consumed by Job C.2)
  - `#ugc` → `state/social-instagram/founder-ugc/{date}-{slug}.{ext}` (consumed by social-instagram + social-youtube + social-tiktok)
  - `#product` → `state/social-pinterest/founder-product/{date}-{slug}.{ext}` (queued for social-pinterest)
  - no tag → `state/finance-il/inbox/_unsorted/` + ask reply: "מה זה? `#receipt` / `#ugc` / `#product`?"
- Reply with confirmation: "✓ {type} נשמר"

**Phase D.2 — Persist**
File on disk. No DB write at this stage (Job C.2 ingests receipts at month-end).

### Cross-cut — Dashboard contract

Every job tail writes:
- `state/finance-il/latest.json` — full output of last run (any job)
- `state/finance-il/latest-status.json`:
  ```json
  {
    "status": "ok|degraded|failed",
    "headline": "Net YTD ₪84,200 · MAS bracket 31% · Owed ₪3,420",
    "kpis": {"ytd_net": 84200, "bracket_pct": 31, "owed_ils": 3420, "invoices_issued_mtd": 47},
    "next_run": "2026-04-28T04:00:00Z",
    "alerts": ["1 mismatch flagged", "Bracket transition pending"]
  }
  ```
- Insert decision rows to Supabase `agent_decisions` for adaptive learning visibility (why was a deposit auto-executed vs queued).

## Output contract — daily digest

```
🧾 Finance IL — {date}
Net YTD ₪{x}  · Projected annual ₪{y}
מס הכנסה: {pct}%  · ביטוח לאומי: {pct}%
Owed next cycle: ₪{z}  · {auto_paid | needs_confirmation}
Reconciliation: {orders} orders → ₪{deposit} (fees {pct}%)
Expenses ingested: {count}  · Invoices issued (MTD): {count}
Mismatches: {count}
{alerts}
```

## Self-heal

Per `skills/_lib/self-heal.md`:
- Transient MCP failure → exp backoff × 3
- Bank Leumi auth lapsed → halt Phase C.3 only, continue rest
- Missing `tax_entities` row → halt B/C, write `crit` alert
- Telegram bot offline → fall back to Gmail-only ingest, alert `warn`


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
