-- BRAND SETTINGS (per-brand configuration for all agents)
create table brand_settings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade unique,
  shopify_domain text,
  shopify_token_vault_id uuid,
  meta_account_id text,
  ses_sender_email text,
  ses_domain_verified boolean default false,
  gemini_api_key_vault_id uuid,
  brand_bible jsonb,
  cs_rules jsonb,
  tax_bracket_config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on brand_settings (brand_id);

alter table brand_settings enable row level security;
create policy "authenticated full access" on brand_settings for all to authenticated using (true) with check (true);

-- Extend brands table
alter table brands add column if not exists logo_url text;
alter table brands add column if not exists tagline text;
alter table brands add column if not exists tone_of_voice text;

-- TAX BRACKET SNAPSHOTS (Israeli progressive tax tracking)
create table tax_bracket_snapshots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  year int not null,
  month int not null,
  gross_income_ytd numeric(12,2),
  mas_hachnasa_bracket text,
  mas_hachnasa_rate numeric(5,2),
  mas_hachnasa_due_ytd numeric(12,2),
  bituach_leumi_rate numeric(5,2),
  bituach_leumi_due_ytd numeric(12,2),
  monthly_deposit_required numeric(12,2),
  computed_at timestamptz default now(),
  unique(brand_id, year, month)
);
create index on tax_bracket_snapshots (brand_id, year desc, month desc);

alter table tax_bracket_snapshots enable row level security;
create policy "authenticated full access" on tax_bracket_snapshots for all to authenticated using (true) with check (true);

-- INVOICE UPLOADS (scanned / uploaded invoices)
create table invoice_uploads (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  file_url text not null,
  vendor_name text,
  amount numeric(12,2),
  currency text default 'ILS',
  category text,
  extracted_data jsonb,
  status text default 'pending' check (status in ('pending','processed','error')),
  uploaded_at timestamptz default now()
);
create index on invoice_uploads (brand_id, uploaded_at desc);

alter table invoice_uploads enable row level security;
create policy "authenticated full access" on invoice_uploads for all to authenticated using (true) with check (true);

-- EMAIL DELIVERABILITY (daily stats per brand)
create table email_deliverability (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  date date not null,
  sent int default 0,
  delivered int default 0,
  bounced int default 0,
  complaints int default 0,
  opens int default 0,
  clicks int default 0,
  unsubscribes int default 0,
  delivery_rate numeric(5,2),
  unique(brand_id, date)
);
create index on email_deliverability (brand_id, date desc);

alter table email_deliverability enable row level security;
create policy "authenticated full access" on email_deliverability for all to authenticated using (true) with check (true);

-- META AUDIENCES (segment exports to Meta for lookalikes)
create table meta_audiences (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  segment_id uuid references segments(id) on delete set null,
  review_segment_id uuid references review_segments(id) on delete set null,
  meta_audience_id text,
  name text not null,
  size int,
  type text default 'lookalike' check (type in ('custom','lookalike')),
  synced_at timestamptz,
  created_at timestamptz default now()
);
create index on meta_audiences (brand_id);

alter table meta_audiences enable row level security;
create policy "authenticated full access" on meta_audiences for all to authenticated using (true) with check (true);

-- UGC ASSETS (images/videos from reviews for ad creatives)
create table ugc_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  review_id uuid references reviews(id) on delete set null,
  type text check (type in ('image','video')),
  url text not null,
  thumbnail_url text,
  quality_score int,
  used_in_ads boolean default false,
  meta_ad_id text,
  created_at timestamptz default now()
);
create index on ugc_assets (brand_id, quality_score desc);

alter table ugc_assets enable row level security;
create policy "authenticated full access" on ugc_assets for all to authenticated using (true) with check (true);

-- SOCIAL AGENT ACTIVITY LOG
create table social_agent_activity (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  platform text not null,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);
create index on social_agent_activity (brand_id, platform, created_at desc);

alter table social_agent_activity enable row level security;
create policy "authenticated full access" on social_agent_activity for all to authenticated using (true) with check (true);

-- PROMOTIONS (free gift / BOGO / threshold gifts)
create table promotions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  type text not null check (type in ('free_gift','bogo','threshold_gift')),
  name text not null,
  trigger_rules jsonb not null,
  reward_product_id text,
  reward_variant_id text,
  is_active boolean default true,
  shopify_discount_id text,
  created_at timestamptz default now()
);
create index on promotions (brand_id, is_active);

alter table promotions enable row level security;
create policy "authenticated full access" on promotions for all to authenticated using (true) with check (true);
