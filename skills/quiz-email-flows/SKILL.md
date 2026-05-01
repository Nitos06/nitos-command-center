---
name: quiz-email-flows
description: >
  Builds and optimizes quiz-triggered email and SMS flows. Connects quiz
  zero-party data to email segmentation, creates personalized follow-up
  sequences, and manages Klaviyo/Amazon SES quiz flows. Achieves 47% higher
  open rates, 89% higher click rates, and 156% higher revenue per recipient
  vs. generic flows. Triggers on: "quiz email", "quiz flow", "quiz klaviyo",
  "quiz segments", "quiz nurture", "quiz sms", "post-quiz email".
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Quiz Email Flows

Personalized quiz-triggered email flows outperform generic flows by 3x revenue, 47% higher open rates, 89% higher click rates, and 156% higher revenue per recipient.

## Quick Reference

| Command | What it does |
|---|---|
| `/quiz-email setup <quiz_id>` | Create all 5 core flows for a quiz |
| `/quiz-email segment <quiz_id>` | Build answer-based segments |
| `/quiz-email results-flow` | Create instant results follow-up sequence |
| `/quiz-email welcome <segment>` | Personalized welcome series per quiz result |
| `/quiz-email replenishment` | Timer-based replenishment by stated frequency |

## The 5 Essential Quiz Flows

### 1. Quiz Results Follow-Up (highest priority — send IMMEDIATELY)
- **T+0 min**: "Your personalized results are ready" — show recommendation, strong CTA
- **T+24h**: Social proof for recommended product (reviews, UGC)
- **T+3d**: Educational content tied to their goal/concern
- **T+7d**: Urgency + scarcity ("Only X left of your match")
- **T+14d**: Alternative recommendation if no purchase

**42% average conversion rate on this flow alone.**

### 2. Personalized Welcome Series
Replace generic welcome with quiz-conditional content:
- Split by quiz result/category (e.g., oily vs. dry skin)
- Use dynamic product blocks showing quiz-matched items
- Reference their specific answers: "Since you mentioned acne..."

### 3. Educational Content Flow
- Segment by concern/pain point answers
- Send educational content relevant to their specific issue
- Soft CTA to their recommended product every 2nd email

### 4. Replenishment Reminders
- Ask frequency of use in quiz ("How often do you [use product]?")
- Set replenishment timer accordingly (weekly/monthly/quarterly)
- "You're probably running low on your [product]..." 

### 5. Cross-Sell Flow (post first purchase)
- Triggered 7 days after purchase of quiz recommendation
- Recommend complementary products from quiz data
- "Complete your [routine/setup/collection]..."

## Segmentation Architecture

In the `email_segments` table, create these segments automatically:
- `Quiz Takers` — everyone who completed quiz + email (base segment, auto-created)
- `Quiz High Intent` — answers with high-intent keywords (yes/now/ready/asap)
- `Quiz [Result Type]` — one per result category (e.g., "Quiz Oily Skin", "Quiz Beginners")
- `Quiz Non-Buyers 7d` — completed quiz, no purchase in 7 days → reactivation flow
- `Quiz Converters` — purchased within 30 days of quiz → cross-sell flow

## Implementation (Amazon SES / Email App)

1. Quiz submit → `/api/quiz/submit` → creates contact + "Quiz Takers" segment
2. Answers JSON stored in `email_contacts.custom_fields.quiz_answers`
3. Tags stored in `email_contacts.tags` (e.g., `quiz_taker`, `quiz_oily`, `quiz_beginner`)
4. Trigger flows by filtering `email_contacts` on tags + `source = quiz`

## Key Rules
- **First email within 5 minutes of quiz completion** — intent decays fast
- **Use their words**: reference their actual answers in subject lines
- **Personalized subjects outperform generic by 26%**
- Subject line formula: "Your [result] routine is ready" / "Since you're [concern]..."
- Never send a generic email to a quiz segment — always reference their data
- SMS flows: send results link immediately, cart abandonment at T+1h
