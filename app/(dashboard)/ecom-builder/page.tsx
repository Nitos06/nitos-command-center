import { ChevronDown } from "lucide-react";

const PHASES = [
  {
    title: "1. COMPETITOR RESEARCH",
    steps: [
      {
        label: "Prompt 1: Initial Competitor Discovery",
        content: `Analyze yourself as a combination of legendary strategists (Philip Kotler, Jack Trout, Michael Porter, Dan Kennedy) to identify:
- 3 direct competitors (same product/market)
- 3 indirect competitors (alternative solutions)
- 3 aspirational competitors (premium benchmarks)

For each brand, document:
- Target audience assumptions
- Main promise and brand angle
- Primary offer with upsells/crosssells
- Guarantees and scarcity tactics
- Emotional triggers
- Landing page style and CTAs
- Creative formats and repeated ad themes
- Number of running ads
- Product pricing
- Revenue calculation: "Revenue ≈ Ad Spend × (AOV × CVR ÷ CPC)"`,
      },
      {
        label: "Prompt 2: Paid Advertising Analysis",
        content: `Search Meta, TikTok, and Google using 5+ keyword variations. Identify brands running 10+ ads (minimum 6-7 competitors). Verify website age and page transparency. Document the same metrics as Prompt 1.`,
      },
      {
        label: "Prompt 3: Pattern Recognition",
        content: `Extract recurring patterns across all discovered competitors to identify market trends and successful tactics.`,
      },
    ],
  },
  {
    title: "2. MARKET RESEARCH",
    steps: [
      {
        label: "Prompt #1: Competitor Analysis",
        content: `"You are my expert copywriter specializing in Direct Response marketing for e-commerce. Analyze this competitor's website [URL] and share insights."`,
      },
      {
        label: "Prompt #2: In-Depth Product Research",
        content: `Review provided research documents to understand comprehensive product analysis methodology.`,
      },
      {
        label: "Prompt #3: Deep Research Tool Prompt",
        content: `Create a specific Deep Research prompt for your product targeting [X] audience. Request minimum 6-page consolidated document.`,
      },
      {
        label: "Prompt #4: Customer Avatar Worksheet",
        content: `Complete the provided template to define your ideal customer profile.`,
      },
      {
        label: "Prompt #5: Offer Brief Document",
        content: `Fill out template detailing your complete offer structure.`,
      },
      {
        label: "Prompt #6: Dream Outcome Framework",
        content: `Using Alex Hormozi's method, identify:
- Primary dream outcome (one sentence)
- Status change this outcome creates
- Deeper emotional motivation
- Complete dream outcome statement`,
      },
      {
        label: "Prompt #7: Obstacle Mapping",
        content: `List 15+ obstacles across four dimensions:
- Likelihood of achievement
- Effort and sacrifice required
- Time delay
- Perceived value`,
      },
      {
        label: "Prompt #8: Solution Mapping",
        content: `Reverse each obstacle into a solution. Format: "PROBLEM → SOLUTION." Specify optimal delivery vehicle (checklist, video, template, call, community, done-for-you asset).`,
      },
      {
        label: "Prompt #9: Silent Frustration Identification",
        content: `Analyze 1000+ competitors and 1-5 star reviews on Reddit to identify unspoken pain points.`,
      },
    ],
  },
  {
    title: "3. BRANDING",
    steps: [
      {
        label: "Initial Strategy Prompt — Required Inputs",
        content: `Develop comprehensive brand positioning serving performance-first goals:
- Build instant trust
- Increase conversion rates
- Increase perceived value
- Reduce refunds and chargebacks
- Create memorable, real-feeling brand

Required Inputs:
1. Product category and price range
2. Target customer demographics and mindset
3. Core pain or desire solved
4. Emotional triggers (fear, status, comfort, speed, confidence)
5. Competitor landscape
6. Traffic source (TikTok/Meta/Google)
7. Desired brand vibe`,
      },
      {
        label: "Phase 1: Core Brand Assets",
        content: `1. Brand Tagline (3-6 words)
2. Elevator Pitch (2 sentences)
3. Brand Manifesto (150 words)`,
      },
      {
        label: "Phase 2: Storefront",
        content: `4. Hero Section Headline (max 8 words)
5. Hero Sub-headline (max 15 words)
6. Hero CTA Button (action-oriented)
7. Trust Bar (3 icons with micro-copy)
8. Category Hooks (3 product categories)
9. Social Proof Section Header`,
      },
      {
        label: "Phase 3: Conversion Engine",
        content: `10. Universal Product Description Hook (2 sentences)
11. Core Mechanism Explainer (sizing/quality guarantees)
12. Shipping & Logistics Accordion (transparency focus)
13. Objection-Killing FAQ (3 common skeptic questions)`,
      },
      {
        label: "Phase 4: Checkout & Retention",
        content: `14. Cart Drawer Micro-Copy (1-sentence reassurance)
15. Checkout Page Guarantee (2 sentences near payment)
16. Post-Purchase Thank You Page (confirmation + viral loop setup)`,
      },
      {
        label: "Phase 5: Backend Automations",
        content: `17. Welcome Email #1 (incentive delivery + initiation)
18. Welcome Email #2 (founder mission + enemy positioning)
19. Abandoned Cart Email #1 (urgency + guarantees)
20. Viral Loop Email (UGC incentive post-delivery)`,
      },
      {
        label: "Phase 6: Top of Funnel",
        content: `21. 30-Second Video Ad Script (UGC-style TikTok/Shorts format)
22. Native Social Ad Copy (frustration-focused targeting)
23. Retargeting Ad Copy (trust and guarantees emphasis)`,
      },
      {
        label: "Phase 7: Customer Experience",
        content: `24. Unboxing Insert Card (quality hype + UGC instructions)
25. Support Macro - Shipping Inquiry (empathetic, brand-aligned)`,
      },
      {
        label: "Brand Guardrails (What NOT to do)",
        content: `- Avoid generic, corporate language (no Beige Trap)
- Don't chase fleeting trends (anchor the brand)
- Don't dilute with 10 value props (focus on 4 UVPs)
- Don't mimic standard dropshippers (maintain raw, film-grain identity)`,
      },
    ],
  },
  {
    title: "4. WEBSITE BUILDING",
    steps: [
      {
        label: "Step 1: Inspiration & Specifications",
        content: `"I want to build a website. The product is [X], brand rules are [X], research shows [X] & [X]. Competitors include [X]. What should the hero section copy and vibe be? Provide website specs following 75% of these building rules [X]."`,
      },
      {
        label: "Step 2: Hero Video Concept",
        content: `Create background video loop with wow factor matching brand vibe:
- Provide image prompt
- Provide video animation prompt (no camera movement for seamless looping)
- Ensure space for hero text overlay`,
      },
      {
        label: "Step 3: High-Fidelity Prototype",
        content: `Use Claude Design to create animated prototype based on brand identity.`,
      },
      {
        label: "Step 4: Full Website Sketch",
        content: `Build complete layout following 75% of website rules. Incorporate video from Step 2.`,
      },
      {
        label: "Step 5: Motion & Animation Integration",
        content: `Visit motions.ai to select two preferred motions and reference liked website elements. Provide Claude Design with complete brief including brand rules, research, avatar, competitors, and video assets.`,
      },
      {
        label: "Step 6: Shopify Deployment",
        content: `Push finalized design to Shopify using full access frontend + backend MCP.`,
      },
    ],
  },
];

const HOMEPAGE_STRUCTURE = [
  "Scarcity/benefit + trust announcement bar",
  "Reviews indicator",
  "Banner with formula: [Person] + [Outcome] + [Emotion]",
  "Banner text (6-12 words max): [BENEFIT] = [DESIRED RESULT] + [LOWER EFFORT/COST/RISK]",
  "Primary CTA (precise/specific)",
  "Secondary CTA (broader)",
  "Subheadline: [Simple Mechanism] + [Key Benefit]",
  "Moving text with benefits",
  "Clear pathways forward",
  "Bestsellers shop section",
  "Trust badges",
  "Problem-solution flow + CTA",
  "Product grid",
  "UGC carousel (customers wearing products)",
  "Two rare collections square grid",
  "Urgency section",
  "Skimmable benefits",
  "Product showcase",
  "Quiz lead magnet",
  "FAQ section",
  "Brand story text",
  "Footer",
];

const PRODUCT_PAGE_STRUCTURE = [
  "Minimum 5 images + 1 branded style image",
  "Keyword-optimized title",
  `"Ready to Ship" green indicator`,
  "Price + compare-at price",
  "Review rating text",
  "3-benefit bullet points or review carousel",
  "Variants selector",
  "Bundle of 3 option",
  "Shopping button",
  "Credit card trust images",
  `3 trust badges (e.g., "30 days returns")`,
  "Detailed shelf points",
  "200+ word description (bold key features) + video if available",
  "Moving benefits text",
  "3 GIFs addressing: pain point, pleasure point, solidarity point",
  "Reviews section",
  "1-3 benefit point squares",
  "FAQ",
  `"You may also like…" section`,
];

export default function EcomBuilderPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">E-Commerce Brand Builder</h1>
        <p className="text-xs text-ink-muted mt-1">
          Follow each phase in order. Use Claude, your research tools, and the Shopify MCP to execute.
        </p>
      </div>

      {/* Phases */}
      <div className="space-y-3 mb-6">
        {PHASES.map((phase) => (
          <details key={phase.title} className="group card p-0 overflow-hidden" open>
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-surface-tint/40 transition-colors">
              <span className="font-bold text-sm text-ink">{phase.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-muted">{phase.steps.length} steps</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-muted group-open:rotate-180 transition-transform" />
              </div>
            </summary>

            <div className="divide-y divide-surface-border border-t border-surface-border">
              {phase.steps.map((step, i) => (
                <details key={i} className="group/step">
                  <summary className="flex items-center gap-3 px-5 py-2.5 cursor-pointer list-none select-none hover:bg-surface-tint/30 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-surface-tint border border-surface-border flex items-center justify-center text-[10px] font-bold text-ink-muted shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-ink flex-1">{step.label}</span>
                    <ChevronDown className="w-3 h-3 text-ink-subtle group-open/step:rotate-180 transition-transform shrink-0" />
                  </summary>
                  <div className="px-5 pb-4 pt-1 ml-8">
                    <pre className="text-xs text-ink leading-relaxed font-sans whitespace-pre-wrap bg-surface-tint rounded-xl p-3 border border-surface-border">
                      {step.content}
                    </pre>
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Page Structures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="font-bold text-sm text-ink mb-3">IDEAL HOMEPAGE STRUCTURE</h2>
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
          <h2 className="font-bold text-sm text-ink mb-3">IDEAL PRODUCT PAGE STRUCTURE</h2>
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
        <h2 className="font-bold text-sm text-ink mb-3">CREATING MODELS</h2>
        <ol className="space-y-1.5">
          <li className="flex items-start gap-2 text-xs text-ink-muted">
            <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">1.</span>
            <span>Visit Pinterest to find 2 female and 2 male "models"</span>
          </li>
          <li className="flex items-start gap-2 text-xs text-ink-muted">
            <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">2.</span>
            <span>Use Higgsfield to modify: poses, clothing, colors</span>
          </li>
          <li className="flex items-start gap-2 text-xs text-ink-muted">
            <span className="text-[10px] text-ink-subtle font-mono w-5 shrink-0 mt-0.5">3.</span>
            <span>Use customized models across all ad campaigns</span>
          </li>
        </ol>
      </div>
    </>
  );
}
