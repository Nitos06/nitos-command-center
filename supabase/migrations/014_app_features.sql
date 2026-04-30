-- ============================================================
-- 014: Full app feature schema
--      MJML templates, affiliates v2, bulk jobs, quiz v2,
--      reviews v2, CS macros/rules/CSAT, bundles v2,
--      post-purchase v2, cart drawer, promotions
-- ============================================================

-- ── MJML Email Templates ──────────────────────────────────────

create table if not exists mjml_templates (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  name        text not null,
  category    text default 'campaign',  -- campaign | flow | transactional | promotional
  mjml_source text not null,            -- raw MJML markup
  html_output text,                     -- compiled HTML (cached)
  thumbnail   text,                     -- preview image url
  variables   text[],                   -- e.g. ['contact.firstname','order.total']
  tags        text[],
  is_shared   boolean default false,    -- available as template to agent
  created_by  text default 'user',      -- 'user' | 'agent'
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists mjml_templates_brand_idx on mjml_templates(brand_id);

-- ── Affiliates v2 ────────────────────────────────────────────

alter table affiliates
  add column if not exists program_id      uuid,
  add column if not exists tier_id         uuid,
  add column if not exists referral_code   text unique,
  add column if not exists custom_link     text,
  add column if not exists commission_type text default 'percentage', -- percentage | fixed
  add column if not exists commission_pct  numeric(5,2) default 10,
  add column if not exists commission_fixed numeric(10,2),
  add column if not exists total_clicks    int default 0,
  add column if not exists total_orders    int default 0,
  add column if not exists total_revenue   numeric(12,2) default 0,
  add column if not exists total_paid      numeric(12,2) default 0,
  add column if not exists fraud_score     int default 0,
  add column if not exists joined_at       timestamptz default now(),
  add column if not exists last_login_at   timestamptz,
  add column if not exists portal_enabled  boolean default true,
  add column if not exists notes           text;

create table if not exists affiliate_programs (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid references brands(id) on delete cascade,
  name             text not null,
  description      text,
  commission_type  text default 'percentage',
  commission_pct   numeric(5,2) default 10,
  commission_fixed numeric(10,2),
  cookie_days      int default 30,
  min_payout       numeric(10,2) default 50,
  payout_method    text default 'manual', -- manual | paypal | store_credit
  is_active        boolean default true,
  require_approval boolean default true,
  mlm_enabled      boolean default false,
  mlm_levels       int default 2,
  mlm_pct_level2   numeric(5,2) default 5,
  created_at       timestamptz default now()
);

create table if not exists affiliate_tiers (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid references brands(id) on delete cascade,
  program_id     uuid references affiliate_programs(id) on delete cascade,
  name           text not null,           -- Bronze, Silver, Gold
  min_sales      numeric(12,2) default 0,
  commission_pct numeric(5,2) not null,
  perks          text[],
  created_at     timestamptz default now()
);

create table if not exists affiliate_payouts (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  affiliate_id uuid references affiliates(id) on delete cascade,
  amount       numeric(12,2) not null,
  method       text default 'manual',  -- manual | paypal | store_credit
  status       text default 'pending', -- pending | paid | cancelled
  period_start date,
  period_end   date,
  paid_at      timestamptz,
  reference    text,
  notes        text,
  created_at   timestamptz default now()
);

-- ── Bulk Import/Export Jobs (Matrixify) ───────────────────────

create table if not exists bulk_jobs (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  job_type     text not null,  -- import | export
  entity_type  text not null,  -- products | customers | orders | collections | discounts | pages | blog_posts | redirects | metafields | metaobjects | variants | files | menus
  status       text default 'pending', -- pending | processing | completed | failed | cancelled
  update_mode  text default 'merge',   -- new | merge | update | replace | delete | ignore
  file_url     text,
  file_name    text,
  file_format  text default 'csv',     -- csv | xlsx | google_sheets
  total_rows   int,
  processed    int default 0,
  created_rows int default 0,
  updated_rows int default 0,
  failed_rows  int default 0,
  error_log    jsonb default '[]',
  result_url   text,   -- downloadable results file
  scheduled_at timestamptz,
  started_at   timestamptz,
  completed_at timestamptz,
  created_by   text default 'user',
  created_at   timestamptz default now()
);

create table if not exists bulk_job_rows (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references bulk_jobs(id) on delete cascade,
  row_number  int,
  status      text default 'pending',  -- pending | ok | failed | skipped
  entity_id   text,  -- Shopify entity ID after creation
  handle      text,
  action      text,  -- created | updated | deleted | skipped
  error_msg   text,
  data        jsonb
);
create index if not exists bulk_job_rows_job_idx on bulk_job_rows(job_id, status);

-- ── Quiz / Lantern ────────────────────────────────────────────

alter table quizzes
  add column if not exists description    text,
  add column if not exists cover_image    text,
  add column if not exists email_gate     boolean default true,  -- require email before results
  add column if not exists email_gate_pos text default 'before_results', -- before_results | first
  add column if not exists cta_text       text default 'See your results',
  add column if not exists result_type    text default 'product', -- product | score | custom
  add column if not exists embed_code     text,
  add column if not exists klaviyo_list_id text,
  add column if not exists tag_customers  boolean default true,
  add column if not exists published_url  text,
  add column if not exists total_starts   int default 0,
  add column if not exists total_completions int default 0;

alter table quiz_questions
  add column if not exists question_type text default 'single', -- single | multi | text | emoji | image | slider
  add column if not exists image_url     text,
  add column if not exists required      boolean default true,
  add column if not exists logic_rules   jsonb;  -- conditional jump rules

alter table quiz_options
  add column if not exists image_url     text,
  add column if not exists emoji         text,
  add column if not exists weight_json   jsonb;  -- {product_tag: score} for recommendation logic

create table if not exists quiz_product_rules (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid references quizzes(id) on delete cascade,
  brand_id     uuid references brands(id) on delete cascade,
  rule_name    text,
  conditions   jsonb not null,  -- [{tag: 'oily', min_score: 3}]
  product_ids  text[],
  product_tags text[],
  priority     int default 0,
  created_at   timestamptz default now()
);

-- ── Reviews v2 (Judge.me) ─────────────────────────────────────

alter table reviews
  add column if not exists helpful_count  int default 0,
  add column if not exists report_count   int default 0,
  add column if not exists source_url     text,
  add column if not exists imported_id    text,
  add column if not exists coupon_sent    boolean default false,
  add column if not exists coupon_code    text,
  add column if not exists shared_social  text[];  -- ['facebook','instagram']

create table if not exists review_qa (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  product_id   text,
  question     text not null,
  asked_by     text,
  asked_email  text,
  answer       text,
  answered_by  text default 'merchant',
  is_published boolean default false,
  created_at   timestamptz default now(),
  answered_at  timestamptz
);

create table if not exists review_imports (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  source       text not null,  -- judgeme | csv | amazon | etsy | aliexpress
  file_url     text,
  status       text default 'pending',
  total        int,
  imported     int default 0,
  failed       int default 0,
  created_at   timestamptz default now(),
  completed_at timestamptz
);

create table if not exists review_request_settings (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid references brands(id) on delete cascade unique,
  enabled             boolean default true,
  send_after_days     int default 7,
  reminder_after_days int,  -- null = no reminder
  channel             text default 'email',  -- email | sms | both
  email_subject       text default 'How was your order?',
  email_body_mjml     text,
  reward_enabled      boolean default false,
  reward_type         text,   -- discount_pct | discount_fixed | free_product
  reward_value        numeric(10,2),
  min_rating_for_reward int default 4,
  auto_publish        boolean default true,
  auto_publish_min    int default 4,  -- auto-publish if rating >= this
  updated_at          timestamptz default now()
);

-- ── CS Macros + Rules (Gorgias) ───────────────────────────────

create table if not exists cs_macros (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  name        text not null,
  shortcut    text,  -- e.g. '/refund' to trigger
  body        text not null,
  variables   text[],  -- {{customer.name}}, {{order.number}} etc
  channel     text,    -- null = all channels
  tags        text[],
  usage_count int default 0,
  created_at  timestamptz default now()
);

create table if not exists cs_rules (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  name        text not null,
  is_active   boolean default true,
  trigger_on  text not null,  -- ticket_created | message_received | ticket_updated
  conditions  jsonb not null, -- [{field: 'subject', operator: 'contains', value: 'refund'}]
  actions     jsonb not null, -- [{action: 'assign_tag', value: 'refund'}, {action: 'set_priority', value: 'high'}]
  run_order   int default 0,
  times_fired int default 0,
  created_at  timestamptz default now()
);

create table if not exists cs_csat (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  ticket_id    uuid references cs_tickets(id) on delete cascade,
  score        int check (score between 1 and 5),
  comment      text,
  sent_at      timestamptz default now(),
  responded_at timestamptz
);

alter table cs_tickets
  add column if not exists sla_deadline    timestamptz,
  add column if not exists sla_breached    boolean default false,
  add column if not exists shopify_order_id text,
  add column if not exists shopify_customer_id text,
  add column if not exists csat_score      int,
  add column if not exists revenue_impact  numeric(10,2),
  add column if not exists macro_used      uuid;

-- ── Bundles v2 (KaChing) ─────────────────────────────────────

alter table bundles
  add column if not exists bundle_type    text default 'fixed', -- fixed | fbt | volume | bogo | mystery
  add column if not exists widget_title   text,
  add column if not exists widget_subtitle text,
  add column if not exists compare_at_price numeric(10,2),
  add column if not exists total_price    numeric(10,2),
  add column if not exists shopify_discount_id text,
  add column if not exists ab_test_id     uuid,
  add column if not exists orders_30d     int default 0,
  add column if not exists revenue_30d    numeric(12,2) default 0;

create table if not exists quantity_breaks (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid references brands(id) on delete cascade,
  product_id    text not null,  -- Shopify product ID
  product_title text,
  name          text,
  is_active     boolean default true,
  breaks        jsonb not null,  -- [{qty: 2, discount_pct: 10, label: 'Buy 2 save 10%'}, ...]
  badge_text    text,            -- 'Best Value', 'Most Popular'
  created_at    timestamptz default now()
);

create table if not exists cart_drawer_config (
  id                    uuid primary key default gen_random_uuid(),
  brand_id              uuid references brands(id) on delete cascade unique,
  enabled               boolean default true,
  free_shipping_threshold numeric(10,2),
  free_shipping_msg     text default 'Add {{amount}} more for free shipping!',
  free_gift_threshold   numeric(10,2),
  free_gift_product_id  text,
  upsell_enabled        boolean default true,
  upsell_title          text default 'You might also like',
  upsell_product_ids    text[],
  urgency_msg           text,  -- 'Only 3 left in stock!'
  note_enabled          boolean default true,
  primary_color         text default '#000000',
  updated_at            timestamptz default now()
);

-- ── Post-Purchase v2 (KaChing) ────────────────────────────────

alter table pp_funnels
  add column if not exists trigger_type   text default 'all_orders', -- all_orders | product | tag | value_over
  add column if not exists trigger_value  text,
  add column if not exists ai_pick        boolean default false,  -- let AI pick best upsell
  add column if not exists placement      text default 'post_purchase'; -- post_purchase | checkout | thank_you

alter table pp_steps
  add column if not exists step_type      text default 'upsell', -- upsell | downsell | cross_sell
  add column if not exists discount_type  text default 'percentage',
  add column if not exists product_id     text,  -- Shopify product ID
  add column if not exists variant_id     text,
  add column if not exists product_image  text,
  add column if not exists headline       text,
  add column if not exists subheadline    text,
  add column if not exists button_text    text default 'Add to my order',
  add column if not exists decline_text   text default 'No thanks',
  add column if not exists sort_order     int default 0;

-- ── Promotions (Free Gift / BOGO) ────────────────────────────

create table if not exists promotions (
  id                 uuid primary key default gen_random_uuid(),
  brand_id           uuid references brands(id) on delete cascade,
  name               text not null,
  type               text not null,  -- free_gift | bogo | spend_discount | tiered
  is_active          boolean default true,
  trigger_type       text,           -- cart_value | product_count | product_in_cart
  trigger_value      numeric(10,2),
  trigger_product_id text,
  reward_type        text,           -- free_product | discount_pct | discount_fixed
  reward_product_id  text,
  reward_value       numeric(10,2),
  limit_per_customer int,
  total_uses         int default 0,
  starts_at          timestamptz,
  ends_at            timestamptz,
  shopify_price_rule_id text,
  created_at         timestamptz default now()
);
