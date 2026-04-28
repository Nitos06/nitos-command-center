---
name: analytics
description: Cross-stack analytics rollup. Wraps Aviv's analytics-tracking + last30days. Pulls GA4 + Shopify + Mailjet + Meta + GSC into one daily KPI digest. Feeds executive dashboard + advisory skill.
trigger:
  scheduled: "0 7 * * * Asia/Jerusalem"   # daily 07:00
  manual: "/analytics {today|7d|30d}"
mcp_dependencies:
  required:
    - supabase
  optional:
    - google-analytics
    - shopify
    - mailjet
    - meta-ads
    - google-search-console
    - posthog
inputs:
  - state/ads-meta/audit-report.json
  - state/seo-audit/latest.json
  - state/payments/reconciliation/latest.json
outputs:
  - state/analytics/daily/{date}.json
  - state/analytics/digest.md
references:
  - ../../skills/_aviv/analytics-tracking/SKILL.md
  - ../../skills/_aviv/last30days/SKILL.md
self_heal: skills/_lib/self-heal.md
---

# Analytics Agent

Daily KPI rollup. Owner sees one screen.

## KPIs (owner thresholds applied)

| Metric | Source | Owner threshold |
|---|---|---|
| Sessions | GA4 | trend vs 7d avg |
| Bounce | GA4 | <50% good |
| Add-to-Cart % | GA4 + Shopify | 5-8% strong |
| Initiate-Checkout % | Shopify | follow ads-meta thresholds |
| CVR | Shopify | varies by AOV |
| AOV | Shopify | trend |
| ROAS (blended) | (Shopify rev) / (Meta+Google+TT spend) | 2+ strong |
| Email rev share | Mailjet | 25-35% target |
| SEO clicks | GSC | trend |
| Refund rate | Shopify | <3% |

## Process

### Phase 1 — Collect (parallel)
Pull last 24h from each source. Cache to `state/analytics/raw/{date}/`.

### Phase 2 — Compute deltas
vs yesterday, vs 7d avg, vs 30d avg.

### Phase 3 — Surface anomalies
Z-score > 2 on any KPI → flag.

### Phase 4 — Email digest
One-screen summary, anomalies first.

## Output contract
```
📊 Analytics — {date}
Sessions 4,212 (+8% vs 7d) · Bounce 42% · ATC 6.1% · CVR 2.8% · AOV $58
Revenue $6,852 (+12%) · Blended ROAS 2.3 · Refunds 2.1%
Email rev share 31% · SEO clicks 1,840 (+4%)
Anomaly: TikTok CPM +180% — flagged for ads-meta tomorrow
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
