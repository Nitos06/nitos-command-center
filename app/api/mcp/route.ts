/**
 * nitaiecompro MCP endpoint — stateless Streamable HTTP transport.
 * Works on Vercel Edge/Node runtimes with no session state required.
 *
 * Connect from any MCP client:
 *   URL  : https://<your-vercel-domain>/api/mcp
 *   Auth : Authorization: Bearer <MCP_SECRET>   (set env var to enable)
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ── Supabase (lazy — env vars not available at build time) ───────────────────

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Auth guard ────────────────────────────────────────────────────────────────

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.MCP_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// ── MCP server factory ────────────────────────────────────────────────────────

function buildServer() {
  const server = new McpServer({ name: 'nitaiecompro-mcp', version: '0.2.0' });
  const supabase = getSupabase();

  // ── Helpers ────────────────────────────────────────────────────────────────

  function ok(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }
  function fail(e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { content: [{ type: 'text' as const, text: `ERROR: ${msg}` }], isError: true };
  }
  async function run<T>(fn: () => Promise<T>) {
    try { return ok(await fn()); } catch (e) { return fail(e); }
  }

  // ── BRANDS ────────────────────────────────────────────────────────────────

  server.tool('list_brands', 'List all brands with domain, niche, currency, and status.', {}, async () =>
    run(async () => { const { data, error } = await supabase.from('brands').select('*').order('name'); if (error) throw error; return data; })
  );

  server.tool('get_brand', 'Get full details for a single brand.', { brand_id: z.string().optional(), slug: z.string().optional() }, async ({ brand_id, slug }) =>
    run(async () => {
      let q = supabase.from('brands').select('*');
      if (brand_id) q = q.eq('id', brand_id) as typeof q;
      else if (slug) q = q.eq('slug', slug) as typeof q;
      const { data, error } = await (q as any).single();
      if (error) throw error; return data;
    })
  );

  // ── ANALYTICS ──────────────────────────────────────────────────────────────

  server.tool('get_profit_summary', 'Daily or monthly profit data (revenue, spend, margin, MER).', { brand_id: z.string().optional(), period: z.enum(['daily', 'monthly']).default('monthly'), days: z.number().optional() }, async ({ brand_id, period, days }) =>
    run(async () => {
      const view = period === 'daily' ? 'v_daily_profit' : 'v_monthly_profit';
      const col = period === 'daily' ? 'date' : 'month';
      let q = supabase.from(view).select('*').order(col, { ascending: false }).limit(period === 'daily' ? (days ?? 30) : 12);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('get_campaign_performance', 'Campaign spend, ROAS, CPC, CPA, conversions.', { brand_id: z.string().optional(), status: z.string().optional() }, async ({ brand_id, status }) =>
    run(async () => {
      let q = supabase.from('v_campaign_performance').select('*').order('total_spend', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  // ── CONTACTS ───────────────────────────────────────────────────────────────

  server.tool('list_contacts', 'List funnel contacts. Filter by brand or source.', { brand_id: z.string().optional(), source: z.enum(['link_in_bio', 'lead_magnet', 'landing_page', 'auto_dm', 'manual']).optional(), limit: z.number().default(50) }, async ({ brand_id, source, limit }) =>
    run(async () => {
      let q = supabase.from('funnel_contacts').select('*').order('created_at', { ascending: false }).limit(limit);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (source) q = q.eq('source', source) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('add_contact', 'Add a new funnel contact.', { brand_id: z.string(), email: z.string(), source: z.enum(['link_in_bio', 'lead_magnet', 'landing_page', 'auto_dm', 'manual']), first_name: z.string().optional(), last_name: z.string().optional(), phone: z.string().optional(), tags: z.array(z.string()).optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('funnel_contacts').insert({ ...a, tags: a.tags ?? [] }).select().single(); if (error) throw error; return data; })
  );

  // ── LEAD MAGNETS ───────────────────────────────────────────────────────────

  server.tool('list_lead_magnets', 'List lead magnets with view/signup stats.', { brand_id: z.string().optional() }, async ({ brand_id }) =>
    run(async () => {
      let q = supabase.from('lead_magnets').select('*').order('created_at', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_lead_magnet', 'Create a lead magnet (gated resource behind email capture).', { brand_id: z.string(), title: z.string(), description: z.string().optional(), file_url: z.string().optional(), cover_image_url: z.string().optional(), thank_you_url: z.string().optional(), sequence_id: z.string().optional(), is_published: z.boolean().default(false) }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('lead_magnets').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── LINK IN BIO ────────────────────────────────────────────────────────────

  server.tool('list_link_in_bio_pages', 'List link-in-bio pages with their blocks.', { brand_id: z.string().optional() }, async ({ brand_id }) =>
    run(async () => {
      let q = supabase.from('link_in_bio_pages').select('*, link_in_bio_items(*)').order('created_at', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_link_in_bio_page', 'Create a new link-in-bio page.', { brand_id: z.string(), slug: z.string(), title: z.string(), bio: z.string().optional(), bg_color: z.string().default('#ffffff'), accent_color: z.string().default('#6366f1'), is_published: z.boolean().default(false) }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('link_in_bio_pages').insert(a).select().single(); if (error) throw error; return data; })
  );

  server.tool('add_link_in_bio_item', 'Add a block to a link-in-bio page.', { page_id: z.string(), brand_id: z.string(), type: z.enum(['link', 'form', 'text', 'image', 'video', 'divider']), label: z.string(), url: z.string().optional(), position: z.number().default(0) }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('link_in_bio_items').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── AUTO DMs ───────────────────────────────────────────────────────────────

  server.tool('list_dm_triggers', 'List auto-DM triggers for a brand.', { brand_id: z.string().optional(), active_only: z.boolean().default(false) }, async ({ brand_id, active_only }) =>
    run(async () => {
      let q = supabase.from('dm_triggers').select('*').order('created_at', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (active_only) q = q.eq('is_active', true) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_dm_trigger', 'Create an auto-DM trigger rule for Instagram/Facebook.', { brand_id: z.string(), name: z.string(), platform: z.enum(['instagram', 'facebook']).default('instagram'), trigger_type: z.enum(['comment_keyword', 'story_reply', 'post_mention', 'reel_comment', 'dm_keyword']), keywords: z.array(z.string()).optional(), target_post_id: z.string().optional(), reply_message: z.string(), sequence_id: z.string().optional(), is_active: z.boolean().default(true) }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('dm_triggers').insert({ ...a, keywords: a.keywords ?? [] }).select().single(); if (error) throw error; return data; })
  );

  server.tool('toggle_dm_trigger', 'Activate or pause an auto-DM trigger.', { id: z.string(), is_active: z.boolean() }, async ({ id, is_active }) =>
    run(async () => { const { data, error } = await supabase.from('dm_triggers').update({ is_active }).eq('id', id).select().single(); if (error) throw error; return data; })
  );

  // ── EMAIL SEQUENCES ────────────────────────────────────────────────────────

  server.tool('list_email_sequences', 'List Mailjet email sequences with steps and enrollment.', { brand_id: z.string().optional() }, async ({ brand_id }) =>
    run(async () => {
      let q = supabase.from('email_sequences').select('*, email_sequence_steps(*)').order('created_at', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_email_sequence', 'Create a Mailjet-backed email drip sequence.', { brand_id: z.string(), name: z.string(), mailjet_list_id: z.string().optional(), trigger_source: z.enum(['lead_magnet', 'landing_page', 'link_in_bio', 'auto_dm', 'manual']).optional(), is_active: z.boolean().default(true) }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('email_sequences').insert(a).select().single(); if (error) throw error; return data; })
  );

  server.tool('add_email_sequence_step', 'Add an email step (HTML or Mailjet template).', { sequence_id: z.string(), brand_id: z.string(), subject: z.string(), position: z.number().default(1), delay_days: z.number().default(0), preview_text: z.string().optional(), html_body: z.string().optional(), text_body: z.string().optional(), mailjet_template_id: z.string().optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('email_sequence_steps').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── LANDING PAGES ──────────────────────────────────────────────────────────

  server.tool('list_landing_pages', 'List landing pages with status, views, conversions.', { brand_id: z.string().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }, async ({ brand_id, status }) =>
    run(async () => {
      let q = supabase.from('landing_pages').select('id,brand_id,slug,title,status,views,conversions,created_at').order('created_at', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_landing_page', 'Create a landing page.', { brand_id: z.string(), slug: z.string(), title: z.string(), meta_description: z.string().optional(), html_content: z.string().optional(), status: z.enum(['draft', 'published']).default('draft') }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('landing_pages').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── ADS ────────────────────────────────────────────────────────────────────

  server.tool('list_campaigns', 'List ad campaigns across all platforms.', { brand_id: z.string().optional(), platform: z.string().optional(), status: z.string().optional(), limit: z.number().default(50) }, async ({ brand_id, platform, status, limit }) =>
    run(async () => {
      let q = supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(limit);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (platform) q = q.eq('platform', platform) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('list_creatives', 'List ad creatives: testing, scaling, paused, killed, winner.', { brand_id: z.string().optional(), status: z.enum(['testing', 'scaling', 'paused', 'killed', 'winner']).optional(), limit: z.number().default(50) }, async ({ brand_id, status, limit }) =>
    run(async () => {
      let q = supabase.from('creatives').select('*').order('created_at', { ascending: false }).limit(limit);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('log_kill_scale', 'Log a kill/scale decision on a campaign or ad.', { brand_id: z.string(), subject_type: z.string(), subject_id: z.string(), action: z.enum(['kill', 'scale_up', 'scale_down', 'refresh', 'pause', 'resume', 'duplicate']), reason: z.string().optional(), triggered_by: z.string().default('claude'), metrics_snapshot: z.any().optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('kill_scale_log').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── SOCIALS ────────────────────────────────────────────────────────────────

  server.tool('list_social_accounts', 'List all social accounts for a brand.', { brand_id: z.string().optional() }, async ({ brand_id }) =>
    run(async () => {
      let q = supabase.from('social_accounts').select('*').order('followers', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('list_content_calendar', 'List content calendar items.', { brand_id: z.string().optional(), status: z.enum(['idea', 'draft', 'scheduled', 'posted', 'archived']).optional(), limit: z.number().default(20) }, async ({ brand_id, status, limit }) =>
    run(async () => {
      let q = supabase.from('content_calendar').select('*').order('planned_for', { ascending: true }).limit(limit);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('add_content_calendar_item', 'Add a content idea or scheduled post.', { brand_id: z.string(), title: z.string(), format: z.string().optional(), platform: z.string().optional(), hook: z.string().optional(), script_md: z.string().optional(), planned_for: z.string().optional(), status: z.enum(['idea', 'draft', 'scheduled']).default('idea') }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('content_calendar').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── SEO ────────────────────────────────────────────────────────────────────

  server.tool('list_seo_keywords', 'List tracked SEO keywords with rank and volume.', { brand_id: z.string().optional(), active_only: z.boolean().default(true) }, async ({ brand_id, active_only }) =>
    run(async () => {
      let q = supabase.from('seo_keywords').select('*').order('current_rank', { ascending: true });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (active_only) q = q.eq('is_active', true) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('add_seo_keyword', 'Add a keyword to track.', { brand_id: z.string(), keyword: z.string(), intent: z.string().optional(), search_volume: z.number().optional(), current_rank: z.number().optional(), target_rank: z.number().optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('seo_keywords').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── CRO ────────────────────────────────────────────────────────────────────

  server.tool('list_ab_tests', 'List A/B tests with status, winner, uplift.', { brand_id: z.string().optional(), status: z.enum(['draft', 'running', 'paused', 'completed', 'cancelled']).optional() }, async ({ brand_id, status }) =>
    run(async () => {
      let q = supabase.from('ab_tests').select('*').order('created_at', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_ab_test', 'Create an A/B test for a landing page or CRO element.', { brand_id: z.string(), name: z.string(), hypothesis: z.string(), variant_a: z.string().optional(), variant_b: z.string().optional(), metric: z.string().optional(), mde_pct: z.number().optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('ab_tests').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── CS ─────────────────────────────────────────────────────────────────────

  server.tool('list_tickets', 'List customer service tickets.', { brand_id: z.string().optional(), status: z.enum(['open', 'waiting_customer', 'waiting_internal', 'resolved', 'closed']).optional(), priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(), limit: z.number().default(20) }, async ({ brand_id, status, priority, limit }) =>
    run(async () => {
      let q = supabase.from('cs_tickets').select('*').order('created_at', { ascending: false }).limit(limit);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (status) q = q.eq('status', status) as typeof q;
      if (priority) q = q.eq('priority', priority) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_ticket', 'Create a customer service ticket.', { brand_id: z.string(), channel: z.enum(['email', 'ig_dm', 'fb_dm', 'whatsapp', 'chat', 'sms', 'other']), customer_email: z.string().optional(), customer_name: z.string().optional(), subject: z.string().optional(), priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'), tags: z.array(z.string()).optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('cs_tickets').insert(a).select().single(); if (error) throw error; return data; })
  );

  // ── TAXES ──────────────────────────────────────────────────────────────────

  server.tool('list_vat_reports', 'List VAT reports (Israel) — period, sales VAT, input VAT, net due.', { brand_id: z.string().optional() }, async ({ brand_id }) =>
    run(async () => {
      let q = supabase.from('vat_reports').select('*').order('period_start', { ascending: false });
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  // ── ALERTS ─────────────────────────────────────────────────────────────────

  server.tool('list_alerts', 'List unacknowledged alerts across the system.', { brand_id: z.string().optional(), category: z.string().optional(), unacknowledged_only: z.boolean().default(true), limit: z.number().default(20) }, async ({ brand_id, category, unacknowledged_only, limit }) =>
    run(async () => {
      let q = supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(limit);
      if (brand_id) q = q.eq('brand_id', brand_id) as typeof q;
      if (category) q = q.eq('category', category) as typeof q;
      if (unacknowledged_only) q = q.eq('acknowledged', false) as typeof q;
      const { data, error } = await q; if (error) throw error; return data;
    })
  );

  server.tool('create_alert', 'Create an alert for any module.', { brand_id: z.string(), category: z.enum(['ads', 'seo', 'cro', 'socials', 'taxes', 'cs', 'email_sms', 'ecom_builder', 'products', 'funnels', 'system']), severity: z.enum(['info', 'warn', 'crit']).default('warn'), title: z.string(), message: z.string().optional() }, async (a) =>
    run(async () => { const { data, error } = await supabase.from('alerts').insert(a).select().single(); if (error) throw error; return data; })
  );

  server.tool('acknowledge_alert', 'Mark an alert as acknowledged.', { id: z.string() }, async ({ id }) =>
    run(async () => { const { data, error } = await supabase.from('alerts').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; return data; })
  );

  return server;
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}
