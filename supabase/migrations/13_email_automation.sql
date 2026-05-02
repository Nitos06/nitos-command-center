-- AUTOMATION QUEUE: real-time triggered emails (abandoned cart, welcome, post-purchase)
create table automation_queue (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  flow_type text not null,          -- 'abandoned_cart' | 'welcome' | 'post_purchase' | 'win_back'
  email text not null,
  customer_name text,
  payload jsonb,                     -- checkout_url, line_items, etc.
  trigger_at timestamptz not null,  -- when to send
  sent boolean default false,
  sent_at timestamptz,
  recovered boolean default false,  -- order was placed, skip this send
  checkout_token text,              -- for abandoned cart dedup
  created_at timestamptz default now()
);
create index on automation_queue (trigger_at, sent, recovered) where not sent and not recovered;
create index on automation_queue (brand_id, email, flow_type);
-- Prevent duplicate abandoned cart entries for the same checkout
create unique index automation_queue_cart_dedup
  on automation_queue(brand_id, checkout_token)
  where checkout_token is not null;

-- POPUP CONFIGS: one per brand/shop
create table popup_configs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade unique,
  headline text default 'Get 10% off your first order',
  subtext text default 'Join our list for exclusive deals.',
  trigger_mode text default 'exit_intent' check (trigger_mode in ('exit_intent', 'delay', 'scroll')),
  delay_seconds int default 8,
  scroll_depth int default 50,
  bg_color text default '#ffffff',
  accent_color text default '#6366f1',
  show_name_field boolean default true,
  button_text text default 'Subscribe & save',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- EMAIL CONTACTS: unified subscriber list (all capture sources)
create table email_contacts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  email text not null,
  name text,
  source text default 'popup',      -- 'popup' | 'quiz' | 'checkout' | 'manual'
  subscribed boolean default true,
  tags text[],
  abandoned_cart_email_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(brand_id, email)
);
create index on email_contacts (brand_id, created_at desc);
create index on email_contacts (brand_id, email);

-- Add missing columns to email_sends
alter table email_sends add column if not exists delivered boolean default true;
alter table email_sends add column if not exists spam boolean default false;
alter table email_sends add column if not exists subject text;
alter table email_sends add column if not exists flow_type text;

-- RLS
alter table automation_queue enable row level security;
alter table popup_configs enable row level security;
alter table email_contacts enable row level security;

create policy "authenticated full access" on automation_queue for all to authenticated using (true) with check (true);
create policy "authenticated full access" on popup_configs for all to authenticated using (true) with check (true);
create policy "authenticated full access" on email_contacts for all to authenticated using (true) with check (true);
