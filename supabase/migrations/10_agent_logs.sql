-- Agent logs: detailed activity trail written by every routine during execution
create table agent_logs (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null,                -- groups all rows from one run together
  agent_name  text not null,               -- matches routine name: 'meta-ads', 'seo', etc.
  type        text not null                -- 'start' | 'action' | 'decision' | 'result' | 'error' | 'complete'
              check (type in ('start','action','decision','result','error','complete')),
  message     text not null,              -- plain English: what happened
  details     jsonb,                       -- optional numbers/context behind the action
  created_at  timestamptz default now()
);

create index on agent_logs (agent_name, created_at desc);
create index on agent_logs (run_id, created_at asc);
create index on agent_logs (created_at desc);

alter table agent_logs enable row level security;
create policy "authenticated full access" on agent_logs for all to authenticated using (true) with check (true);

-- Agent runs: one row per run, summary level (replaces routine_runs for agent-dashboard use)
create table agent_runs (
  id          uuid primary key default gen_random_uuid(),
  agent_name  text not null,
  started_at  timestamptz default now(),
  finished_at timestamptz,
  status      text default 'running'
              check (status in ('running','success','failed','partial')),
  headline    text,                        -- "Scaled 3 campaigns, killed 1 · $0.14 · 8,200 tok"
  cost_usd    numeric(10,4),
  tokens_used int,
  kpis        jsonb                        -- snapshot of key numbers for that agent
);

create index on agent_runs (agent_name, started_at desc);
create index on agent_runs (started_at desc);

alter table agent_runs enable row level security;
create policy "authenticated full access" on agent_runs for all to authenticated using (true) with check (true);
