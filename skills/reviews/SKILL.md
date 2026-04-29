---
name: reviews
description: Daily UGC scan + review request emails via SES + segment sync + Meta lookalike export. Runs every day at 06:00 IL. On Shopify order fulfillment webhook → trigger review request email (3-day delay). Scans new reviews for images/videos, AI-scores quality 1–10, surfaces best assets for ads.
trigger:
  scheduled:
    - "0 6 * * * Asia/Jerusalem"    # daily 06:00 — UGC scan + segment sync
  event: "shopify.order.fulfilled"  # review request email (3-day delay)
mcp_dependencies:
  required:
    - supabase
    - shopify
  optional:
    - meta-marketing    # lookalike export
inputs:
  - state/branding/brand-strategy-blueprint.json
  - state/branding/copy-assets.json
outputs:
  - state/reviews/ugc-scan/{date}.json
  - state/reviews/segments.json
  - state/reviews/latest.json
  - state/reviews/latest-status.json
self_heal: skills/_lib/self-heal.md
---

# Reviews Agent

## Process

### Job A — Daily 06:00 — UGC scan + quality scoring

**Phase A.1 — Find new reviews with media**
```sql
SELECT r.*, ugc_assets.id as ugc_id
FROM reviews r
LEFT JOIN ugc_assets ON ugc_assets.review_id = r.id
WHERE r.has_media = true
  AND r.status = 'approved'
  AND ugc_assets.id IS NULL
  AND r.brand_id = $brand_id
ORDER BY r.created_at DESC LIMIT 50;
```

**Phase A.2 — AI quality scoring**
For each media URL (image or video thumbnail):
- Use Claude Vision to score on 1–10 scale: lighting, product visibility, authenticity, ad-worthiness
- Insert into `ugc_assets`:
  ```sql
  INSERT INTO ugc_assets (brand_id, review_id, type, url, quality_score, used_in_ads, meta_ad_id)
  VALUES ($brand_id, $review_id, $type, $url, $score, false, null);
  ```

**Phase A.3 — Flag top assets**
Assets scoring ≥8 → log to `agent_logs` as `action`: "New high-quality UGC: {score}/10 · {url}"

### Job B — Review request emails (on order fulfillment, 3-day delay)

**Phase B.1 — Queue check**
```sql
SELECT o.id, o.customer_email, o.customer_name, o.line_items, o.brand_id
FROM shopify_orders o
LEFT JOIN reviews r ON r.order_id = o.shopify_order_id
WHERE o.fulfilled_at IS NOT NULL
  AND o.fulfilled_at <= now() - INTERVAL '3 days'
  AND r.id IS NULL
  AND o.review_request_sent_at IS NULL
  AND o.brand_id = $brand_id
LIMIT 100;
```

**Phase B.2 — Send via SES**
Call `POST /api/reviews/request` with:
- `order_id`, `customer_email`, `customer_name`, `brand_id`, `product_names` (from line_items)
- SES from address: `brand_settings.ses_sender_email`
- Subject: personalized from brand voice (warm, not corporate)
- Body: photo + video upload encouraged, direct link to widget review form

**Phase B.3 — Mark sent**
```sql
UPDATE shopify_orders SET review_request_sent_at = now() WHERE id = $order_id;
```

### Job C — Segment sync

Rebuild `review_segments` based on current data:
- `5-star`: all 5-star approved reviews
- `with-media`: approved reviews with photos or videos
- `5-star-with-media`: intersection (best for Meta lookalike)
- `negative` (1–2 star): for product feedback analysis
- `verified-purchase`: linked to Shopify order

Insert/update segment rows:
```sql
INSERT INTO review_segments (brand_id, name, filter_criteria, count, updated_at)
VALUES ($brand_id, $name, $filter_json, $count, now())
ON CONFLICT (brand_id, name) DO UPDATE SET count=EXCLUDED.count, updated_at=now();
```

### Job D — Meta lookalike export (when triggered by dashboard)

For `5-star-with-media` segment:
1. Fetch customer emails from matched reviews (via Shopify order lookup)
2. Hash emails SHA256 per Meta spec
3. Create/update Meta Custom Audience via `/api/meta/audiences/sync` (Phase 3B builds this)
4. Update `meta_audiences` row with Meta audience ID

### Cross-cut — Dashboard contract

```json
{
  "status": "ok",
  "headline": "12 UGC assets scored · 8 review requests sent · segments refreshed",
  "kpis": {"ugc_total": 45, "high_quality_ugc": 12, "review_requests_sent_mtd": 89, "avg_rating": 4.7},
  "next_run": "2026-04-30T03:00:00Z",
  "alerts": []
}
```

## Logging Protocol

See `skills/_lib/logging-protocol.md` for the full SQL snippets.

**Required at every run:**
1. INSERT into `agent_runs` on start → save the returned `id` as `$RUN_ID`
2. INSERT into `agent_logs` for every major action/decision/result as it happens
3. UPDATE `agent_runs` on completion with `status`, `headline`, `cost_usd`, `tokens_used`, `kpis`
