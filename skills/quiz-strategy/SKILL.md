---
name: quiz-strategy
description: >
  E-commerce product recommendation quiz strategy, design, and optimization.
  Builds high-converting quizzes (5–8 questions), writes questions that achieve
  94%+ completion rates, designs email-gate flows, optimizes AOV lift via
  personalized bundles, and manages zero-party data collection. Replaces
  Octane AI / RevenueHunt functionality. Triggers on: "quiz", "product
  recommendation quiz", "quiz questions", "zero-party data", "quiz funnel",
  "personalization quiz", "octane ai", "revenuehunt".
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Quiz Strategy — E-Commerce Product Recommendation Quizzes

Replaces Octane AI / RevenueHunt. Builds, optimizes, and distributes product recommendation quizzes that collect zero-party data, capture emails, and drive AOV lift.

## Quick Reference

| Command | What it does |
|---|---|
| `/quiz build <brand>` | Full quiz build: questions → email gate → recommendation mapping |
| `/quiz audit <quiz_id>` | Audit existing quiz — completion rates, drop-off, AOV impact |
| `/quiz questions <product_type>` | Write 5–8 high-converting questions for product type |
| `/quiz email-gate` | Design email/SMS gate screen before results |
| `/quiz recommend <answers>` | Map answers to product recommendations |
| `/quiz distribute` | Plan distribution: store homepage, ads, email, social |

## Golden Rules (from 5,000+ quiz deployments)

1. **5–8 questions max** — highest completion rates; beyond 8, drop-off spikes
2. **Lead with fun/engaging questions** — never ask for personal info first
3. **Email gate goes LAST** — place capture on the results gate screen (42% avg opt-in)
4. **Every question must either improve the recommendation or build emotional investment**
5. **Visual options outperform text-only by 23%** — use images when possible
6. **No wrong answers** — every option should feel positive/validating

## Question Types (by completion rate)

1. **Goal question** — "What's your main goal?" (94% completion, always use first)
2. **Type/Category** — classify the customer's situation
3. **Concern/Pain Point** — multi-select, feels empathetic  
4. **Lifestyle** — context building, fun to answer
5. **Preference** — texture, scent, style, color
6. **Visual Selection** — image-based, 23% higher engagement
7. **"Who is this for?"** — self vs. gift (unlock gifting upsells)
8. **Experience Level** — beginner/intermediate/advanced
9. **Budget/Commitment** — frame positively, never judgmentally
10. **Email Capture** — gate screen, place immediately before results

## Quiz Funnel Benchmarks

| Stage | Industry Average | Top Quartile |
|---|---|---|
| Quiz Start Rate (of page visitors) | 8–12% | 25–35% |
| Completion Rate | 60% | 75–85% |
| Email Opt-In (of completers) | 28% | 42–55% |
| Add-to-Cart (from recommendation) | 15% | 28–35% |
| Purchase Conversion | 8–12% | 18–25% |
| AOV Lift vs. non-quiz | +20% | +40% |

## Zero-Party Data Value Exchange

Customers share data when: **output value > input effort**

Formula: 6 well-designed questions → personalized routine recommendation → higher perceived value than any discount.

Activation pipeline:
1. Quiz answers → `quiz_responses` (DB)
2. Email → `email_contacts` + "Quiz Takers" segment (auto via `/api/quiz/submit`)
3. High-intent answers → "Quiz High Intent" segment
4. Answers → Shopify customer tags (e.g. `quiz-oily-skin`, `quiz-beginner`)
5. Segments → email flows → personalized product blocks
6. Email + phone → Meta Custom Audience → retargeting ads showing quiz-result products

## Distribution Strategy

**Priority order:**
1. Homepage hero or sticky popup (highest volume)
2. Collection/category pages (intent-matched)  
3. Email blast to unengaged subscribers (re-engagement)
4. Paid ads — start with retargeting, then cold traffic
5. Instagram/TikTok bio link (link-in-bio quiz CTA)
6. Post-purchase follow-up (upsell opportunity)

## Product Recommendation Logic

Map answers to products using tag-based matching:
- Each quiz option maps to one or more Shopify product tags
- Score products by how many matched tags they accumulate
- Return top 3 by score
- Always include: primary recommendation + 1 complementary + 1 premium upsell

**Bundle enhancement:** if quiz identifies "complete routine" goal → recommend a bundle (2.4x higher AOV vs. single product).

## AOV Lift Tactics

1. **Good/Better/Best tiering** — 62% choose middle or premium when anchored
2. **Complete routine bundles** — 2.4x AOV vs. single product
3. **Subscription positioning** — identify repeat-purchase candidates via answers
4. **Cross-sells** — add complementary items tailored to stated needs
5. Track: AOV, items-per-order, cross-sell conversion rate, bundle adoption %, email revenue attribution
