"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   EXACT 1-TO-1 replica of the Google Doc
   Every word, every bullet, every URL preserved verbatim.
───────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    number: "1.",
    title: "Competitor research:",
    intro: `When we want to do competitor research we will use the output of section "1" to make this section work, we will use claude coworker or claude code with playwright mcps (which is better?)
We will start by prompting the following:`,
    steps: [
      {
        label: "Prompt 1",
        content: `claude the product i sell is[X] and as of now i don't have any market research , branding, website or knowledge. Imagine you are a combination of the great founders of competitors research method (Philip Kotler , jack trout , mciheal porter , dan kennedy). First, go and find at least 3 direct competitors , 3 indirect competitors and 3 Aspirational Competitors. For every brand (competitor) you have found, "write" their: target audience (assumption), main promise, brand angle, main offer, upsells\\crosells , guarantees, scarcity, emotion they target, landing page style (CTA…), creatives and ads (hooks, angles, format, repeated creatives (very important), amount of running ads, product price, revenue assumption (Revenue ≈ Ad Spend × (AOV × CVR ÷ CPC)).

*after user checked if approved go next`,
      },
      {
        label: "Prompt 2",
        content: `you are Dan Kennedy, search meta ads for competitors, use at least 5 different keywords and variations. Any brand that's running ads (10+ is better) (minimum 6\\7) is means thats working. Find their page transpercacy and check to make sure their website page is not really new (older - better). Do the same on tiktok and google.For every brand (competitor) you have found, "write" their: target audience (assumption), main promise, brand angle, main offer, upsells\\crosells , guarantees, scarcity, emotion they target, landing page style (CTA…), creatives and ads (hooks, angles, format, repeated creatives (very important), amount of running ads, product price, revenue assumption (Revenue ≈ Ad Spend × (AOV × CVR ÷ CPC)).`,
      },
      {
        label: "Prompt 3",
        content: `from all the competitors available you have found, do a pattern recognition research and try to find and extract the patterns`,
      },
    ],
  },
  {
    number: "2.",
    title: "Market research:",
    intro: "",
    steps: [
      {
        label: "Prompt #1",
        content: `You are my expert copywriter, and you specialize in writing highly persuasive marketing copy in a Direct Response style for my e-commerce brand. We sell this product (this is a competitor's website, but I sell the exact same product): [Insert the competitor's product page URL]. I want you to analyze it and share your thoughts with me.`,
      },
      {
        label: "Prompt #2",
        content: `Great job! I am going to send you two documents that teach how to conduct in-depth research on your product in order to write high-level, persuasive marketing copy. Please analyze them and share your thoughts with me: https://docs.google.com/document/d/17xBN1-gCTJCP3EMFPGIBS4x0r_mz-Jun/edit?usp=sharing&ouid=104595503267740297362&rtpof=true&sd=true
https://docs.google.com/document/d/1tCuhEFYt_vDsu4wUfyR19bpDOdzYjQ4t/edit?usp=sharing&ouid=104595503267740297362&rtpof=true&sd=true`,
      },
      {
        label: "Prompt 3",
        content: `Excellent, now that you fully understand how to perform research, I want you to create a comprehensive prompt for the Deep Research tool so it can actually conduct the research for this product. Please be as specific as possible to receive the highest quality research. I am going to sell this product to an [X] audience. Additionally, specify that you want Deep Research to consolidate all findings into one document, with a minimum length of 6 pages.`,
      },
      {
        label: "Prompt 4",
        content: `Amazing work! Now that you have fully completed the research phase, I want you to fill out the following Customer Avatar Worksheet template: https://docs.google.com/document/d/1rYNvNd_2-r-1rpb3CST68RxdnOUXzXgX/edit?usp=sharing&ouid=104595503267740297362&rtpof=true&sd=true`,
      },
      {
        label: "Prompt 5",
        content: `Excellent work! Now that you have finished this, I want you to fill out the Offer Brief document template for this product.https://docs.google.com/document/d/1RF9lI60AtBRfaLkQF64oKG_7Q1XD6pf2/edit?usp=sharing&ouid=104595503267740297362&rtpof=true&sd=true`,
      },
      {
        label: "Prompt 6",
        content: `using my avatar template you filled lately and using Alex Hormozi's dream outcome framework, please help me find and define my customers primary targets when purchasing. Please provide me with: 1) their primary dream outcome in one sentence 2) how this outcome changes their status 3) the deeper emotional reason bheind theyre desire. Then write me a dream outcome steatment to use at the foundation of my entire offer`,
      },
      {
        label: "Prompt 7",
        content: `"My avatar is [paste avatar]. Their dream outcome is [paste dream outcome]. Using Hormozi's obstacle mapping method, list every single thing standing between my customer and their result. For each obstacle break it down across 4 dimensions: likelihood of achievement, effort and sacrifice, time delay, and perceived value. Give me at least 15 obstacles mapped across all 4 dimensions."`,
      },
      {
        label: "Prompt 8",
        content: `"Here is my obstacle list: [paste from previous prompt]. Using Hormozi's solution mapping method, reverse every obstacle into a solution. Format each as: PROBLEM → SOLUTION. Then for each solution, tell me the best delivery vehicle, checklist, video, template, live call, community, or done-for-you asset. The goal is to leave my customer with zero reasons left to say no."`,
      },
      {
        label: "Prompt 9",
        content: `"identify the silent frustration - the thing customers hate no one is talking about" (provide claude 1000+ competitors\\reddit 1 - 5 star reviews.)`,
      },
    ],
  },
  {
    number: "3.",
    title: "Product Research:",
    intro: "",
    steps: [
      {
        label: "Step 1 — AI Product Research",
        content: `You are an expert at finding winning products. Based on our competitor research and market research — with full research of every opportunity and aspect in our niche — do a product research and find the overall products we need to aim to sell on our website.

Find 10 products. Not specific products but overall 10 product categories/directions.

Also add 10 ideas for products that don't seem to appear online but you have an idea for — products that fit into the same category that could be created for the first time.

*After user reviews and approves — move to Step 2`,
      },
      {
        label: "Step 2 — Source on 1688 / Alibaba / CJDropshipping",
        content: `Based on the 10 product directions from Step 1, go and find real products on:

• 1688.com → focus on cost + supplier quality
• Alibaba.com → focus on bulk pricing + customization options
• CJDropshipping.com → focus on ready-to-test products + faster shipping

For each platform, find the best matching products and note: supplier rating, MOQ, estimated cost, shipping time, and customization options.

*Compile your findings and send them to the coworker (Step 3) for evaluation`,
      },
      {
        label: "Step 3 — Coworker Evaluation",
        content: `Send your sourcing findings to coworker with this prompt:

"Again, follow the table of rules of finding a winning product below and tell me what you think of my findings. Rate each product from 1 to 10."

🔎 Winning Product Criteria (Ecom Sourcing)

#  | Rule                        | What to Look For                                              | Why It Matters
1  | Solves a real problem        | Clear pain (e.g. saves time, reduces stress, fixes inconvenience) | Problem-driven products sell easier than "nice to have"
2  | Strong "wow" factor          | Visually impressive or instantly understandable benefit       | Helps with ads (especially TikTok/UGC)
3  | Price vs cost margin         | At least 3x markup (e.g. $8 cost → $24+ sell)                | Leaves room for ads + profit
4  | Not saturated (yet)          | Some competitors exist, but not everywhere                    | You want validation, not overcrowding
5  | Easy to ship                 | Lightweight, small, not fragile                               | Reduces refunds + shipping headaches
6  | No brand dominance           | Not controlled by big brands                                  | Hard to compete if customers trust existing brands
7  | Emotion-driven               | Triggers fear, frustration, vanity, convenience               | Emotional buying = higher conversion
8  | Repeat potential or upsells  | Can bundle or sell variations                                 | Increases AOV (average order value)
9  | Great ad potential           | Can create great ads and a lot of media                       | Content is the fuel for paid growth
10 | Clear target audience        | Easy to say "this is for X people"                            | Makes marketing much easier
11 | Customization potential      | Branding, packaging, variations                               | Helps you stand out from competitors
12 | Not easily found locally     | Hard to buy in nearby stores                                  | Reduces price comparison
13 | Longevity balance            | Not just a 2-week trend                                       | More stable business
14 | Low return risk              | Simple usage, low defect chance                               | Protects your margins

─────────────────────────────────────────
How to actually use this (important):

When you're browsing:
• On 1688 → focus on cost + supplier quality
• On Alibaba → focus on bulk pricing + customization
• On CJdropshipping → focus on ready-to-test products + faster shipping`,
      },
    ],
  },
  {
    number: "4.",
    title: "Branding:",
    intro: "",
    steps: [
      {
        label: "Prompt 1",
        content: `You are a senior eCommerce & dropshipping brand, a high-performance, direct-response e-commerce brand strategist with deep experience turning unknown dropshipping stores into real, trustworthy DTC brands.
You understand:
Paid ads psychology (Meta & TikTok)
Impulse buying behavior
Trust signals in low-attention environments
How to make a dropshipping store feel like a legit brand, not a scam
You think like someone hired instead of a professional ecom branding agency.

________________

Context
We are building a dropshipping brand selling physical products.
The goal of branding is to:
Instantly build trust
Increase conversion rate
Increase perceived value
Reduce refund & chargeback risk
Make the brand feel real and memorable

Branding must serve performance first (ads → product page → checkout).

________________

Inputs (Required)
If any input is missing, stop and ask for it.
1. Product category & price range
2. Target customer (age, gender, mindset)
3. Core pain or desire this product solves
4. Emotional triggers (fear, status, comfort, speed, confidence, etc.)
5. Competitors & similar products
6. Traffic source (TikTok / Meta / Google)
7. Desired brand vibe (premium, viral, clean, aggressive, minimal, etc.)

________________

Your Deliverables
1. Brand Positioning
   * What problem we solve better than others
   * Why this brand feels safer to buy from
   * What makes us different from AliExpress clones

________________

2. Core Brand Idea
      * One simple, powerful brand concept
      * The "enemy" (cheap quality, scams, bad experiences)
      * The transformation the customer gets

________________

3. Brand Personality
         * 3–4 traits (e.g. clean, confident, modern, helpful)
         * How the brand talks vs how it never talks

________________

4. Messaging Framework
            * Main value proposition
            * 3 key benefits (emotional + functional)
            * Objection killers (shipping, quality, refunds, legitimacy)

________________

5. Tone of Voice
               * Writing style rules
               * Forbidden words (e.g. "cheap", "best ever", hype BS)
               * Example:
                  * Homepage headline
                  * Product page hook
                  * Ad opening line

________________

6. Dropshipping Brand Story
                     * Why this brand exists (problem → solution)
                     * Why customers should trust us
                     * Simple, believable origin story

________________

7. Visual Direction (Conceptual)
                        * Store look & feel
                        * Color psychology for trust
                        * Typography style
                        * Product image & UGC style guidance

________________

8. Brand Trust System
                           * Trust signals to include (policies, guarantees, reviews)
                           * What makes the store feel "legit"
                           * What instantly kills trust in dropshipping stores

________________

Rules
                              * No fake luxury fluff
                              * No generic dropshipping advice
                              * Everything must increase trust or conversion
                              * Think like a brand that wants long-term payouts, not a 2-week run
                              * Brand Guardrails (What we are NOT): >
                              * 1. No 'Beige Trap': Do not use safe, corporate, generic language. We are bold, gritty, and polarizing
                              * 2. No 'Trend Chasers': Anchor the brand, not fleeting TikTok aesthetics.
                              * 3. No 'Kitchen Sink': Do not dilute the message with 10 different value props. Focus relentlessly on our 4 UVP'S
                              * 4. No 'Copycats': Do not mimic standard dropshippers who use fake lights and neon colors. Maintain our raw, film-grain, anti-corporate visual identity.

________________

Output Style
                                 * Clear
                                 * Practical
                                 * Conversion-focused
                                 * Written like a real internal brand doc"`,
      },
      {
        label: "Prompt 2",
        content: `2) The Brand Strategy Blueprint is approved. Now, step out of the 'Strategist' role and become a Senior Direct Response E-commerce Copywriter and Brand Architect.
Your job is to execute the approved brand strategy and write the actual, finalized, ready-to-publish copy for the ENTIRE business ecosystem.
Strict Instructions:
                                    * Use the Context: Rely entirely on the market research documents, the defined 'enemy', the target avatar, and the Brand Strategy Blueprint we just finalized.
                                    * Tone: Maintain the exact brand personality defined in the strategy. No generic e-commerce jargon.
                                    * Format: Provide the finalized copy for all 25 deliverables listed below.

--- PHASE 1: CORE BRAND ASSETS (The Anchor) ---
1. The Brand Tagline: 3-6 words that sum up our ultimate value proposition.
2. The Elevator Pitch: A 2-sentence summary of who we are, what we do, and why we are different from shady dropshippers and corporate retail.
 3. The Brand Manifesto: A punchy, 150-word emotional declaration of our beliefs. This is the 'Us vs. Them' battle cry for our target audience.

--- PHASE 2: THE STOREFRONT (Homepage & Navigation) ---
4. Hero Section Headline: Max 8 words. Must stop them in their tracks.
 5. Hero Section Sub-headline: Max 15 words supporting the main claim and introducing our core unique mechanism.
 6. Hero CTA Button: Not just 'Shop Now'. Make it action-oriented.
7. The Trust Bar: Micro-copy for 3 icons under the hero section focusing on sizing, shipping, and quality.
 8. Category Hooks: 1-sentence hooks for our 3 main product categories (e.g., Retro, Modern, International).
9. Social Proof Section Header: A strong headline introducing our UGC/Customer reviews.

--- PHASE 3: THE CONVERSION ENGINE (Product Page) ---
10. Universal Product Description Hook: A 2-sentence template that makes the product feel like a curated masterpiece.
11. The Core Mechanism Explainer: A high-trust paragraph sitting next to the size selector explaining our specific sizing guarantees and quality control.
12. The Shipping & Logistics Accordion: Radically transparent copy about shipping times, tracking, and customs/VAT guarantees.
 13. Objection-Killing FAQ: Write the 3 most common questions a skeptical dropshipping buyer has, and answer them in our brand voice.

--- PHASE 4: CHECKOUT & RETENTION (Friction Killers) ---
14. Cart Drawer Micro-Copy: A 1-sentence reassurance message to reduce cart abandonment.
15. Checkout Page Guarantee: An 'Iron-Clad' 2-sentence guarantee placed near the credit card input field.
 16. Post-Purchase 'Thank You' Page: Order confirmation copy that sets expectations and teases the upcoming viral loop.

--- PHASE 5: THE BACKEND (Email & SMS Automations) ---
17. Welcome Email #1 (The Initiation): Subject line + Body copy delivering any promised incentive and officially welcoming them to the brand.
18. Welcome Email #2 (The Founder's Mission): Subject line + Body copy explaining why this brand was built and the 'enemy' we are fighting against.
19. Abandoned Cart Email #1: Subject line + Body copy. High urgency, low pressure, reminding them of our core guarantees (sizing/shipping).
20. The Viral Loop Email (Post-Delivery): Subject line + Body copy incentivizing them to post User Generated Content (UGC) wearing the product in exchange for a reward.

--- PHASE 6: TOP OF FUNNEL (Acquisition) ---
21. Video Ad Script (UGC Style): A 30-second TikTok/Shorts script. Include the Visual/Action, the Hook (first 3 seconds), the Body (attacking the pain points), and the CTA.
 22. Native Social Ad Copy: Primary text and Headline for a static image ad targeting our core demographic. Focus on the frustration of the current market.
23. Retargeting Ad Copy: A short, punchy ad aimed at people who visited the site but didn't buy, leaning heavily on trust and our guarantees.

--- PHASE 7: CUSTOMER EXPERIENCE (CX) ---
24. The Unboxing Insert Card: The exact text for the physical card inside the mailer, hyping the quality and pushing the UGC viral loop instructions.
25. Customer Support Macro (Shipping Inquiry): A template for customer service to use when a customer asks 'Where is my order?'. It must be empathetic, transparent, and completely aligned with our brand voice (not corporate robot speak).`,
      },
    ],
  },
  {
    number: "5.",
    title: "Building websites:",
    intro: `When we are want to build website we will want to use the 4 steps to generate the final output.
The first move is to prompt to claude the following`,
    steps: [
      {
        label: "Prompt 1",
        content: `"I want to build a website using cloud design, and I'm looking for some inspiration on the type of website I should build. the product i sell is[X], the brand rules are[X], the marketing research we did and the potential avatar of a customer are [X] & [X], our competitors we found from the competitors research are [X]. What should the hero section and the actual copy be like? What should the vibe be like? Help me build an example brand website and give me a spec for this website. Every website should follow at least 75% of this following building rules [X].

*If agreed by user - follow to next`,
      },
      {
        label: "Step 2 — Create Visuals & Animations",
        content: `Use KIE AI to create animated images and add them to Claude Design.
Use Jitter Videos AI for motion graphics and animated sections.
Use Gruns Emails for infographics and visual assets.

Add all created visuals into Claude Design alongside the layout spec from Prompt 1.`,
      },
      {
        label: "Step 3 — Convert to Shopify Theme Code",
        content: `Once the design is approved in Claude Design, request the full code export and then prompt:

"You are a Shopify theme developer. Convert this entire design to a valid Shopify theme. Specifically:
- Replace all hardcoded product titles, prices, images, and descriptions with the correct Shopify Liquid variables ({{ product.title }}, {{ product.price | money }}, {{ product.featured_image | img_url: 'master' }}, etc.)
- Wire every Add to Cart button to Shopify's AJAX cart API (/cart/add.js) and trigger the cart drawer to open on success
- Convert the homepage to sections/index.json, the product page to sections/main-product.liquid, the collection page to sections/main-collection.liquid
- Keep all fonts, colors, spacing, animations, and visual design exactly as built — do not change anything visual
- Do not remove or modify any API calls that are already wired (quiz, bundles, gift, affiliates)
- Push the final theme files via the Shopify Theme MCP"

*Only send to Shopify after all apps (quiz, bundles, gift, affiliates) are tested and working`,
      },
      {
        label: "Step 4 — Add nitaiecompro Apps Natively *",
        content: `*After the theme is live on Shopify:

Go to Shopify Admin → Online Store → Themes → Customize → open the theme editor.

The nitaiecompro app (once registered as a Shopify native app) will appear as blocks in the theme editor. Add them to the relevant pages:

• Quiz block → Homepage (as lead magnet section)
• Bundle block → Product page (below Add to Cart)
• Gift progress bar block → Cart page
• Reviews block → Homepage + Product page
• Post-Purchase funnel → Checkout (auto-triggered, no placement needed)
• Affiliates tracking → Injected globally on all pages automatically

All blocks are configured in the nitaiecompro dashboard — the theme editor just controls WHERE they appear.`,
      },
    ],
  },
];

const HOMEPAGE_STRUCTURE = [
  "[Scarcity \\ benefit + trust announcement bar]",
  "[reviews indicator]",
  "[banner] - [banner image formula] = [Person] + [Outcome] + [Emotion]. Must be positive, exciting.",
  "[banner] - [banner text formula: [BENEFIT] = [DESIRED RESULT] + [LOWER EFFORT / LOWER COST / LOWER RISK OF PAIN POINT]  Thumb rules for banner text: 6-12 words max | focuses on outcome, not process | Sounds good when read fast | Emotional, not technical | No commas if possible.",
  "[banner] - [primary cta] = more precise & specific.",
  "[banner] - [secondary cta] = broader",
  "[banner] - [Subheadline text formula]: [Simple Mechanism] + [Key Benefit]",
  "[benefits moving text…..]",
  "[Clear Pathways Forward]",
  "[shop e.g bestsellers]",
  "[Trust badges]",
  "[Problem - solution] flow + CTA",
  "[product grid]",
  "[social proof section of UGC Carousel with photos or videos of customers wearing your kits]",
  "[Two rare collections square grid]",
  "[Urgency]",
  "[Skimable Benefits]",
  "[Products]",
  "[Quiz as Lead magnet]",
  "[FAQ]",
  "[Our story text]",
  "[Footer]",
];

const PRODUCT_PAGE_STRUCTURE = [
  "TO CREATE OUR PRODUCT PAGE AND ADS WE CAN USE THIS PROMPT: PROMPT.",
  "[minimum 5 images + one style or branded image] [title with keyword]",
  "[ready to ship green]",
  "[price + compare at price]",
  "[review rating text]",
  "[ 3 benefits bullet points or review carousel]",
  "[ variants etc…]",
  "[bundle of 3]",
  "[shopping button]",
  "[credit card images trust]",
  "[3 trust badges and text e.g: 30 days returns]",
  "[details in shelfs points]",
  "[description at least 200words and bold key features  points + Video if possible]",
  "[benefits moving text…..]",
  "[ three gifs with touching one each one: pain point , pleasure point, solidarity point.]",
  "[ reviews section]",
  "[ 1-3 benefits points squares]",
  "[FAQ]",
  "[You may also like…..]",
];

const CREATING_MODELS = [
  "Using everything from this doc - go to pintrest and find 2 womans and 2 man \"models\"",
  "then go to higgsfield and change them a bit (pose, clothes, colors a bit).",
  "Thats your models, you will use them on ads section.",
];

export default function EcomBuilderPage() {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(
    Object.fromEntries(SECTIONS.map((_, i) => [i, true]))
  );
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});

  function toggleSection(i: number) {
    setOpenSections(prev => ({ ...prev, [i]: !prev[i] }));
  }

  function toggleStep(key: string) {
    setOpenSteps(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">E-Commerce Brand Builder</h1>
        <p className="text-xs text-ink-muted mt-1">
          Step-by-step process. Follow each section in order. Every word below is exact — do not deviate.
        </p>
      </div>

      {/* Main Sections */}
      <div className="space-y-3 mb-6">
        {SECTIONS.map((section, si) => (
          <div key={si} className="card p-0 overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSection(si)}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-tint/40 transition-colors text-left"
            >
              <span className="font-bold text-sm text-ink">
                {section.number} {section.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-muted">{section.steps.length} prompts</span>
                <ChevronDown className={`w-3.5 h-3.5 text-ink-muted transition-transform ${openSections[si] ? "rotate-180" : ""}`} />
              </div>
            </button>

            {openSections[si] && (
              <div className="border-t border-surface-border">
                {/* Section intro */}
                {section.intro && (
                  <div className="px-5 py-3 bg-surface-tint/20">
                    <pre className="text-xs text-ink-muted leading-relaxed font-sans whitespace-pre-wrap">
                      {section.intro}
                    </pre>
                  </div>
                )}

                {/* Steps */}
                <div className="divide-y divide-surface-border">
                  {section.steps.map((step, pi) => {
                    const key = `${si}-${pi}`;
                    const isOpen = openSteps[key] !== false; // default open
                    return (
                      <div key={pi}>
                        <button
                          onClick={() => toggleStep(key)}
                          className="flex items-center gap-3 w-full px-5 py-2.5 hover:bg-surface-tint/30 transition-colors text-left"
                        >
                          <span className="w-5 h-5 rounded-full bg-surface-tint border border-surface-border flex items-center justify-center text-[10px] font-bold text-ink-muted shrink-0">
                            {pi + 1}
                          </span>
                          <span className="text-sm font-medium text-ink flex-1">{step.label}</span>
                          <ChevronDown className={`w-3 h-3 text-ink-subtle transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 ml-8">
                            <pre className="text-xs text-ink leading-relaxed font-sans whitespace-pre-wrap bg-surface-tint rounded-xl p-3 border border-surface-border">
                              {step.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Page Structures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="font-bold text-sm text-ink mb-3">Ideal Home page:</h2>
          <ol className="space-y-1.5">
            {HOMEPAGE_STRUCTURE.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h2 className="font-bold text-sm text-ink mb-3">Ideal Product page:</h2>
          <ol className="space-y-1.5">
            {PRODUCT_PAGE_STRUCTURE.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Creating Models */}
      <div className="card">
        <h2 className="font-bold text-sm text-ink mb-3">Creating models:</h2>
        <ol className="space-y-1.5">
          {CREATING_MODELS.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
              <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
