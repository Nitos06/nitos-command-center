"use client";

import { useState } from "react";
import {
  Palette, Globe, Image, Type, MessageSquare, CheckCircle2, Circle,
  ExternalLink, Copy, Check,
} from "lucide-react";

/* ─── Color Palettes ─── */
const PALETTES = [
  {
    name: "Minimal Luxury",
    colors: ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#ffffff"],
    description: "Sophisticated dark tones with a bold accent. Great for premium brands.",
  },
  {
    name: "Natural & Organic",
    colors: ["#2d6a4f", "#40916c", "#95d5b2", "#d8f3dc", "#f8f9fa"],
    description: "Earthy greens that evoke nature and sustainability.",
  },
  {
    name: "Warm & Friendly",
    colors: ["#e07a5f", "#f2cc8f", "#81b29a", "#3d405b", "#f4f1de"],
    description: "Warm, approachable palette perfect for lifestyle brands.",
  },
  {
    name: "Bold & Modern",
    colors: ["#6c63ff", "#3f37c9", "#4895ef", "#f72585", "#ffffff"],
    description: "Vibrant, tech-forward palette for innovative brands.",
  },
  {
    name: "Pastel Dream",
    colors: ["#fec5bb", "#fcd5ce", "#f8edeb", "#d8e2dc", "#ece4db"],
    description: "Soft pastels for beauty, baby, and wellness brands.",
  },
  {
    name: "Monochrome Power",
    colors: ["#000000", "#333333", "#666666", "#cccccc", "#ffffff"],
    description: "Timeless black and white. Works for any industry.",
  },
];

/* ─── Domain Checklist ─── */
const DOMAIN_STEPS = [
  "Choose a .com domain (or .co / .store if unavailable)",
  "Keep it under 15 characters",
  "Avoid hyphens, numbers, and double letters",
  "Check trademark availability (USPTO/EUIPO)",
  "Verify social media handle availability",
  "Purchase domain and set up auto-renewal",
  "Configure SSL certificate (usually automatic with Shopify)",
  "Set up professional email (info@, hello@, support@)",
];

/* ─── Brand Voice Worksheet ─── */
const VOICE_QUESTIONS = [
  { q: "How would you describe your brand in 3 words?", placeholder: "e.g., Bold, Playful, Trustworthy" },
  { q: "If your brand were a person, who would it be?", placeholder: "e.g., A confident best friend who always knows the best products" },
  { q: "What tone do you use in writing?", placeholder: "e.g., Casual and conversational, with a touch of humor" },
  { q: "What words do you ALWAYS use?", placeholder: "e.g., craft, elevate, curated, premium" },
  { q: "What words do you NEVER use?", placeholder: "e.g., cheap, basic, generic, discount" },
  { q: "How do you handle complaints?", placeholder: "e.g., Empathetic, solution-focused, no corporate speak" },
];

/* ─── Image Guidelines ─── */
const IMAGE_GUIDELINES = [
  { title: "Product Photography", rules: [
    "White or lifestyle background (consistent across all products)",
    "Minimum 2000x2000px resolution",
    "Square aspect ratio (1:1) for product grids",
    "Show product from 5+ angles",
    "Include a scale reference (hand, room, model)",
    "Consistent lighting and color temperature",
  ]},
  { title: "Social Media", rules: [
    "Use brand colors consistently in graphics",
    "Include logo watermark on custom graphics",
    "Maintain consistent filter/editing style",
    "UGC should feel authentic but curated",
    "Stories: 1080x1920px, Feed: 1080x1080px",
  ]},
  { title: "Website Banners", rules: [
    "Hero banner: 1920x800px minimum",
    "Mobile hero: 750x1000px",
    "Collection banners: 1600x600px",
    "Keep text minimal on images (overlay with CSS instead)",
    "Optimize for web (WebP format, under 200KB)",
  ]},
];

export default function BrandingPage() {
  const [domainChecked, setDomainChecked] = useState<Record<number, boolean>>({});
  const [voiceAnswers, setVoiceAnswers] = useState<Record<number, string>>({});
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-6 h-6 text-purple-600" />
          Branding Guide
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Build a cohesive brand identity for your store
        </p>
      </div>

      {/* ─── Domain Setup Checklist ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          Domain Setup Checklist
        </h2>
        <div className="space-y-2">
          {DOMAIN_STEPS.map((step, i) => {
            const checked = domainChecked[i] ?? false;
            return (
              <button
                key={i}
                onClick={() =>
                  setDomainChecked((prev) => ({ ...prev, [i]: !prev[i] }))
                }
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-colors ${
                  checked
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {checked ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
                {step}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400">
          {Object.values(domainChecked).filter(Boolean).length} / {DOMAIN_STEPS.length} completed
        </p>
      </div>

      {/* ─── Logo Resources ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Image className="w-5 h-5 text-pink-500" />
          Logo Creation Resources
        </h2>
        <p className="text-sm text-gray-500">
          Create a professional logo using these tools and services.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Canva", url: "https://www.canva.com", desc: "Free drag-and-drop logo maker with templates" },
            { name: "Looka", url: "https://looka.com", desc: "AI-powered logo generator" },
            { name: "Hatchful by Shopify", url: "https://www.shopify.com/tools/logo-maker", desc: "Free logo maker by Shopify" },
            { name: "Fiverr", url: "https://www.fiverr.com/categories/graphics-design/creative-logo-design", desc: "Hire a designer starting at $5" },
            { name: "99designs", url: "https://99designs.com", desc: "Design contests with multiple options" },
            { name: "Figma", url: "https://www.figma.com", desc: "Professional design tool (free tier)" },
          ].map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 group-hover:text-purple-700">
                  {tool.name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500" />
              </div>
              <p className="text-xs text-gray-500">{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* ─── Color Palette Generator ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-500" />
          Color Palette
        </h2>
        <p className="text-sm text-gray-500">
          Choose a preset palette or use it as inspiration for your brand colors.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PALETTES.map((palette) => (
            <button
              key={palette.name}
              onClick={() => setSelectedPalette(palette.name)}
              className={`border rounded-xl p-4 text-left transition-all ${
                selectedPalette === palette.name
                  ? "border-purple-500 ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex gap-1 mb-3">
                {palette.colors.map((c) => (
                  <div
                    key={c}
                    className="h-8 flex-1 rounded first:rounded-l-lg last:rounded-r-lg border border-gray-100"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-800">{palette.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{palette.description}</p>
            </button>
          ))}
        </div>

        {/* Selected palette details */}
        {selectedPalette && (
          <div className="border border-purple-200 bg-purple-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-purple-800 mb-3">
              {selectedPalette} - Click to copy hex codes
            </h3>
            <div className="flex gap-3">
              {PALETTES.find((p) => p.name === selectedPalette)?.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => copyColor(c)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="w-14 h-14 rounded-lg border-2 border-white shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-xs font-mono text-gray-600 flex items-center gap-1">
                    {copiedColor === c ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        Copied
                      </>
                    ) : (
                      c
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Brand Voice Worksheet ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Brand Voice Worksheet
        </h2>
        <p className="text-sm text-gray-500">
          Answer these questions to define a consistent brand voice across all channels.
        </p>

        <div className="space-y-4">
          {VOICE_QUESTIONS.map((vq, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i + 1}. {vq.q}
              </label>
              <textarea
                value={voiceAnswers[i] || ""}
                onChange={(e) =>
                  setVoiceAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                }
                placeholder={vq.placeholder}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── Image Branding Guidelines ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Image className="w-5 h-5 text-teal-500" />
          Image Branding Guidelines
        </h2>

        <div className="space-y-4">
          {IMAGE_GUIDELINES.map((section) => (
            <div key={section.title} className="border border-gray-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0 mt-2" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
