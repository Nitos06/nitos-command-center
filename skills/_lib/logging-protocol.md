# Logging Protocol (mandatory for every routine)

Every routine MUST log to Supabase so the War Room dashboard reflects live activity.
Use the Supabase MCP `execute_sql` tool for all inserts below.

## 1 — On run start

```sql
INSERT INTO agent_runs (id, agent_name, started_at, status)
VALUES (gen_random_uuid(), '<AGENT_NAME>', now(), 'running')
RETURNING id;
```

Save the returned `id` as `$RUN_ID` — use it for every subsequent log row.

```sql
INSERT INTO agent_logs (run_id, agent_name, type, message)
VALUES ('$RUN_ID', '<AGENT_NAME>', 'start', 'Run started');
```

## 2 — After each major action

Log EVERY significant action individually. Be specific and human-readable.

```sql
INSERT INTO agent_logs (run_id, agent_name, type, message, details)
VALUES (
  '$RUN_ID',
  '<AGENT_NAME>',
  'action',                          -- or 'decision' | 'result' | 'error'
  'Plain English description of what just happened',
  '{"key": "value", "metric": 123}'  -- optional: numbers behind the action, or NULL
);
```

**type guide:**
- `action`   — something was done (posted, scaled, replied, created)
- `decision` — a choice was made with reasoning (killed campaign X because ROAS < 1.5)
- `result`   — outcome of an action (reel got 1,200 views, email open rate 34%)
- `error`    — something failed or was skipped

## 3 — On run complete

```sql
UPDATE agent_runs
SET
  finished_at = now(),
  status      = 'success',          -- or 'failed' | 'partial'
  headline    = 'One-line summary of the entire run, with key numbers',
  cost_usd    = <actual_cost>,       -- numeric, e.g. 0.0142
  tokens_used = <actual_tokens>,     -- integer
  kpis        = '{"roas": 2.3, "spend": 150}'  -- key metrics relevant to this agent
WHERE id = '$RUN_ID';

INSERT INTO agent_logs (run_id, agent_name, type, message)
VALUES ('$RUN_ID', '<AGENT_NAME>', 'complete', 'Run complete — <one-line summary>');
```

## 4 — On error / partial run

```sql
UPDATE agent_runs
SET finished_at = now(), status = 'failed', headline = 'Error: <brief description>'
WHERE id = '$RUN_ID';

INSERT INTO agent_logs (run_id, agent_name, type, message, details)
VALUES ('$RUN_ID', '<AGENT_NAME>', 'error', 'What went wrong', '{"error": "details"}');
```

## Rules

- Replace `<AGENT_NAME>` with the exact skill name (e.g. `meta-ads`, `seo`, `customer-service`)
- Always close the run (step 3 or 4) — never leave status as `running`
- Log actions AS THEY HAPPEN, not all at the end
- Messages must be plain English, written as if reporting to the owner
- Keep `details` JSON flat and small (no nested arrays)
