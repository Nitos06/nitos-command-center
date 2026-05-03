"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown, ChevronRight, CheckCircle2, Circle, ExternalLink,
  Rocket, Search, Palette, Store, ClipboardCheck, Globe, ShoppingBag,
  Layers, ImageIcon, CreditCard, Truck, FileText, ShieldCheck, TestTube,
  Layout, Type, Star, Users, Tag, Package, Megaphone, Mail, BarChart3,
  Smartphone, Settings as SettingsIcon, Zap, BookOpen,
} from "lucide-react";

/* ─── Guide Data ─── */
interface Step {
  title: string;
  description: string;
  link?: { label: string; url: string };
}

interface Section {
  id: string;
  title: string;
  icon: any;
  color: string;
  steps: Step[];
}

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    color: "text-blue-600 bg-blue-50",
    steps: [
      {
        title: "Purchase a Domain",
        description:
          "Buy a memorable, brandable domain name. Keep it short (under 15 characters), easy to spell, and relevant to your niche. Avoid hyphens and numbers.",
        link: { label: "Hostinger Domains", url: "https://www.hostinger.com/domain-name-search" },
      },
      {
        title: "Create a Shopify Account",
        description:
          "Sign up for Shopify and start your free trial. Choose the Basic plan to start - you can always upgrade later.",
        link: { label: "Shopify Signup", url: "https://www.shopify.com/free-trial" },
      },
      {
        title: "Connect Your Domain",
        description:
          "Point your domain to Shopify by updating your DNS records. Add a CNAME record pointing to shops.myshopify.com and an A record to Shopify's IP.",
        link: { label: "Shopify Domain Guide", url: "https://help.shopify.com/en/manual/domains" },
      },
      {
        title: "Choose a Theme",
        description:
          "Select a clean, fast-loading theme. Dawn (free) is a great starting point. For premium options, consider Impulse, Prestige, or Sense.",
        link: { label: "Shopify Theme Store", url: "https://themes.shopify.com" },
      },
      {
        title: "Set Up Basic Store Settings",
        description:
          "Configure your store name, address, currency, timezone, and unit system. Go to Settings > General in your Shopify admin.",
        link: { label: "Open Shopify Admin", url: "https://admin.shopify.com/store" },
      },
    ],
  },
  {
    id: "product-research",
    title: "Product Research",
    icon: Search,
    color: "text-green-600 bg-green-50",
    steps: [
      {
        title: "Identify Your Niche",
        description:
          "Pick a niche you understand or are passionate about. Look for niches with: high demand, low competition, good margins (3x markup minimum), and lightweight products for shipping.",
      },
      {
        title: "Research Competitors",
        description:
          "Analyze 5-10 top competitors in your niche. Study their pricing, product range, marketing channels, unique selling propositions, and customer reviews.",
        link: { label: "Use Research Tool", url: "/apps/ecom-builder/research" },
      },
      {
        title: "Find Suppliers",
        description:
          "Source products from reliable suppliers. Compare pricing, MOQs, shipping times, and sample quality. Always order samples before committing.",
        link: { label: "Alibaba", url: "https://www.alibaba.com" },
      },
      {
        title: "Calculate Margins",
        description:
          "For each product: COGS + Shipping + Ads should be less than 40% of selling price. Target a 60%+ gross margin. Factor in returns (5-10%).",
      },
      {
        title: "Validate Demand",
        description:
          "Use Google Trends, keyword research, and social media to validate demand. Check Amazon BSR (Best Seller Rank) for similar products. Look for consistent or growing search trends.",
        link: { label: "Google Trends", url: "https://trends.google.com" },
      },
      {
        title: "Source Product Photography",
        description:
          "Get high-quality product photos. Options: supplier photos (for testing), DIY with smartphone + lightbox, or hire a photographer for your hero products.",
      },
    ],
  },
  {
    id: "branding",
    title: "Branding",
    icon: Palette,
    color: "text-purple-600 bg-purple-50",
    steps: [
      {
        title: "Create Your Brand Story",
        description:
          "Write your brand mission, vision, and values. Why does your brand exist? What problem do you solve? Who is your ideal customer? This guides all creative decisions.",
      },
      {
        title: "Design a Logo",
        description:
          "Create a clean, versatile logo that works at all sizes. Get horizontal and square versions. Use Canva, Looka, or hire a designer on Fiverr.",
        link: { label: "Open Branding Guide", url: "/apps/ecom-builder/branding" },
      },
      {
        title: "Choose Your Color Palette",
        description:
          "Pick 2-3 primary colors and 1-2 neutral colors. Your palette should evoke the right emotions: blue for trust, green for nature, black for luxury.",
        link: { label: "Coolors Generator", url: "https://coolors.co" },
      },
      {
        title: "Select Typography",
        description:
          "Choose 2 fonts maximum: one for headings (can be decorative) and one for body text (must be readable). Google Fonts is a free resource.",
        link: { label: "Google Fonts", url: "https://fonts.google.com" },
      },
      {
        title: "Define Brand Voice",
        description:
          "Document how your brand communicates: formal vs casual, playful vs serious, technical vs simple. Create a tone guide with example phrases.",
      },
      {
        title: "Create Brand Assets",
        description:
          "Design social media templates, email headers, packaging inserts, thank-you cards, and promotional banners. Keep everything consistent with your brand guidelines.",
      },
    ],
  },
  {
    id: "store-setup",
    title: "Store Setup",
    icon: Store,
    color: "text-orange-600 bg-orange-50",
    steps: [
      // Homepage structure (21 steps condensed into key items)
      { title: "Homepage: Announcement Bar", description: "Add a top bar with: free shipping threshold, current promo code, or key USP. Use contrasting color to grab attention." },
      { title: "Homepage: Hero Banner", description: "Full-width hero with: compelling headline (benefit-focused), subheadline, strong CTA button, lifestyle image or video background. Mobile-optimized." },
      { title: "Homepage: Trust Bar", description: "Add a row of trust icons below the hero: free shipping, money-back guarantee, secure checkout, customer support availability." },
      { title: "Homepage: Featured Collection", description: "Showcase 4-8 best-selling products. Use high-quality images, clear pricing, and quick-add buttons." },
      { title: "Homepage: Social Proof Section", description: "Display customer reviews, press mentions, UGC photos, or customer count. Use a carousel or grid layout." },
      { title: "Homepage: Value Proposition Block", description: "3-4 columns explaining why customers should buy from you: quality, price, speed, sustainability, etc." },
      { title: "Homepage: Second Collection or Categories", description: "Show product categories or a second collection. Use large, clickable image cards with overlaid text." },
      { title: "Homepage: Video or Story Section", description: "Embed a brand video, founder story, or product demo. Video increases time on page and conversion." },
      { title: "Homepage: Email Signup Section", description: "Offer 10-15% discount for email signup. Place a visually appealing opt-in form with clear benefit messaging." },
      { title: "Homepage: Instagram / UGC Feed", description: "Display a live Instagram feed or curated UGC gallery. Social proof from real customers builds trust." },
      { title: "Homepage: FAQ Section", description: "Address top 5-8 questions about shipping, returns, sizing, ingredients, etc. Reduce support tickets and boost confidence." },
      { title: "Homepage: Final CTA Section", description: "End with a strong call-to-action: shop now button, subscribe, or limited-time offer. Create urgency." },
      { title: "Homepage: Footer", description: "Include: navigation links, contact info, social media icons, payment badges, newsletter signup, copyright notice." },
      // Product page structure (19 steps condensed)
      { title: "Product Page: Image Gallery", description: "Show 5-8 product images: lifestyle shots, detail close-ups, scale reference, packaging, and user-generated content. Enable zoom on hover." },
      { title: "Product Page: Title & Pricing", description: "Clear product title, price (with compare-at price if on sale), and availability badge. Show savings percentage for sales." },
      { title: "Product Page: Variant Selector", description: "Clean variant pickers for size, color, material, etc. Use swatches for colors, buttons for sizes. Show availability per variant." },
      { title: "Product Page: Add to Cart Section", description: "Prominent ATC button, quantity selector, and buy-now button. Sticky ATC on mobile. Show estimated delivery date." },
      { title: "Product Page: Product Description", description: "Write benefit-driven copy with: bullet points for key features, expandable details tabs, and lifestyle context." },
      { title: "Product Page: Trust Badges", description: "Display under ATC button: secure checkout, money-back guarantee, free shipping, warranty info. Use icon + text format." },
      { title: "Product Page: Reviews Section", description: "Show star rating, review count, and individual reviews with photos. Allow filtering by rating. Display average score prominently." },
      { title: "Product Page: Related Products", description: "Show 4 complementary products below reviews. Use 'Complete the look' or 'Customers also bought' messaging." },
      { title: "Product Page: Recently Viewed", description: "Display recently viewed products for easy comparison shopping and navigation back to previous items." },
      // Collections
      { title: "Collections: Grid Layout", description: "Set up collection pages with filterable grid. Add sidebar filters: price range, color, size, availability. Show product count." },
      { title: "Collections: Sort Options", description: "Enable sorting by: best selling, price low-high, price high-low, newest, and customer rating." },
    ],
  },
  {
    id: "launch-checklist",
    title: "Launch Checklist",
    icon: ClipboardCheck,
    color: "text-red-600 bg-red-50",
    steps: [
      {
        title: "Set Up Payment Gateway",
        description:
          "Enable Shopify Payments (or Stripe/PayPal). Accept all major credit cards, Apple Pay, Google Pay, and Shop Pay. Test with a real transaction.",
        link: { label: "Shopify Payments", url: "https://admin.shopify.com/store/settings/payments" },
      },
      {
        title: "Configure Shipping Rates",
        description:
          "Set up shipping zones and rates. Offer free shipping above a threshold (boosts AOV). Set up calculated rates or flat rates per zone.",
        link: { label: "Shipping Settings", url: "https://admin.shopify.com/store/settings/shipping" },
      },
      {
        title: "Create Legal Pages",
        description:
          "Add: Privacy Policy, Terms of Service, Refund Policy, and Shipping Policy. Use Shopify's templates as a starting point and customize for your business.",
      },
      {
        title: "Set Up Tax Collection",
        description:
          "Configure tax settings based on your location and where you sell. Enable automatic tax calculation. Consult with an accountant for complex setups.",
      },
      {
        title: "Install Essential Apps",
        description:
          "Install: email marketing (Klaviyo/Mailchimp), reviews (Judge.me/Loox), SEO (Plug in SEO), analytics (Google Analytics + Facebook Pixel).",
      },
      {
        title: "Set Up Email Flows",
        description:
          "Create automated flows: welcome series, abandoned cart recovery, post-purchase follow-up, review request, and win-back campaigns.",
      },
      {
        title: "Configure Notification Emails",
        description:
          "Customize all customer notification emails: order confirmation, shipping confirmation, delivery updates, and account creation.",
      },
      {
        title: "Set Up Google Analytics & Search Console",
        description:
          "Install GA4 with enhanced ecommerce tracking. Verify your site in Google Search Console. Submit your sitemap.",
        link: { label: "Google Analytics", url: "https://analytics.google.com" },
      },
      {
        title: "Test Everything",
        description:
          "Place a test order through the full checkout flow. Test on mobile and desktop. Check all links, images, forms, and payment processing. Test email notifications.",
      },
      {
        title: "Set Up Social Media",
        description:
          "Create and connect Instagram, Facebook, TikTok, and Pinterest business accounts. Install social commerce channels in Shopify.",
      },
      {
        title: "Launch Day Plan",
        description:
          "Plan your launch: social media announcements, email blast to waitlist, influencer collaborations, launch discount code, and press outreach.",
      },
    ],
  },
];

/* ─── component ─── */
export default function EcomBuilderPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "getting-started": true,
  });
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStep = useCallback((sectionId: string, stepIdx: number) => {
    const key = `${sectionId}-${stepIdx}`;
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const totalSteps = SECTIONS.reduce((s, sec) => s + sec.steps.length, 0);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const overallProgress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          E-Commerce Store Builder Guide
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Step-by-step guide to building a profitable online store from scratch
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">
            {completedCount} / {totalSteps} steps completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{overallProgress.toFixed(0)}% complete</p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((section, sIdx) => {
          const isExpanded = expandedSections[section.id] ?? false;
          const Icon = section.icon;
          const sectionCompleted = section.steps.filter(
            (_, i) => completed[`${section.id}-${i}`]
          ).length;

          return (
            <div
              key={section.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-semibold text-gray-900">
                      {sIdx + 1}. {section.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {sectionCompleted} / {section.steps.length} steps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini progress */}
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 hidden sm:block">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${section.steps.length > 0 ? (sectionCompleted / section.steps.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Steps */}
              {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {section.steps.map((step, stepIdx) => {
                    const key = `${section.id}-${stepIdx}`;
                    const isDone = completed[key] ?? false;

                    return (
                      <div
                        key={stepIdx}
                        className={`flex gap-4 p-5 transition-colors ${
                          isDone ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        {/* Checkmark */}
                        <button
                          onClick={() => toggleStep(section.id, stepIdx)}
                          className="flex-shrink-0 mt-0.5"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-400 transition-colors" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`text-sm font-semibold ${
                                isDone ? "text-gray-400 line-through" : "text-gray-800"
                              }`}
                            >
                              <span className="text-gray-400 font-normal mr-2">
                                {stepIdx + 1}.
                              </span>
                              {step.title}
                            </h3>
                            {step.link && (
                              <a
                                href={step.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 flex-shrink-0"
                              >
                                {step.link.label}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p
                            className={`text-sm mt-1 leading-relaxed ${
                              isDone ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
