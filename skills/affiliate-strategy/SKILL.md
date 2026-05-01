---
name: affiliate-strategy
description: >
  Full affiliate program management for Shopify e-commerce. Recruits and
  segments affiliates (influencers, bloggers, customers, coupon sites),
  sets commission structures, manages fraud protection, tracks KPIs,
  writes program agreements, and drives program ROI of $12 per $1 spent.
  Replaces UpPromote / Refersion. Triggers on: "affiliate", "affiliate program",
  "affiliate marketing", "referral program", "influencer affiliate",
  "affiliate management", "affiliate commission", "uppromote", "refersion".
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Affiliate Strategy — Shopify Affiliate Program Management

Manages end-to-end affiliate programs replacing UpPromote/Refersion. Industry benchmark: **$12 revenue per $1 spent**.

## Quick Reference

| Command | What it does |
|---|---|
| `/affiliate setup <brand>` | Full program setup: commission → agreement → recruiting → launch |
| `/affiliate recruit` | Identify and outreach to 30-50 initial affiliates |
| `/affiliate commission <margin%>` | Calculate optimal commission rate from product margin |
| `/affiliate audit` | Audit existing program: active rate, revenue per affiliate, fraud |
| `/affiliate agreement` | Generate full affiliate program agreement (12 clauses) |
| `/affiliate customers` | Customer-to-affiliate enrollment campaign |
| `/affiliate launch-checklist` | Full 5-phase launch checklist |

## 5 Affiliate Partner Types

| Type | Commission | Cookie | Notes |
|---|---|---|---|
| Social KOL / Influencer | 15-30% | 30-60d | Highest quality traffic, needs content brief |
| Blogger / Content | 15-25% | 30d | Best for SEO + evergreen traffic |
| Customer ambassador | Standard + 2-5% | 30d | Highest trust, 16% higher LTV referred customers |
| Coupon / cashback | 10-15% | 7d | High volume, low margin — watch fraud |
| Email / Newsletter | 15-20% | 30d | Warm audience, good for AOV products |

## Commission Rate Formula

```
Net profit per product = Price - COGS - Shipping - Fees
Affiliate commission = Net profit × 30-50%

Example: $80 product, $32 cost = $48 net profit → $14-$24 commission (18-30% of price)
```

## Commission by Industry

| Vertical | Commission Range |
|---|---|
| Beauty / Cosmetics | 15–25% |
| Fashion | 12–20% |
| Health / Wellness | 15–25% |
| Food / Beverage | 10–15% |
| Electronics | 5–12% |
| Home / Garden | 10–18% |

## Cookie Duration by AOV

| Price Point | Cookie Duration |
|---|---|
| Under $50 (impulse) | 7–14 days |
| $50–$200 (standard) | 30 days |
| $200–$500 (considered) | 60 days |
| $500+ (high-ticket) | 90 days |

## Program Prerequisites (Before Launch)

| Metric | Minimum | Ideal |
|---|---|---|
| Product margin | 30% | 50%+ |
| Monthly orders | 50 | 200+ |
| Store conversion rate | 1% | 2-3% |
| Product reviews | 10+ | 50+ |
| Average order value | $30 | $75+ |

## 90-Day Revenue Milestones

| Month | Expected Revenue |
|---|---|
| Month 1 | $200–$800 |
| Month 2 | $800–$2,000 |
| Month 3 | $1,500–$3,500 |

**Active affiliate ratio target:** 20-30% of total affiliates should have at least 1 sale.
**Revenue per active affiliate target:** $100+/month.

## KPIs to Track

1. Click volume and traffic quality
2. Conversion rate (by affiliate and by program)
3. Revenue and AOV from affiliate traffic
4. ROI = (Revenue - Commission) / Commission × 100
5. Customer lifetime value of referred customers
6. Active affiliate ratio (target: 20-30%)
7. Fraud rate (industry average: 17% of affiliate traffic — block self-referrals)

## Fraud Protection (All 4 Required)

1. **Self-referral blocking** — affiliates cannot buy through their own link
2. **Anti-coupon-leak** — detect when codes appear on unauthorized coupon sites
3. **IP duplicate detection** — flag same IP for multiple conversions
4. **Holding period** — 30-60 days before payout (covers refund window)

## Affiliate Agreement — 12 Required Clauses

1. Program overview (independent contractor status)
2. Eligibility (age 18+, original content requirement)
3. Commission structure (rate, exclusions, holding period)
4. Payment terms (monthly on 15th, $25 minimum, method)
5. Tracking and attribution (cookie duration, last-click model)
6. FTC disclosure requirements (mandatory #ad/#sponsored)
7. Brand and content guidelines (no false claims)
8. Prohibited activities (8 specific violations — see below)
9. Coupon code policy (share only with own audience)
10. Confidentiality (rate and data protection)
11. Termination (14-day notice, final payout within 30 days)
12. Limitation of liability

**8 Prohibited Activities:**
- Spam / unsolicited messages
- Trademark bidding in paid ads
- Posting codes on coupon aggregator sites
- Creating fake reviews
- Cookie stuffing or forced clicks
- Self-referral purchasing
- Misleading product claims
- Unauthorized use of brand assets

## Customer-to-Affiliate Enrollment

**6 Enrollment Methods (by effectiveness):**
1. Post-purchase CTA (highest — lowest effort)
2. Post-delivery email sequence (Days 3, 7, 14)
3. Review follow-up trigger
4. Account page CTA
5. Unboxing insert card
6. Loyalty program bridge

**Day 7 email subject formula:** "Earn [X]% sharing [Product] with friends."

**Expect:** 10-20 active customer affiliates per 1,000 monthly customers.
**Commission boost:** Standard rate + 2-5% for customer ambassadors.

## When to Hire an Affiliate Manager

- 100+ active affiliates, OR
- $20,000+/month in affiliate revenue, OR
- Self-management exceeds 3-5 hours/week

**Manager cost:** $2,000-$5,000/month. **Expected uplift:** 2-3x revenue.
