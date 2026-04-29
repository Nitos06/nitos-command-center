-- ============================================================
-- 11: Reviews app, widget events tables, and initial stubs
--     for bundles, post-purchase, quiz, affiliates, CS
-- ============================================================

-- ── Reviews ──────────────────────────────────────────────────

create table if not exists reviews (
  id                    uuid primary key default gen_random_uuid(),
  brand_id              uuid references brands(id) on delete cascade,
  shopify_product_id    text,
  shopify_order_id      text,
  customer_email        text,
  customer_name         text,
  rating                int not null check (rating between 1 and 5),
  title                 text,
  body                  text,
  status                text not null default 'pending'
                          check (status in ('pending','approved','rejected')),
  verified_purchase     boolean not null default false,
  shopify_product_title text,
  media_urls            text[],
  reply                 text,
  reply_at              timestamptz,
  imported_from         text, -- 'judgeme' | 'widget' | 'manual' | 'shopify_request'
  created_at            timestamptz not null default now()
);

create index if not exists reviews_product_idx   on reviews (shopify_product_id);
create index if not exists reviews_brand_idx     on reviews (brand_id);
create index if not exists reviews_status_idx    on reviews (status);
create index if not exists reviews_rating_idx    on reviews (rating);

-- ── Review segments ──────────────────────────────────────────

create table if not exists review_segments (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid references brands(id) on delete cascade,
  name             text not null,
  description      text,
  filter_json      jsonb not null default '{}'::jsonb,
  -- {rating_min, rating_max, product_ids[], date_from, date_to, verified_only}
  customer_count   int,
  meta_audience_id text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now()
);

-- ── Email templates (shared across modules) ──────────────────

create table if not exists email_templates (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  name        text not null,
  subject     text not null,
  html_body   text not null,
  category    text, -- 'review_request' | 'campaign' | 'post_purchase' | 'quiz_followup' etc.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Email sends / events (for tracking) ──────────────────────

create table if not exists email_sends (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id),
  template_id uuid references email_templates(id),
  campaign_id uuid,
  recipient   text not null,
  subject     text,
  status      text not null default 'queued'
                check (status in ('queued','sent','failed','bounced')),
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists email_events (
  id       uuid primary key default gen_random_uuid(),
  send_id  uuid references email_sends(id) on delete cascade,
  event    text not null check (event in ('open','click','bounce','unsubscribe')),
  url      text,
  created_at timestamptz not null default now()
);

-- ── Bundles ──────────────────────────────────────────────────

create table if not exists bundles (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid references brands(id) on delete cascade,
  name           text not null,
  description    text,
  discount_type  text not null default 'percentage'
                   check (discount_type in ('percentage','fixed','tiered')),
  discount_value numeric(10,2),
  tiered_rules   jsonb, -- [{min_qty, discount_pct}]
  is_active      boolean not null default true,
  shopify_discount_id text,
  created_at     timestamptz not null default now()
);

create table if not exists bundle_items (
  id         uuid primary key default gen_random_uuid(),
  bundle_id  uuid references bundles(id) on delete cascade,
  product_id text not null,
  product_title text,
  variant_id text,
  quantity   int not null default 1
);

-- ── Post-purchase funnels ─────────────────────────────────────

create table if not exists pp_funnels (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid references brands(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists pp_steps (
  id         uuid primary key default gen_random_uuid(),
  funnel_id  uuid references pp_funnels(id) on delete cascade,
  position   int not null default 0,
  offer_type text not null default 'upsell'
               check (offer_type in ('upsell','downsell','discount_code')),
  product_id text,
  product_title text,
  discount_pct numeric(5,2),
  headline   text,
  body       text
);

create table if not exists pp_conversions (
  id         uuid primary key default gen_random_uuid(),
  funnel_id  uuid references pp_funnels(id),
  step_id    uuid references pp_steps(id),
  order_id   text,
  event      text not null check (event in ('shown','accepted','declined')),
  revenue    numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

-- ── Quiz ──────────────────────────────────────────────────────

create table if not exists quizzes (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists quiz_questions (
  id        uuid primary key default gen_random_uuid(),
  quiz_id   uuid references quizzes(id) on delete cascade,
  position  int not null default 0,
  question  text not null,
  type      text not null default 'single' check (type in ('single','multi'))
);

create table if not exists quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid references quiz_questions(id) on delete cascade,
  label       text not null,
  result_tag  text
);

create table if not exists quiz_responses (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid references quizzes(id),
  customer_email text,
  answers        jsonb not null default '{}'::jsonb,
  result_id      text,
  created_at     timestamptz not null default now()
);

-- ── Affiliates ────────────────────────────────────────────────

create table if not exists affiliates (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid references brands(id) on delete cascade,
  name                text not null,
  email               text not null,
  referral_code       text not null unique,
  shopify_discount_id text,
  commission_type     text not null default 'percentage'
                        check (commission_type in ('percentage','fixed')),
  commission_value    numeric(10,2) not null default 10,
  status              text not null default 'active'
                        check (status in ('active','paused','pending')),
  created_at          timestamptz not null default now()
);

create table if not exists affiliate_clicks (
  id            uuid primary key default gen_random_uuid(),
  referral_code text not null,
  shop          text,
  referrer      text,
  landing_page  text,
  created_at    timestamptz not null default now()
);

create table if not exists affiliate_conversions (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid references affiliates(id),
  order_id      text not null,
  order_value   numeric(12,2),
  commission    numeric(12,2),
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ── Customer Service ──────────────────────────────────────────

create table if not exists cs_conversations (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid references brands(id),
  session_id     text unique,
  customer_email text,
  shop           text,
  status         text not null default 'open'
                   check (status in ('open','resolved','escalated')),
  ai_handled     boolean not null default false,
  satisfaction   int check (satisfaction between 1 and 5),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists cs_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references cs_conversations(id) on delete cascade,
  role            text not null check (role in ('customer','agent','ai')),
  body            text not null,
  created_at      timestamptz not null default now()
);

-- ── connections: add api_key + access_token columns if missing ──

alter table connections
  add column if not exists api_key     text,
  add column if not exists access_token text,
  add column if not exists webhook_secret text;
