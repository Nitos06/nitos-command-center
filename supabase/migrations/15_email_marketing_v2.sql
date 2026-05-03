-- ═══════════════════════════════════════════════════════════════
-- EMAIL MARKETING V2: Multi-step flows, auto-segmentation,
-- contact events, campaign calendar, deliverability, API keys
-- ═══════════════════════════════════════════════════════════════

-- ─── A) ENHANCED FLOWS: multi-step with delays, conditions, branching ───

alter table email_flows add column if not exists trigger_event text;
alter table email_flows add column if not exists trigger_config jsonb default '{}';
alter table email_flows add column if not exists description text;
alter table email_flows add column if not exists updated_at timestamptz default now();
alter table email_flows add column if not exists stats jsonb default '{}';

create table email_flow_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references email_flows(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  position int not null default 0,
  step_type text not null check (step_type in ('email', 'delay', 'condition', 'split')),
  subject text,
  preview_text text,
  mjml_source text,
  html_compiled text,
  delay_minutes int,
  condition_rules jsonb,
  true_next_step_id uuid,
  false_next_step_id uuid,
  split_variants jsonb,
  sent_count int default 0,
  open_count int default 0,
  click_count int default 0,
  created_at timestamptz default now()
);
create index on email_flow_steps (flow_id, position);

-- Enhanced automation_queue for multi-step flows
alter table automation_queue add column if not exists flow_id uuid references email_flows(id);
alter table automation_queue add column if not exists current_step_id uuid;
alter table automation_queue add column if not exists step_index int default 0;
alter table automation_queue add column if not exists contact_id uuid;

-- ─── B) CONTACT EVENTS: activity timeline ───

create table contact_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  contact_id uuid references email_contacts(id) on delete cascade,
  email text not null,
  event_type text not null,
  event_data jsonb,
  occurred_at timestamptz default now()
);
create index on contact_events (brand_id, email, occurred_at desc);
create index on contact_events (brand_id, event_type, occurred_at desc);
create index on contact_events (contact_id, occurred_at desc);

-- ─── C) AUTO-SEGMENTATION ───

alter table segments add column if not exists type text default 'dynamic';
alter table segments add column if not exists rules jsonb;
alter table segments add column if not exists description text;
alter table segments add column if not exists subscriber_count int default 0;
alter table segments add column if not exists last_evaluated_at timestamptz;
alter table segments add column if not exists auto_evaluate boolean default true;
alter table segments add column if not exists created_at timestamptz default now();

create table segment_memberships (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references segments(id) on delete cascade,
  contact_id uuid not null references email_contacts(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique(segment_id, contact_id)
);
create index on segment_memberships (segment_id) where left_at is null;
create index on segment_memberships (contact_id);

-- RFM + engagement fields on contacts
alter table email_contacts add column if not exists rfm_recency int;
alter table email_contacts add column if not exists rfm_frequency int;
alter table email_contacts add column if not exists rfm_monetary numeric(10,2);
alter table email_contacts add column if not exists rfm_score text;
alter table email_contacts add column if not exists rfm_updated_at timestamptz;
alter table email_contacts add column if not exists last_order_at timestamptz;
alter table email_contacts add column if not exists total_orders int default 0;
alter table email_contacts add column if not exists total_spent numeric(10,2) default 0;
alter table email_contacts add column if not exists avg_order_value numeric(10,2) default 0;
alter table email_contacts add column if not exists last_email_opened_at timestamptz;
alter table email_contacts add column if not exists last_email_clicked_at timestamptz;
alter table email_contacts add column if not exists emails_sent int default 0;
alter table email_contacts add column if not exists emails_opened int default 0;
alter table email_contacts add column if not exists emails_clicked int default 0;
alter table email_contacts add column if not exists shopify_customer_id text;
alter table email_contacts add column if not exists custom_properties jsonb default '{}';

-- ─── D) CAMPAIGN CALENDAR ───

create table campaign_calendar (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  campaign_id uuid references email_campaigns(id),
  title text not null,
  description text,
  scheduled_date date not null,
  scheduled_time time default '10:00:00',
  segment_id uuid references segments(id),
  status text default 'planned' check (status in ('planned', 'brief_ready', 'content_ready', 'scheduled', 'sent', 'cancelled')),
  brief jsonb,
  generated_by text default 'ai',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on campaign_calendar (brand_id, scheduled_date);

-- ─── E) ENHANCED CAMPAIGNS ───

alter table email_campaigns add column if not exists mjml_source text;
alter table email_campaigns add column if not exists html_compiled text;
alter table email_campaigns add column if not exists preview_text text;
alter table email_campaigns add column if not exists calendar_entry_id uuid references campaign_calendar(id);
alter table email_campaigns add column if not exists segment_id uuid references segments(id);

-- ─── F) DELIVERABILITY DAILY ───

create table deliverability_daily (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  date date not null,
  domain text,
  sent int default 0,
  delivered int default 0,
  bounced int default 0,
  complaints int default 0,
  opened int default 0,
  clicked int default 0,
  unsubscribed int default 0,
  unique(brand_id, date, domain)
);
create index on deliverability_daily (brand_id, date desc);

-- Enhanced email_sends
alter table email_sends add column if not exists contact_id uuid;
alter table email_sends add column if not exists flow_step_id uuid;
alter table email_sends add column if not exists message_id text;
alter table email_sends add column if not exists complained boolean default false;

-- ─── G) API KEYS (for Claude Routines) ───

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  key_hash text not null,
  key_prefix text not null,
  name text default 'default',
  scopes text[] default array['campaigns:write', 'calendar:write', 'templates:write', 'flows:read'],
  last_used_at timestamptz,
  created_at timestamptz default now(),
  expires_at timestamptz
);
create index on api_keys (key_hash);

-- ─── RLS ───

alter table email_flow_steps enable row level security;
alter table contact_events enable row level security;
alter table segment_memberships enable row level security;
alter table campaign_calendar enable row level security;
alter table deliverability_daily enable row level security;
alter table api_keys enable row level security;

create policy "authenticated full access" on email_flow_steps for all to authenticated using (true) with check (true);
create policy "authenticated full access" on contact_events for all to authenticated using (true) with check (true);
create policy "authenticated full access" on segment_memberships for all to authenticated using (true) with check (true);
create policy "authenticated full access" on campaign_calendar for all to authenticated using (true) with check (true);
create policy "authenticated full access" on deliverability_daily for all to authenticated using (true) with check (true);
create policy "authenticated full access" on api_keys for all to authenticated using (true) with check (true);
