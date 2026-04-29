-- ENUMS
create type funnel_contact_source as enum ('link_in_bio','lead_magnet','landing_page','auto_dm','manual');
create type dm_trigger_platform as enum ('instagram','facebook');
create type dm_trigger_type as enum ('comment_keyword','story_reply','post_mention','reel_comment','dm_keyword');
create type landing_page_status as enum ('draft','published','archived');
create type lib_item_type as enum ('link','form','text','image','video','divider');
create type funnel_event_type as enum ('view','click','form_submit','dm_sent','email_opened','email_clicked');

-- 1. link_in_bio_pages
create table link_in_bio_pages (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  slug        text unique not null,
  title       text not null,
  bio         text,
  avatar_url  text,
  bg_color    text default '#ffffff',
  accent_color text default '#6366f1',
  is_published boolean default false,
  views       int default 0,
  created_at  timestamptz default now()
);
create index on link_in_bio_pages (brand_id);

-- 2. link_in_bio_items
create table link_in_bio_items (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid references link_in_bio_pages(id) on delete cascade,
  brand_id    uuid references brands(id) on delete cascade,
  type        lib_item_type not null,
  label       text,
  url         text,
  position    int not null default 0,
  config      jsonb default '{}',
  is_visible  boolean default true,
  clicks      int default 0,
  created_at  timestamptz default now()
);
create index on link_in_bio_items (page_id, position);

-- 3. lead_magnets
create table lead_magnets (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references brands(id) on delete cascade,
  title           text not null,
  description     text,
  file_url        text,
  cover_image_url text,
  thank_you_url   text,
  sequence_id     uuid,
  is_published    boolean default false,
  views           int default 0,
  signups         int default 0,
  created_at      timestamptz default now()
);
create index on lead_magnets (brand_id);

-- 4. landing_pages
create table landing_pages (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid references brands(id) on delete cascade,
  slug             text not null,
  title            text not null,
  meta_description text,
  html_content     text,
  status           landing_page_status default 'draft',
  views            int default 0,
  conversions      int default 0,
  created_at       timestamptz default now(),
  unique (brand_id, slug)
);
create index on landing_pages (brand_id, status);

-- 5. capture_forms
create table capture_forms (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references brands(id) on delete cascade,
  name            text not null,
  source_type     text,
  source_id       uuid,
  mailjet_list_id text,
  sequence_id     uuid,
  redirect_url    text,
  fields          jsonb default '["email","first_name"]',
  submissions     int default 0,
  created_at      timestamptz default now()
);
create index on capture_forms (brand_id);

-- 6. funnel_contacts
create table funnel_contacts (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid references brands(id) on delete cascade,
  email               text not null,
  first_name          text,
  last_name           text,
  phone               text,
  source              funnel_contact_source not null default 'manual',
  source_id           uuid,
  mailjet_contact_id  text,
  tags                text[] default '{}',
  subscribed          boolean default true,
  meta                jsonb default '{}',
  created_at          timestamptz default now(),
  unique (brand_id, email)
);
create index on funnel_contacts (brand_id, source);
create index on funnel_contacts (brand_id, created_at desc);

-- 7. dm_triggers
create table dm_triggers (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid references brands(id) on delete cascade,
  platform         dm_trigger_platform default 'instagram',
  trigger_type     dm_trigger_type not null,
  name             text not null,
  keywords         text[] default '{}',
  target_post_id   text,
  reply_message    text not null,
  sequence_id      uuid,
  is_active        boolean default true,
  trigger_count    int default 0,
  created_at       timestamptz default now()
);
create index on dm_triggers (brand_id, is_active);

-- 8. email_sequences
create table email_sequences (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid references brands(id) on delete cascade,
  name             text not null,
  mailjet_list_id  text,
  trigger_source   text,
  is_active        boolean default true,
  enrolled_count   int default 0,
  created_at       timestamptz default now()
);
create index on email_sequences (brand_id);

-- 9. email_sequence_steps
create table email_sequence_steps (
  id                   uuid primary key default gen_random_uuid(),
  sequence_id          uuid references email_sequences(id) on delete cascade,
  brand_id             uuid references brands(id) on delete cascade,
  position             int not null default 0,
  delay_days           int not null default 0,
  subject              text not null,
  preview_text         text,
  html_body            text,
  text_body            text,
  mailjet_template_id  text,
  sent_count           int default 0,
  open_count           int default 0,
  click_count          int default 0,
  created_at           timestamptz default now()
);
create index on email_sequence_steps (sequence_id, position);

-- 10. funnel_events
create table funnel_events (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  event_type   funnel_event_type not null,
  source_type  text,
  source_id    uuid,
  contact_id   uuid references funnel_contacts(id),
  meta         jsonb default '{}',
  occurred_at  timestamptz default now()
);
create index on funnel_events (brand_id, occurred_at desc);
create index on funnel_events (brand_id, source_type, source_id);

-- RLS
alter table link_in_bio_pages    enable row level security;
alter table link_in_bio_items    enable row level security;
alter table lead_magnets         enable row level security;
alter table landing_pages        enable row level security;
alter table capture_forms        enable row level security;
alter table funnel_contacts      enable row level security;
alter table dm_triggers          enable row level security;
alter table email_sequences      enable row level security;
alter table email_sequence_steps enable row level security;
alter table funnel_events        enable row level security;

create policy "authenticated full access" on link_in_bio_pages    for all to authenticated using (true) with check (true);
create policy "authenticated full access" on link_in_bio_items    for all to authenticated using (true) with check (true);
create policy "authenticated full access" on lead_magnets         for all to authenticated using (true) with check (true);
create policy "authenticated full access" on landing_pages        for all to authenticated using (true) with check (true);
create policy "authenticated full access" on capture_forms        for all to authenticated using (true) with check (true);
create policy "authenticated full access" on funnel_contacts      for all to authenticated using (true) with check (true);
create policy "authenticated full access" on dm_triggers          for all to authenticated using (true) with check (true);
create policy "authenticated full access" on email_sequences      for all to authenticated using (true) with check (true);
create policy "authenticated full access" on email_sequence_steps for all to authenticated using (true) with check (true);
create policy "authenticated full access" on funnel_events        for all to authenticated using (true) with check (true);

-- Add funnels to alert_category enum
alter type alert_category add value 'funnels';
