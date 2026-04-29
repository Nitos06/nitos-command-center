import { Search, TrendingUp, Palette, Globe, Users, ChevronDown, ClipboardList, Star, Layout } from "lucide-react";

const PHASES = [
  {
    id: "competitor",
    icon: Search,
    title: "1. Competitor Research",
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    steps: [
      {
        label: "Prompt 1 — Initial Discovery",
        content: `Analyze yourself as a combination of Philip Kotler, Jack Trout, Michael Porter, and Dan Kennedy.

Identify and document:
• 3 direct competitors (same product/market)
• 3 indirect competitors (alternative solutions)
• 3 aspirational competitors (premium benchmarks)

For each brand, document:
- Target audience assumptions
- Main promise and brand angle
- Primary offer with upsells / cross-sells
- Guarantees and scarcity tactics
- Emotional triggers
- Landing page style and CTAs
- Creative formats and repeated ad themes
- Number of running ads
- Product pricing
- Revenue estimate: Ad Spend × (AOV × CVR ÷ CPC)`,
      },
      {
        label: "Prompt 2 — Paid Advertising Analysis",
        content: `Search Meta, TikTok, and Google using 5+ keyword variations.

Find brands running 10+ ads (minimum 6–7 competitors).
Verify website age and page transparency.
Document the same metrics as Prompt 1 for each brand found.`,
      },
      {
        label: "Prompt 3 — Pattern Recognition",
        content: `Review all discovered competitors and extract:
• Recurring messaging patterns
• Market trends and successful content formats
• Most-used emotional triggers
• Common offer structures
• Gaps nobody is addressing (your opportunity)`,
      },
    ],
  },
  {
    id: "market",
    icon: TrendingUp,
    title: "2. Market Research",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    steps: [
      {
        label: "Prompt 1 — Competitor Website Analysis",
        content: `"You are my expert copywriter specializing in Direct Response marketing for e-commerce. Analyze this competitor's website [URL] and share insights on: messaging, offer structure, trust signals, CTAs, and what you would improve."`,
      },
      {
        label: "Prompt 2 — In-Depth Product Research",
        content: `Use your deep research tool on the product. Request a minimum 6-page consolidated document covering:
- Market size and trends
- Customer pain points (from real reviews)
- Product benefits ranked by importance
- Competitor product gaps
- Price sensitivity analysis`,
      },
      {
        label: "Prompt 3 — Customer Avatar Worksheet",
        content: `Complete a full customer avatar:
- Name, age, gender, location
- Job / daily routine
- Primary frustration this product solves
- What they've already tried (and why it failed)
- Dream outcome in their own words
- Where they spend time online
- What influences their purchase decisions`,
      },
      {
        label: "Prompt 4 — Offer Brief",
        content: `Define your complete offer structure:
- Core product / service
- Bonuses included
- Guarantee (length + terms)
- Scarcity / urgency mechanism
- Price point and compare-at price
- Upsell / cross-sell sequence
- Refund policy`,
      },
      {
        label: "Prompt 5 — Dream Outcome (Hormozi Method)",
        content: `Using Alex Hormozi's framework, define:
1. Primary dream outcome (one sentence)
2. Status change this outcome creates
3. Deeper emotional motivation behind the desire
4. Complete dream outcome statement combining all three`,
      },
      {
        label: "Prompt 6 — Obstacle Mapping",
        content: `List 15+ obstacles across four dimensions:
• Likelihood of achievement (doubts)
• Effort and sacrifice required
• Time delay before results
• Perceived risk / loss

Be specific — use the customer avatar's exact fears.`,
      },
      {
        label: "Prompt 7 — Solution Mapping",
        content: `For each obstacle identified, write:
PROBLEM → SOLUTION

Then specify the best delivery vehicle for each solution:
checklist · video · template · live call · community · done-for-you asset`,
      },
      {
        label: "Prompt 8 — Silent Frustration Mining",
        content: `Analyze 1,000+ data points from:
- 1–5 star reviews on Amazon / competitor stores
- Reddit threads in relevant communities
- TikTok and YouTube comments on competitor content

Extract unspoken pain points nobody addresses in their marketing.`,
      },
    ],
  },
  {
    id: "branding",
    icon: Palette,
    title: "3. Branding",
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    steps: [
      {
        label: "Strategy Prompt — Required Inputs",
        content: `Before generating brand assets, prepare these inputs:
1. Product category and price range
2. Target customer demographics and mindset
3. Core pain or desire solved
4. Emotional triggers (fear / status / comfort / speed / confidence)
5. Competitor landscape (from Phase 1)
6. Traffic source: TikTok / Meta / Google
7. Desired brand vibe (raw, premium, clinical, playful, etc.)`,
      },
      {
        label: "Phase 1 — Core Brand Assets",
        content: `Generate:
□ Brand Tagline (3–6 words)
□ Elevator Pitch (2 sentences)
□ Brand Manifesto (150 words)`,
      },
      {
        label: "Phase 2 — Storefront Copy",
        content: `Generate:
□ Hero Section Headline (max 8 words)
□ Hero Sub-headline (max 15 words)
□ Hero CTA Button (action-oriented, specific)
□ Trust Bar (3 icons with micro-copy)
□ 3 Category Hooks (product categories)
□ Social Proof Section Header`,
      },
      {
        label: "Phase 3 — Conversion Engine",
        content: `Generate:
□ Universal Product Description Hook (2 sentences)
□ Core Mechanism Explainer (sizing / quality guarantees)
□ Shipping & Logistics Accordion (transparency-focused)
□ Objection-Killing FAQ (3 common skeptic questions)`,
      },
      {
        label: "Phase 4 — Checkout & Retention",
        content: `Generate:
□ Cart Drawer Micro-Copy (1-sentence reassurance)
□ Checkout Page Guarantee (2 sentences near payment)
□ Post-Purchase Thank You Page (confirmation + viral loop)`,
      },
      {
        label: "Phase 5 — Email Automations",
        content: `Generate:
□ Welcome Email #1 — incentive delivery + initiation
□ Welcome Email #2 — founder mission + enemy positioning
□ Abandoned Cart Email #1 — urgency + guarantees
□ Viral Loop Email — UGC incentive post-delivery`,
      },
      {
        label: "Phase 6 — Ad Creative Copy",
        content: `Generate:
□ 30-Second Video Ad Script (UGC-style TikTok/Shorts format)
□ Native Social Ad Copy (frustration-focused)
□ Retargeting Ad Copy (trust + guarantees emphasis)`,
      },
      {
        label: "Phase 7 — Customer Experience",
        content: `Generate:
□ Unboxing Insert Card (quality hype + UGC instructions)
□ Support Macro — Shipping Inquiry (empathetic, brand-aligned)`,
      },
      {
        label: "Brand Guardrails (What NOT to do)",
        content: `⛔ No generic corporate language (Beige Trap)
⛔ Don't chase fleeting trends — anchor the brand
⛔ Don't list 10 value props — focus on 4 strong UVPs
⛔ Don't copy standard dropshipper aesthetics — maintain raw, film-grain identity`,
      },
    ],
  },
  {
    id: "website",
    icon: Globe,
    title: "4. Website Building",
    color: "text-green-400",
    border: "border-green-500/20",
    bg: "bg-green-500/5",
    steps: [
      {
        label: "Step 1 — Inspiration & Specs",
        content: `"I want to build a website. The product is [X], brand rules are [X], research shows [X]. Competitors include [X]. What should the hero section copy and vibe be? Provide website specs following 75% of these building rules [X]."`,
      },
      {
        label: "Step 2 — Hero Video Concept",
        content: `Create a background video loop with wow factor matching the brand vibe:
• Write an image prompt for the base visual
• Write a video animation prompt (no camera movement — must loop seamlessly)
• Ensure space for hero text overlay`,
      },
      {
        label: "Step 3 — High-Fidelity Prototype",
        content: `Use Claude Design (or Figma) to create an animated prototype based on:
- Brand identity from Phase 3
- Website specs from Step 1
- Hero video from Step 2`,
      },
      {
        label: "Step 4 — Full Website Sketch",
        content: `Build the complete layout. Follow the Homepage Structure below.
Incorporate the hero video from Step 2.
Apply 75% of the website building rules.`,
      },
      {
        label: "Step 5 — Motion & Animation",
        content: `Visit motions.ai to select two preferred motion styles.
Reference liked elements from competitor websites.
Brief Claude Design with: brand rules + research + avatar + competitor refs + video assets.`,
      },
      {
        label: "Step 6 — Shopify Deployment",
        content: `Push the finalized design to Shopify using the Shopify MCP (full frontend + backend access).
Test all pages: homepage, PDP, cart, checkout, thank you.`,
      },
    ],
  },
];

const HOMEPAGE_STRUCTURE = [
  "Scarcity/benefit + trust announcement bar",
  "Reviews indicator",
  "Banner: [Person] + [Outcome] + [Emotion] · max 12 words",
  "Banner formula: [BENEFIT] = [DESIRED RESULT] + [LOWER EFFORT/COST/RISK]",
  "Primary CTA (precise + specific)",
  "Secondary CTA (broader)",
  "Subheadline: [Simple Mechanism] + [Key Benefit]",
  "Moving benefits text ticker",
  "Clear pathways forward (3 categories)",
  "Bestsellers shop section",
  "Trust badges row",
  "Problem → Solution flow + CTA",
  "Product grid",
  "UGC carousel (customers using / wearing the product)",
  "Two rare collections square grid",
  "Urgency section",
  "Skimmable benefit bullets",
  "Product showcase / lifestyle imagery",
  "Quiz lead magnet",
  "FAQ section",
  "Brand story / founder note",
  "Footer",
];

const PRODUCT_PAGE_STRUCTURE = [
  "Minimum 5 product images + 1 branded lifestyle image",
  "Keyword-optimized title",
  `"Ready to Ship" green indicator`,
  "Price + compare-at price (strikethrough)",
  "Star rating + review count text",
  "3-benefit bullet points or review carousel",
  "Variants selector",
  "Bundle of 3 option",
  "Add to Cart button (bold, full width)",
  "Credit card trust images",
  "3 trust badges (e.g. 30-day returns, free shipping, secure checkout)",
  "Detailed shelf points / specs",
  "200+ word description (bold key features) + video if available",
  "Moving benefits text",
  "3 GIFs: pain point · pleasure point · solidarity point",
  "Reviews section",
  "1–3 benefit point squares",
  "FAQ",
  `"You may also like…" cross-sell section`,
];

export default function EcomBuilderPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-primary-400" />
          <h1 className="text-xl font-bold text-ink">E-Commerce Brand Builder</h1>
        </div>
        <p className="text-xs text-ink-muted">
          Manual step-by-step playbook — follow each phase in order. Use Claude, your research tools, and the Shopify MCP to execute.
        </p>
      </div>

      {/* Phase accordions */}
      <div className="space-y-3 mb-6">
        {PHASES.map(phase => {
          const Icon = phase.icon;
          return (
            <details key={phase.id} className={`group card p-0 overflow-hidden border ${phase.border}`}>
              <summary className={`flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none ${phase.bg} hover:brightness-110 transition-all`}>
                <Icon className={`w-4 h-4 ${phase.color} shrink-0`} />
                <span className={`font-bold text-sm ${phase.color}`}>{phase.title}</span>
                <span className="ml-auto text-[10px] text-ink-muted">{phase.steps.length} steps</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-muted group-open:rotate-180 transition-transform" />
              </summary>

              <div className="divide-y divide-surface-border">
                {phase.steps.map((step, i) => (
                  <details key={i} className="group/step">
                    <summary className="flex items-center gap-3 px-5 py-2.5 cursor-pointer list-none select-none hover:bg-surface-tint/40 transition-colors">
                      <span className="w-5 h-5 rounded-full bg-surface-tint border border-surface-border flex items-center justify-center text-[10px] font-bold text-ink-muted shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-ink">{step.label}</span>
                      <ChevronDown className="w-3 h-3 text-ink-subtle ml-auto group-open/step:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-4 pt-2">
                      <pre className="text-xs text-ink-muted whitespace-pre-wrap leading-relaxed font-sans bg-surface-tint rounded-xl p-3 border border-surface-border">
                        {step.content}
                      </pre>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {/* Page structure references */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Layout className="w-4 h-4 text-primary-400" />
            <span className="font-semibold text-ink text-sm">Homepage Structure</span>
          </div>
          <ol className="space-y-1">
            {HOMEPAGE_STRUCTURE.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary-400" />
            <span className="font-semibold text-ink text-sm">Product Page Structure</span>
          </div>
          <ol className="space-y-1">
            {PRODUCT_PAGE_STRUCTURE.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Models tip */}
      <div className="card border border-primary-500/20 bg-primary-500/5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-ink text-sm">Creating Models for Ads</span>
        </div>
        <ol className="space-y-1 text-xs text-ink-muted">
          <li>1. Go to Pinterest and find 2 female + 2 male "model" inspiration images</li>
          <li>2. Use Higgsfield to modify: poses, clothing, colors, brand aesthetic</li>
          <li>3. Deploy customized models across all ad campaigns consistently</li>
        </ol>
      </div>
    </>
  );
}
