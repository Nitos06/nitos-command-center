---
name: dashboard-bridge
description: Aggregator agent. Every 5 min reads every other agent's `state/{agent}/latest-status.json` → builds unified `state/dashboard/feed.json` (snapshot), `timeline.json` (chronological action log), `alerts.json` (pending owner action queue). Health-checks staleness (any agent past expected cron window → status=stale). Pushes KPI history rows to Supabase `agent_kpi_history` for graphs and decision rows to `agent_decisions` for adaptive-learning visibility. The IU dashboard (Next.js in `paidads/app/`) reads these files + Supabase tables — owner sees real-time activity from every agent in one place.
trigger:
  scheduled: "*/5 * * * * Asia/Jerusalem"
  manual: "/dashboard refresh"
mcp_dependencies:
  required:
    - supabase
inputs:
  - state/*/latest-status.json
  - state/*/latest.json
outputs:
  - state/dashboard/feed.json
  - state/dashboard/timeline.json
  - state/dashboard/alerts.json
  - state/dashboard/health.json
references: []
aviv_refs: []
self_heal: skills/_lib/self-heal.md
---

# Dashboard Bridge Agent

Owner mandate: **"everything to connect to our IU dashboard so I or the user will know anything about what the agents are doing."**

Every 5 min — aggregate every agent's status into a unified view the IU reads.

## Process

### Phase 1 — Scan agent dirs

For each `state/{agent}/` directory, read:
- `latest.json` — full output of last run
- `latest-status.json` — summary `{status, headline, kpis, next_run, alerts[]}`

If `latest-status.json` missing → agent not registered yet. Skip but flag in `health.json`.

### Phase 2 — Build feed.json (current snapshot)

```json
{
  "updated_at": "2026-04-27T14:35:00Z",
  "agents": [
    {
      "name": "meta-ads",
      "last_run": "2026-04-27T09:00:00Z",
      "status": "ok",
      "headline": "Spend ₪842 · ROAS 2.74 · 3 scaled / 2 killed / 4 regen",
      "kpis": {"spend": 842, "revenue": 2310, "roas": 2.74},
      "next_run": "2026-04-28T09:00:00Z",
      "alerts": ["1 awaiting approval"]
    },
    { "name": "finance-il", "...": "..." },
    { "name": "seo", "...": "..." }
  ]
}
```

### Phase 3 — Append to timeline.json

Read each agent's `latest.json` for newly-completed actions since last bridge tick. Append entries:
```json
{
  "ts": "2026-04-27T09:04:12Z",
  "agent": "meta-ads",
  "action": "scale",
  "subject": "ad_id 1234 (Hook Rate strong, ROAS 2.8)",
  "delta": "+₪80/day",
  "reasoning": "ROAS 2.8 ≥ 1.5× BE 1.5"
}
```

Trim timeline to last 10,000 entries (full history in Supabase `agent_decisions`).

### Phase 4 — Build alerts.json (pending owner action)

Aggregate every agent's `alerts[]` into one queue, sorted by severity (`crit` → `warn` → `info`). Each entry:
```json
{
  "agent": "meta-ads",
  "severity": "warn",
  "message": "1 scale action awaiting approval ($80/d delta exceeds threshold)",
  "deeplink": "/dashboard/meta-ads/pending-approval",
  "raised_at": "..."
}
```

### Phase 5 — Health check

For each registered agent, check:
- `latest_run` within expected cron window (per `MANIFEST.md` schedule)
- If stale > 1.5× cron interval → `status: stale` + raise alert

Persist `state/dashboard/health.json`:
```json
{
  "agents_total": 16,
  "ok": 14,
  "stale": 1,
  "failed": 1,
  "stale_agents": ["analytics — last run 18h ago, expected 24h"]
}
```

### Phase 6 — Push to Supabase

For each agent's `kpis` block → upsert `agent_kpi_history`:
```sql
insert into agent_kpi_history (agent, ts, kpi_key, kpi_value)
values ('meta-ads', '2026-04-27T09:00:00Z', 'roas', 2.74);
```

For each timeline entry where reasoning present → insert `agent_decisions` row.

## IU Dashboard schema (what UI reads)

| File / Table | UI consumer |
|---|---|
| `state/dashboard/feed.json` | Top-level agent tiles (header) |
| `state/dashboard/timeline.json` | Activity feed (live action log) |
| `state/dashboard/alerts.json` | Pending action badge + queue |
| `state/dashboard/health.json` | Status indicators (green/yellow/red) |
| Supabase `agent_kpi_history` | KPI graphs (last 30d per agent) |
| Supabase `agent_decisions` | Adaptive-learning view ("why did meta-ads kill ad X?") |

## Per-agent dashboard contract (enforced via `_lib/chain-contract.md`)

Every agent MUST write:
- `state/{agent}/latest.json` — full detailed output
- `state/{agent}/latest-status.json` — `{status, headline, kpis, next_run, alerts[]}`
- Insert decision/action rows to Supabase `agent_decisions` for learning

If an agent fails to write `latest-status.json` for 2 consecutive runs → bridge raises `crit` alert.

## Cross-agent views (UI builds from same data)

- **Money:** finance-il P&L + meta-ads spend + email-marketing rev share + analytics blended ROAS
- **Content:** social-instagram + tiktok + youtube + pinterest + seo blog calendar
- **Customers:** customer-service inbox + dm-funnel stats + Mailjet segments
- **Adaptive learning:** what each agent learned this week (from `agent_decisions` aggregation)

## Status digest

```
📡 Dashboard Bridge — {ts}
Agents: 16 (14 ok · 1 stale · 1 failed)
Stale: analytics (last run 18h ago)
Failed: dm-funnel (superprofile connection error)
Alerts queued: 4 (1 crit, 2 warn, 1 info)
Timeline entries this 5min: 23
```


---

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`

Use the Supabase MCP `execute_sql` tool for all inserts. Log in plain English as if reporting to the owner.
