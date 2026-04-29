/**
 * Shared tool definitions and handlers for nitaiecompro-mcp.
 * Imported by both index.js (stdio) and server-http.js (HTTP+SSE).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function ok(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function err(e) {
  return { content: [{ type: 'text', text: `ERROR: ${e?.message ?? String(e)}` }], isError: true };
}

export const TOOLS = [
  // ── BRANDS ──
  { name: 'list_brands', description: 'List all brands with domain, niche, currency, and status.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'get_brand', description: 'Get full details for a single brand by ID or slug.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, slug: { type: 'string' } } },
  },

  // ── ANALYTICS ──
  {
    name: 'get_profit_summary', description: 'Get daily or monthly profit data for a brand (revenue, spend, margin, MER).',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, period: { type: 'string', enum: ['daily', 'monthly'], default: 'monthly' }, days: { type: 'number' } } },
  },
  {
    name: 'get_campaign_performance', description: 'Get campaign-level performance: spend, ROAS, CPC, CPA, conversions.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, status: { type: 'string' } } },
  },

  // ── FUNNELS: CONTACTS ──
  {
    name: 'list_contacts', description: 'List funnel contacts for a brand. Filter by source.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, source: { type: 'string', enum: ['link_in_bio', 'lead_magnet', 'landing_page', 'auto_dm', 'manual'] }, limit: { type: 'number', default: 50 } } },
  },
  {
    name: 'add_contact', description: 'Add a new funnel contact.',
    inputSchema: { type: 'object', required: ['brand_id', 'email', 'source'], properties: { brand_id: { type: 'string' }, email: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' }, phone: { type: 'string' }, source: { type: 'string', enum: ['link_in_bio', 'lead_magnet', 'landing_page', 'auto_dm', 'manual'] }, tags: { type: 'array', items: { type: 'string' } } } },
  },

  // ── FUNNELS: LEAD MAGNETS ──
  {
    name: 'list_lead_magnets', description: 'List all lead magnets for a brand with view/signup stats.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' } } },
  },
  {
    name: 'create_lead_magnet', description: 'Create a new lead magnet (gated resource behind email capture).',
    inputSchema: { type: 'object', required: ['brand_id', 'title'], properties: { brand_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, file_url: { type: 'string' }, cover_image_url: { type: 'string' }, thank_you_url: { type: 'string' }, sequence_id: { type: 'string' }, is_published: { type: 'boolean', default: false } } },
  },

  // ── FUNNELS: LINK IN BIO ──
  {
    name: 'list_link_in_bio_pages', description: 'List all link-in-bio pages for a brand.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' } } },
  },
  {
    name: 'create_link_in_bio_page', description: 'Create a new link-in-bio page.',
    inputSchema: { type: 'object', required: ['brand_id', 'slug', 'title'], properties: { brand_id: { type: 'string' }, slug: { type: 'string' }, title: { type: 'string' }, bio: { type: 'string' }, bg_color: { type: 'string', default: '#ffffff' }, accent_color: { type: 'string', default: '#6366f1' }, is_published: { type: 'boolean', default: false } } },
  },
  {
    name: 'add_link_in_bio_item', description: 'Add a block (link, form, text, image, video, divider) to a link-in-bio page.',
    inputSchema: { type: 'object', required: ['page_id', 'brand_id', 'type', 'label'], properties: { page_id: { type: 'string' }, brand_id: { type: 'string' }, type: { type: 'string', enum: ['link', 'form', 'text', 'image', 'video', 'divider'] }, label: { type: 'string' }, url: { type: 'string' }, position: { type: 'number', default: 0 } } },
  },

  // ── FUNNELS: AUTO DMs ──
  {
    name: 'list_dm_triggers', description: 'List all auto-DM triggers for a brand.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, active_only: { type: 'boolean', default: false } } },
  },
  {
    name: 'create_dm_trigger', description: 'Create an auto-DM trigger rule for Instagram/Facebook.',
    inputSchema: { type: 'object', required: ['brand_id', 'name', 'trigger_type', 'reply_message'], properties: { brand_id: { type: 'string' }, name: { type: 'string' }, platform: { type: 'string', enum: ['instagram', 'facebook'], default: 'instagram' }, trigger_type: { type: 'string', enum: ['comment_keyword', 'story_reply', 'post_mention', 'reel_comment', 'dm_keyword'] }, keywords: { type: 'array', items: { type: 'string' } }, target_post_id: { type: 'string' }, reply_message: { type: 'string' }, sequence_id: { type: 'string' }, is_active: { type: 'boolean', default: true } } },
  },
  {
    name: 'toggle_dm_trigger', description: 'Activate or pause an auto-DM trigger.',
    inputSchema: { type: 'object', required: ['id', 'is_active'], properties: { id: { type: 'string' }, is_active: { type: 'boolean' } } },
  },

  // ── FUNNELS: EMAIL SEQUENCES ──
  {
    name: 'list_email_sequences', description: 'List all Mailjet email sequences for a brand.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' } } },
  },
  {
    name: 'create_email_sequence', description: 'Create a new Mailjet-backed email drip sequence.',
    inputSchema: { type: 'object', required: ['brand_id', 'name'], properties: { brand_id: { type: 'string' }, name: { type: 'string' }, mailjet_list_id: { type: 'string' }, trigger_source: { type: 'string', enum: ['lead_magnet', 'landing_page', 'link_in_bio', 'auto_dm', 'manual'] }, is_active: { type: 'boolean', default: true } } },
  },
  {
    name: 'add_email_sequence_step', description: 'Add an email step to a sequence (HTML body or Mailjet template ID).',
    inputSchema: { type: 'object', required: ['sequence_id', 'brand_id', 'subject'], properties: { sequence_id: { type: 'string' }, brand_id: { type: 'string' }, position: { type: 'number', default: 1 }, delay_days: { type: 'number', default: 0 }, subject: { type: 'string' }, preview_text: { type: 'string' }, html_body: { type: 'string' }, text_body: { type: 'string' }, mailjet_template_id: { type: 'string' } } },
  },

  // ── FUNNELS: LANDING PAGES ──
  {
    name: 'list_landing_pages', description: 'List all landing pages for a brand with status, views, and conversions.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, status: { type: 'string', enum: ['draft', 'published', 'archived'] } } },
  },
  {
    name: 'create_landing_page', description: 'Create a new landing page.',
    inputSchema: { type: 'object', required: ['brand_id', 'slug', 'title'], properties: { brand_id: { type: 'string' }, slug: { type: 'string' }, title: { type: 'string' }, meta_description: { type: 'string' }, html_content: { type: 'string' }, status: { type: 'string', enum: ['draft', 'published'], default: 'draft' } } },
  },

  // ── ADS ──
  {
    name: 'list_campaigns', description: 'List ad campaigns for a brand across all platforms.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, platform: { type: 'string' }, status: { type: 'string' }, limit: { type: 'number', default: 50 } } },
  },
  {
    name: 'list_creatives', description: 'List ad creatives: testing, scaling, paused, killed, winner.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, status: { type: 'string', enum: ['testing', 'scaling', 'paused', 'killed', 'winner'] }, limit: { type: 'number', default: 50 } } },
  },
  {
    name: 'log_kill_scale', description: 'Log a kill/scale decision on a campaign, ad set, or ad.',
    inputSchema: { type: 'object', required: ['brand_id', 'subject_type', 'subject_id', 'action'], properties: { brand_id: { type: 'string' }, subject_type: { type: 'string' }, subject_id: { type: 'string' }, action: { type: 'string', enum: ['kill', 'scale_up', 'scale_down', 'refresh', 'pause', 'resume', 'duplicate'] }, reason: { type: 'string' }, triggered_by: { type: 'string', default: 'claude' }, metrics_snapshot: { type: 'object' } } },
  },

  // ── SOCIALS ──
  {
    name: 'list_social_accounts', description: 'List all social accounts (Instagram, TikTok, YouTube, etc.) for a brand.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' } } },
  },
  {
    name: 'list_content_calendar', description: 'List upcoming and recent content calendar items.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, status: { type: 'string', enum: ['idea', 'draft', 'scheduled', 'posted', 'archived'] }, limit: { type: 'number', default: 20 } } },
  },
  {
    name: 'add_content_calendar_item', description: 'Add a content idea or scheduled post to the calendar.',
    inputSchema: { type: 'object', required: ['brand_id', 'title'], properties: { brand_id: { type: 'string' }, title: { type: 'string' }, format: { type: 'string' }, platform: { type: 'string' }, hook: { type: 'string' }, script_md: { type: 'string' }, planned_for: { type: 'string' }, status: { type: 'string', enum: ['idea', 'draft', 'scheduled'], default: 'idea' } } },
  },

  // ── SEO ──
  {
    name: 'list_seo_keywords', description: 'List tracked SEO keywords with rank, volume, and target.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, active_only: { type: 'boolean', default: true } } },
  },
  {
    name: 'add_seo_keyword', description: 'Add a keyword to track for a brand.',
    inputSchema: { type: 'object', required: ['brand_id', 'keyword'], properties: { brand_id: { type: 'string' }, keyword: { type: 'string' }, intent: { type: 'string' }, search_volume: { type: 'number' }, current_rank: { type: 'number' }, target_rank: { type: 'number' } } },
  },

  // ── CRO ──
  {
    name: 'list_ab_tests', description: 'List A/B tests for a brand with status, winner, and uplift.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, status: { type: 'string', enum: ['draft', 'running', 'paused', 'completed', 'cancelled'] } } },
  },
  {
    name: 'create_ab_test', description: 'Create an A/B test for a landing page or CRO element.',
    inputSchema: { type: 'object', required: ['brand_id', 'name', 'hypothesis'], properties: { brand_id: { type: 'string' }, name: { type: 'string' }, hypothesis: { type: 'string' }, variant_a: { type: 'string' }, variant_b: { type: 'string' }, metric: { type: 'string' }, mde_pct: { type: 'number' } } },
  },

  // ── CUSTOMER SERVICE ──
  {
    name: 'list_tickets', description: 'List customer service tickets for a brand.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, status: { type: 'string', enum: ['open', 'waiting_customer', 'waiting_internal', 'resolved', 'closed'] }, priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] }, limit: { type: 'number', default: 20 } } },
  },
  {
    name: 'create_ticket', description: 'Create a customer service ticket.',
    inputSchema: { type: 'object', required: ['brand_id', 'channel'], properties: { brand_id: { type: 'string' }, channel: { type: 'string', enum: ['email', 'ig_dm', 'fb_dm', 'whatsapp', 'chat', 'sms', 'other'] }, customer_email: { type: 'string' }, customer_name: { type: 'string' }, subject: { type: 'string' }, priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }, tags: { type: 'array', items: { type: 'string' } } } },
  },

  // ── TAXES ──
  {
    name: 'list_vat_reports', description: 'List VAT reports for a brand (Israel) — period, sales VAT, input VAT, net due, status.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' } } },
  },

  // ── ALERTS ──
  {
    name: 'list_alerts', description: 'List unacknowledged alerts across the system.',
    inputSchema: { type: 'object', properties: { brand_id: { type: 'string' }, category: { type: 'string' }, unacknowledged_only: { type: 'boolean', default: true }, limit: { type: 'number', default: 20 } } },
  },
  {
    name: 'create_alert', description: 'Create an alert for any module. Severity: info, warn, crit.',
    inputSchema: { type: 'object', required: ['brand_id', 'category', 'title'], properties: { brand_id: { type: 'string' }, category: { type: 'string', enum: ['ads', 'seo', 'cro', 'socials', 'taxes', 'cs', 'email_sms', 'ecom_builder', 'products', 'funnels', 'system'] }, severity: { type: 'string', enum: ['info', 'warn', 'crit'], default: 'warn' }, title: { type: 'string' }, message: { type: 'string' } } },
  },
  {
    name: 'acknowledge_alert', description: 'Mark an alert as acknowledged.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  },

  // ── POWER TOOL ──
  {
    name: 'execute_sql', description: 'Execute raw SQL against the nitaiecompro Supabase DB (service role, bypasses RLS).',
    inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' } } },
  },
];

export async function callTool(name, a = {}) {
  try {
    switch (name) {

      case 'list_brands': {
        const { data, error } = await supabase.from('brands').select('*').order('name', { ascending: true });
        if (error) throw error;
        return ok(data);
      }
      case 'get_brand': {
        let q = supabase.from('brands').select('*');
        if (a.brand_id) q = q.eq('id', a.brand_id);
        else if (a.slug) q = q.eq('slug', a.slug);
        const { data, error } = await q.single();
        if (error) throw error;
        return ok(data);
      }

      case 'get_profit_summary': {
        const view = a.period === 'daily' ? 'v_daily_profit' : 'v_monthly_profit';
        const orderCol = a.period === 'daily' ? 'date' : 'month';
        let q = supabase.from(view).select('*').order(orderCol, { ascending: false }).limit(a.period === 'daily' ? (a.days ?? 30) : 12);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'get_campaign_performance': {
        let q = supabase.from('v_campaign_performance').select('*').order('total_spend', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.status) q = q.eq('status', a.status);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }

      case 'list_contacts': {
        let q = supabase.from('funnel_contacts').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 50);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.source) q = q.eq('source', a.source);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'add_contact': {
        const { data, error } = await supabase.from('funnel_contacts').insert({ brand_id: a.brand_id, email: a.email, first_name: a.first_name, last_name: a.last_name, phone: a.phone, source: a.source, tags: a.tags ?? [] }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_lead_magnets': {
        let q = supabase.from('lead_magnets').select('*').order('created_at', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_lead_magnet': {
        const { data, error } = await supabase.from('lead_magnets').insert({ brand_id: a.brand_id, title: a.title, description: a.description, file_url: a.file_url, cover_image_url: a.cover_image_url, thank_you_url: a.thank_you_url, sequence_id: a.sequence_id, is_published: a.is_published ?? false }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_link_in_bio_pages': {
        let q = supabase.from('link_in_bio_pages').select('*, link_in_bio_items(*)').order('created_at', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_link_in_bio_page': {
        const { data, error } = await supabase.from('link_in_bio_pages').insert({ brand_id: a.brand_id, slug: a.slug, title: a.title, bio: a.bio, bg_color: a.bg_color ?? '#ffffff', accent_color: a.accent_color ?? '#6366f1', is_published: a.is_published ?? false }).select().single();
        if (error) throw error;
        return ok(data);
      }
      case 'add_link_in_bio_item': {
        const { data, error } = await supabase.from('link_in_bio_items').insert({ page_id: a.page_id, brand_id: a.brand_id, type: a.type, label: a.label, url: a.url, position: a.position ?? 0 }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_dm_triggers': {
        let q = supabase.from('dm_triggers').select('*').order('created_at', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.active_only) q = q.eq('is_active', true);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_dm_trigger': {
        const { data, error } = await supabase.from('dm_triggers').insert({ brand_id: a.brand_id, name: a.name, platform: a.platform ?? 'instagram', trigger_type: a.trigger_type, keywords: a.keywords ?? [], target_post_id: a.target_post_id, reply_message: a.reply_message, sequence_id: a.sequence_id, is_active: a.is_active ?? true }).select().single();
        if (error) throw error;
        return ok(data);
      }
      case 'toggle_dm_trigger': {
        const { data, error } = await supabase.from('dm_triggers').update({ is_active: a.is_active }).eq('id', a.id).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_email_sequences': {
        let q = supabase.from('email_sequences').select('*, email_sequence_steps(*)').order('created_at', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_email_sequence': {
        const { data, error } = await supabase.from('email_sequences').insert({ brand_id: a.brand_id, name: a.name, mailjet_list_id: a.mailjet_list_id, trigger_source: a.trigger_source, is_active: a.is_active ?? true }).select().single();
        if (error) throw error;
        return ok(data);
      }
      case 'add_email_sequence_step': {
        const { data, error } = await supabase.from('email_sequence_steps').insert({ sequence_id: a.sequence_id, brand_id: a.brand_id, position: a.position ?? 1, delay_days: a.delay_days ?? 0, subject: a.subject, preview_text: a.preview_text, html_body: a.html_body, text_body: a.text_body, mailjet_template_id: a.mailjet_template_id }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_landing_pages': {
        let q = supabase.from('landing_pages').select('id,brand_id,slug,title,status,views,conversions,created_at').order('created_at', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.status) q = q.eq('status', a.status);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_landing_page': {
        const { data, error } = await supabase.from('landing_pages').insert({ brand_id: a.brand_id, slug: a.slug, title: a.title, meta_description: a.meta_description, html_content: a.html_content, status: a.status ?? 'draft' }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_campaigns': {
        let q = supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 50);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.platform) q = q.eq('platform', a.platform);
        if (a.status) q = q.eq('status', a.status);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'list_creatives': {
        let q = supabase.from('creatives').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 50);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.status) q = q.eq('status', a.status);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'log_kill_scale': {
        const { data, error } = await supabase.from('kill_scale_log').insert({ brand_id: a.brand_id, subject_type: a.subject_type, subject_id: a.subject_id, action: a.action, reason: a.reason, triggered_by: a.triggered_by ?? 'claude', metrics_snapshot: a.metrics_snapshot }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_social_accounts': {
        let q = supabase.from('social_accounts').select('*').order('followers', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'list_content_calendar': {
        let q = supabase.from('content_calendar').select('*').order('planned_for', { ascending: true }).limit(a.limit ?? 20);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.status) q = q.eq('status', a.status);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'add_content_calendar_item': {
        const { data, error } = await supabase.from('content_calendar').insert({ brand_id: a.brand_id, title: a.title, format: a.format, platform: a.platform, hook: a.hook, script_md: a.script_md, planned_for: a.planned_for, status: a.status ?? 'idea' }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_seo_keywords': {
        let q = supabase.from('seo_keywords').select('*').order('current_rank', { ascending: true });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.active_only !== false) q = q.eq('is_active', true);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'add_seo_keyword': {
        const { data, error } = await supabase.from('seo_keywords').insert({ brand_id: a.brand_id, keyword: a.keyword, intent: a.intent, search_volume: a.search_volume, current_rank: a.current_rank, target_rank: a.target_rank }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_ab_tests': {
        let q = supabase.from('ab_tests').select('*').order('created_at', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.status) q = q.eq('status', a.status);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_ab_test': {
        const { data, error } = await supabase.from('ab_tests').insert({ brand_id: a.brand_id, name: a.name, hypothesis: a.hypothesis, variant_a: a.variant_a, variant_b: a.variant_b, metric: a.metric, mde_pct: a.mde_pct }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_tickets': {
        let q = supabase.from('cs_tickets').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 20);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.status) q = q.eq('status', a.status);
        if (a.priority) q = q.eq('priority', a.priority);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_ticket': {
        const { data, error } = await supabase.from('cs_tickets').insert({ brand_id: a.brand_id, channel: a.channel, customer_email: a.customer_email, customer_name: a.customer_name, subject: a.subject, priority: a.priority ?? 'normal', tags: a.tags }).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'list_vat_reports': {
        let q = supabase.from('vat_reports').select('*').order('period_start', { ascending: false });
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }

      case 'list_alerts': {
        let q = supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(a.limit ?? 20);
        if (a.brand_id) q = q.eq('brand_id', a.brand_id);
        if (a.category) q = q.eq('category', a.category);
        if (a.unacknowledged_only !== false) q = q.eq('acknowledged', false);
        const { data, error } = await q;
        if (error) throw error;
        return ok(data);
      }
      case 'create_alert': {
        const { data, error } = await supabase.from('alerts').insert({ brand_id: a.brand_id, category: a.category, severity: a.severity ?? 'warn', title: a.title, message: a.message }).select().single();
        if (error) throw error;
        return ok(data);
      }
      case 'acknowledge_alert': {
        const { data, error } = await supabase.from('alerts').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', a.id).select().single();
        if (error) throw error;
        return ok(data);
      }

      case 'execute_sql': {
        const { data, error } = await supabase.rpc('exec_sql', { sql: a.query }).single().catch(() => ({ data: null, error: { message: 'exec_sql RPC not available' } }));
        if (!error) return ok(data);
        return ok({ note: 'Raw SQL via RPC not available. Use the Supabase MCP for direct SQL.', hint: 'mcp__77a79c3b...__execute_sql' });
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err(e);
  }
}
