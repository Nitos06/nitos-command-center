---
name: mjml-email
description: >
  Builds responsive, cross-client HTML emails using MJML framework. Creates
  transactional emails, marketing campaigns, quiz results emails, review
  requests, abandoned cart flows, and welcome sequences. Compiles MJML to
  production HTML for Amazon SES delivery. Triggers on: "email template",
  "html email", "mjml", "email design", "responsive email", "email html",
  "create email", "build email", "email layout", "transactional email",
  "marketing email".
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
---

# MJML Email Builder

Builds responsive, cross-client HTML emails. Compiles MJML → HTML for Amazon SES and other ESPs. Works in Outlook, Gmail, Apple Mail, and all major clients.

## Quick Reference

| Command | What it does |
|---|---|
| `/mjml quiz-results` | Build quiz results email with dynamic product cards |
| `/mjml welcome` | Personalized welcome series template |
| `/mjml review-request` | Post-purchase review request email |
| `/mjml abandoned-cart` | Abandoned cart recovery email |
| `/mjml campaign <brief>` | Marketing campaign email from brief |
| `/mjml compile <file>` | Compile MJML file to production HTML |

## MJML Architecture

```
<mjml>
  <mj-head>           ← metadata, fonts, global styles
  <mj-body>           ← 600px container
    <mj-section>      ← row (horizontal container)
      <mj-column>     ← cell (auto or fixed width)
        <mj-text>     ← text content
        <mj-image>    ← images (always set width)
        <mj-button>   ← CTA buttons
        <mj-divider>  ← horizontal rule
```

## Component Reference

| Component | Use for |
|---|---|
| `<mj-text>` | Body copy, headlines, links |
| `<mj-image>` | Product images, hero, logo |
| `<mj-button>` | Primary CTAs (full-width on mobile) |
| `<mj-divider>` | Section separators |
| `<mj-social>` | Social media icon links |
| `<mj-accordion>` | FAQ sections (interactive in supported clients) |
| `<mj-include>` | Modular partials (header.mjml, footer.mjml) |
| `<mj-spacer>` | Vertical spacing |
| `<mj-section>` | Full-width rows with background colors/images |

## Standard Template (Quiz Results Email)

```mjml
<mjml>
  <mj-head>
    <mj-title>Your Personalized Results</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
      <mj-text font-size="15px" line-height="1.6" color="#111827" />
      <mj-button background-color="#6366f1" color="#ffffff" border-radius="8px" font-weight="600" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f9fafb">
    <!-- Header -->
    <mj-section background-color="#6366f1" padding="24px">
      <mj-column>
        <mj-text color="#ffffff" font-size="20px" font-weight="700" align="center">
          Your Personalized Results Are Ready ✨
        </mj-text>
      </mj-column>
    </mj-section>
    <!-- Product recommendation card -->
    <mj-section background-color="#ffffff" padding="32px 24px">
      <mj-column>
        <mj-text font-size="13px" color="#6b7280">BASED ON YOUR ANSWERS</mj-text>
        <mj-text font-size="22px" font-weight="700">We recommend: {{product_name}}</mj-text>
        <mj-image src="{{product_image}}" width="300px" border-radius="12px" />
        <mj-text>{{product_description}}</mj-text>
        <mj-button href="{{product_url}}">Shop Now — {{product_price}}</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

## Compilation

**Via Bash (node_modules):**
```bash
npx mjml input.mjml -o output.html
```

**Via Node.js (in API route):**
```ts
import mjml2html from "mjml";
const { html, errors } = mjml2html(mjmlString, {
  validationLevel: "strict",   // catch errors early
  sanitizeStyles: true,         // required with Handlebars/Liquid tokens
  beautify: false,
  minify: true,
});
if (errors.length > 0) throw new Error(errors[0].message);
```

## Rules
1. Always wrap content in `<mj-column>` — never put content directly in `<mj-section>`
2. Never nest sections or columns
3. Set explicit width on `<mj-image>` always
4. Use `sanitizeStyles: true` when MJML has `{{ }}` template tokens
5. Validate at `strict` level during development
6. Test all emails in Gmail + Outlook before sending
7. Default mobile breakpoint: 480px (configurable via `breakpoint`)
8. Use `<mj-include>` for reusable header/footer components

## Dynamic Content with Amazon SES

Use Handlebars-style tokens in MJML, then compile to HTML, then pass `TemplateData` to SES:
```ts
const templateHtml = compiledHtml
  .replace(/{{product_name}}/g, "")    // SES handles {{}} natively
  .replace(/{{email}}/g, "");           // via TemplateData in SendTemplatedEmail
```

## Email Types — Standard Flows

| Type | Subject Line Formula | Key Elements |
|---|---|---|
| Quiz Results | "Your [result type] routine is ready ✨" | Product card, recommendation reason, CTA |
| Welcome | "Welcome, [name] — here's what's next" | Brand intro, top products, social proof |
| Review Request | "How's your [product] working for you?" | Star rating widget, 2-tap feedback |
| Abandoned Cart | "You left something behind..." | Cart items, urgency, free shipping nudge |
| Replenishment | "Running low on [product]?" | Reorder button, loyalty discount |
