# Email Flows — SES Implementation Guide

> **Sending layer:** Amazon SES v2 via `lib/ses.ts` → `POST /api/email/send`.
> **NO Mailjet.** Flows are stored in the `email_flows` Supabase table as JSON `steps` arrays.
> Triggered by the `automation_queue` table + `/api/email/queue-processor` (runs every 15 min).

---

## How Flows Work

1. An event fires (checkout abandoned, signup, order paid)
2. A row is inserted into `automation_queue` with `flow_type` and `trigger_at`
3. Every 15 min, the queue processor checks for rows where `trigger_at <= now()` and `sent = false` and `recovered = false`
4. For each row, it looks up the flow definition from `email_flows` table → sends via SES → marks `sent = true`
5. If `orders/paid` fires before an abandoned cart email sends → `recovered = true` → email skipped

**Triggers map:**
| flow_type | Triggered by | trigger_at |
|---|---|---|
| `welcome` | `/api/email/capture` (popup, quiz) | now + 1 min |
| `abandoned_cart` | `checkouts/create` Shopify webhook | now + 4 hours |
| `post_purchase` | `orders/paid` Shopify webhook | now + 1 hour |
| `win_back` | Job D nightly query | now |

---

## 4 Mandatory Flows

### 1. Welcome (8 emails / 7–14 days)
- **Purpose:** convert curious visitors, prime future customers
- **Overcomes:** Who is the brand? Legit? Does it work? Worth the price?
- **DB insert:** `flow_type = 'welcome'`, `name = 'Welcome Flow'`, `trigger = 'welcome'`

| # | Email | Delay from prev | Notes |
|---|---|---|---|
| 1 | Discount/offer delivery | 0h (immediate) | Subject + body |
| 2 | Founder story, brand mission | 24h | Personal touch |
| 3 | Brand USPs — why we stand out | 48h | |
| 4 | Discount reminder | 48h | Urgency |
| 5 | Social proof | 48h | Reviews/testimonials/UGC |
| 6 | Educational about product | 72h | |
| 7 | Last-chance discount | 48h | Heavy urgency |
| 8 | Personal "everything okay?" | 72h | Text-only from founder, offer support |

### 2. Cart + Checkout Abandon (8 emails)
- **Key fact:** 70–85% of carts are abandoned
- **Trigger:** Shopify `checkouts/create` webhook fires in real-time
- **First email:** 4 hours after checkout starts (no conversion in 4h = abandoned)
- **DB insert:** `flow_type = 'abandoned_cart'`, `name = 'Abandoned Cart Flow'`, `trigger = 'abandoned_cart'`
- Dynamic content available: `payload.line_items`, `payload.checkout_url`, `payload.total_price`

| # | Email | Delay from checkout | Notes |
|---|---|---|---|
| 1 | Brief reminder — show what's left | 4h | Include line items + checkout URL |
| 2 | Founder nudge | +24h | Personal text-only |
| 3 | Social proof | +48h | Reviews of abandoned product |
| 4 | FAQ / objection handling | +48h | |
| 5 | Discount intro | +72h | Only if needed |
| 6 | More social proof + discount | +72h | |
| 7 | Last-chance urgency | +72h | |
| 8 | "What happened?" | +96h | Founder personal, offer support |

> **Note:** Only email 1 is handled by the webhook → queue. Emails 2–8 are a drip sequence.
> Store all 8 steps in the `steps` JSON array of the `email_flows` row.
> The queue processor currently only sends step 1 (delay_hours=0). For multi-step flows,
> after step 1 is sent, insert the next step into `automation_queue` with `trigger_at = now + step.delay_hours`.

### 3. Post-Purchase (3 emails)
- **Purpose:** reduce buyer's remorse, build community, encourage repeat purchase
- **Trigger:** `orders/paid` webhook → queue processor
- **DB insert:** `flow_type = 'post_purchase'`, `name = 'Post-Purchase Flow'`, `trigger = 'post_purchase'`

| # | Email | Delay | Notes |
|---|---|---|---|
| 1 | Heartfelt thank you + mission + add-to-order | 1h | |
| 2 | Community building, social media links | 72h | |
| 3 | Product education — get the most | 5d | |

### 4. Win-back (4 emails)
- **Trigger:** Job D nightly — query customers with no purchase in 90 days AND `email_contacts.subscribed = true`
- **DB insert:** `flow_type = 'win_back'`, `name = 'Win-back Flow'`, `trigger = 'win_back'`

| # | Email | Delay | Notes |
|---|---|---|---|
| 1 | "We miss you" | 0h | Soft + personal |
| 2 | Curated bestsellers | 48h | For them specifically |
| 3 | Comeback offer | 72h | 15% off |
| 4 | Final goodbye | 72h | Unsub-or-buy bifurcation |

---

## Calendar Building

- Step 1: Insert holidays, product launches, sales
- Step 2: Add supplementary emails (reminders, teasers)
- Step 3: **3 campaigns/week (optimal)**
- Educational : non-educational ratio = **2:1 in educational favor**

## Weekly Campaign Tiering (per owner)

- **Gruns-style** (image-rich, infographics) — 1–2 per week
- **Hybrid** (mixed text+image) — 1 per week
- **Text-only** — used ONLY for ELITE-tier value info; "drive Only the ELITE tier value info through text-only mails"

## ChatGPT Topic-Bank Prompt (verbatim)

> "I have a [niche] brand that sells [products and their purpose]. Our brand is meant to [2-3 sentences of brand info and mission statement / benefits of brand]. Our average customer [5-6 sentences about your customer demographics, their daily lives, their desires, their wants, and their needs]. I want you to give me 3 overarching topics that my brand can create content about. The topics should be very general and tie into our product benefits and the lives of our customer. Then with those 3 overarching topics I want you to create 4 subtopics under each. The subtopics should be very specific and should educate the customer on the topic and potentially position our products as a solution."

Output: 3 macros × 4 micros = 12 microtopics. Each microtopic = one email campaign. Before each: scrape PubMed/Reddit/etc.
