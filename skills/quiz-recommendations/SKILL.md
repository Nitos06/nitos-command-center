---
name: quiz-recommendations
description: >
  Builds instant AI-powered product recommendation engines for quizzes.
  Maps quiz answers to Shopify products via tag scoring, creates
  Good/Better/Best tiers, builds bundle recommendations, and displays
  personalized results with 28-35% add-to-cart rates. Triggers on:
  "quiz recommendation", "product recommendation", "quiz results",
  "recommendation engine", "personalized products", "quiz matching".
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Quiz Recommendations — Instant Product Matching Engine

## Quick Reference

| Command | What it does |
|---|---|
| `/quiz-rec map <quiz_id>` | Map quiz options to product tags |
| `/quiz-rec test <answers>` | Test recommendation output for given answers |
| `/quiz-rec bundle <quiz_id>` | Create bundle recommendations per result |
| `/quiz-rec tier` | Set up Good/Better/Best tiering |

## Recommendation Algorithm

**Tag-scoring approach** (runs at `/api/quiz/recommend`):

```
For each quiz answer:
  → look up option_tags (array mapped in quiz_options table)
  → add those tags to a score map { product_tag: count }

Fetch Shopify products for brand
Score each product: sum of matching tags between product.tags and score_map
Sort by score descending
Return top 3: [primary, complementary, premium_upsell]
```

## Result Screen Structure

1. **Headline**: "Based on your answers, we recommend:"
2. **Primary recommendation** card: product image, name, price, "Add to Cart" button
3. **Complementary** card: "Pairs perfectly with your recommendation"
4. **Premium tier** card: "Ready to go all-in? Here's the complete kit"
5. **Social proof**: 2-3 reviews from customers with similar quiz answers
6. **Email/SMS confirmation**: "We emailed your results to [email]"

## Bundle Logic

If quiz goal = "complete routine" or "full solution":
- Create a bundle: primary + 2 complementary items
- Show bundle price with savings highlighted ("Save $X vs. buying separately")
- Bundles achieve 2.4x AOV vs. single-product recommendations

## Tiering (Good/Better/Best)

- **Good**: entry-level, single-product recommendation
- **Better**: primary + one add-on (most popular tier — 62% of customers)
- **Best**: complete kit/bundle with subscription option

## Instant Delivery

The recommendation must be instant (no loading screen > 2 seconds):
1. Quiz submit POSTs to `/api/quiz/submit` → saves response + email contact
2. Simultaneously calls `/api/quiz/recommend` → returns products in < 500ms
3. Results displayed in the same page flow, no redirect

## Metrics to Track

- Recommendation click-through rate (target: 45%+)
- Add-to-cart rate (target: 28%+)
- Purchase conversion from quiz (target: 12–18%)
- AOV from quiz customers vs. non-quiz (target: +25–40%)
- Bundle adoption rate (target: 15%+)
