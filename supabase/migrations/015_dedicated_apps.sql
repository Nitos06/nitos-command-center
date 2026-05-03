-- 015_dedicated_apps.sql
-- Infrastructure for 7 dedicated Shopify apps: per-app settings, inter-app event bus,
-- quiz referrals, affiliate motivation & outreach, and widget config columns.

-- Per-app settings store
create table if not exists app_settings (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null,
  app_name    text not null,
  config      jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (brand_id, app_name)
);

-- Inter-app event bus
create table if not exists app_events (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null,
  source_app  text not null,
  event_type  text not null,
  payload     jsonb not null default '{}',
  processed   boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_app_events_unprocessed on app_events (brand_id, source_app, processed);

-- Quiz: persist design config + referral tracking
alter table quizzes add column if not exists design_config jsonb default '{}';
alter table quizzes add column if not exists referral_enabled boolean default false;
alter table quizzes add column if not exists referral_reward_type text default 'discount_pct';
alter table quizzes add column if not exists referral_reward_value numeric default 10;

create table if not exists quiz_referrals (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid not null,
  quiz_id        uuid not null,
  referrer_email text not null,
  referee_email  text,
  referral_code  text not null unique,
  converted      boolean default false,
  created_at     timestamptz default now()
);

-- Affiliates: motivation + outreach
create table if not exists affiliate_motivation (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null,
  affiliate_id  uuid not null,
  achievement   text not null,
  tier          text default 'bronze',
  points        integer default 0,
  unlocked_at   timestamptz default now()
);

create table if not exists affiliate_outreach (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null,
  template_name text not null,
  subject       text,
  body          text,
  sent_count    integer default 0,
  created_at    timestamptz default now()
);

-- Gift: widget config
alter table gift_rules add column if not exists widget_config jsonb default '{}';

-- Bundles: widget config
alter table bundles add column if not exists widget_config jsonb default '{}';

-- UGC assets for reviews viral loop
create table if not exists ugc_assets (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null,
  review_id     uuid,
  customer_name text,
  customer_email text,
  photo_urls    jsonb default '[]',
  video_url     text,
  rating        integer,
  product_title text,
  exported_to_meta boolean default false,
  created_at    timestamptz default now()
);
create index if not exists idx_ugc_assets_brand on ugc_assets (brand_id, exported_to_meta);
