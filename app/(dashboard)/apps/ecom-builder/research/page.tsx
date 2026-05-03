"use client";

import { useState } from "react";
import {
  Search, Globe, TrendingUp, Package, ExternalLink, Loader2,
  CheckCircle2, BarChart3, Users, DollarSign, Star, ShoppingBag,
} from "lucide-react";

/* ─── Trending Niches ─── */
const TRENDING_NICHES = [
  { name: "Sustainable Home Products", growth: "+42%", size: "$18.2B", competition: "Medium" },
  { name: "Pet Wellness & Supplements", growth: "+38%", size: "$8.7B", competition: "High" },
  { name: "Personalized Jewelry", growth: "+35%", size: "$12.4B", competition: "High" },
  { name: "Home Office Accessories", growth: "+31%", size: "$6.3B", competition: "Medium" },
  { name: "Fitness Recovery Tools", growth: "+29%", size: "$4.8B", competition: "Low" },
  { name: "Clean Beauty & Skincare", growth: "+27%", size: "$22.1B", competition: "High" },
  { name: "Smart Kitchen Gadgets", growth: "+25%", size: "$9.5B", competition: "Medium" },
  { name: "Baby & Toddler Organic", growth: "+24%", size: "$15.8B", competition: "Medium" },
  { name: "Outdoor & Camping Gear", growth: "+22%", size: "$7.2B", competition: "Low" },
  { name: "Digital Art & Printables", growth: "+20%", size: "$3.1B", competition: "Low" },
];

/* ─── Supplier Directory ─── */
const SUPPLIERS = [
  { name: "Alibaba", url: "https://www.alibaba.com", type: "Wholesale / Manufacturing" },
  { name: "AliExpress", url: "https://www.aliexpress.com", type: "Dropshipping / Samples" },
  { name: "Faire", url: "https://www.faire.com", type: "US/EU Wholesale" },
  { name: "Tundra", url: "https://www.tundra.com", type: "US Wholesale (Free Shipping)" },
  { name: "Printful", url: "https://www.printful.com", type: "Print on Demand" },
  { name: "Spocket", url: "https://www.spocket.co", type: "US/EU Dropshipping" },
  { name: "Zendrop", url: "https://www.zendrop.com", type: "Dropshipping + Branding" },
  { name: "IndiaMART", url: "https://www.indiamart.com", type: "Indian Manufacturers" },
];

/* ─── Product Evaluation Checklist ─── */
const EVAL_CHECKLIST = [
  "Selling price at least 3x COGS",
  "Lightweight (under 2 lbs) for affordable shipping",
  "Not fragile or easily damaged in transit",
  "Not a regulated product (FDA, CE, etc.) unless prepared",
  "Solves a clear problem or fulfills a desire",
  "Can be differentiated from Amazon generics",
  "Good review potential (visual, shareable)",
  "Repeatable purchase or upsell opportunity",
  "Consistent demand (not purely seasonal)",
  "Supplier can handle scaling (100+ units/week)",
  "Patent-free or properly licensed",
  "Can be marketed through social media content",
];

export default function ResearchPage() {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleAnalyze = async () => {
    if (!competitorUrl) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 2000));
    setAnalysisResult({
      url: competitorUrl,
      estimatedTraffic: "~45K/mo",
      topProducts: 12,
      priceRange: "$25 - $150",
      socialFollowers: "~82K total",
      adSpend: "~$15K/mo estimated",
      strengths: [
        "Strong brand identity and visual consistency",
        "Active social media presence with UGC",
        "Good review count on products (avg 4.5 stars)",
      ],
      weaknesses: [
        "Slow page load speed (4.2s)",
        "Limited product descriptions",
        "No loyalty or referral program",
      ],
    });
    setAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-6 h-6 text-emerald-600" />
          Research Tools
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Research your market, competitors, and product opportunities
        </p>
      </div>

      {/* ─── Competitor Research ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          Competitor Research
        </h2>
        <p className="text-sm text-gray-500">
          Enter a competitor's website URL to get an overview analysis.
        </p>

        <div className="flex gap-3">
          <input
            type="url"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="https://competitor-store.com"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={!competitorUrl || analyzing}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-800">{analysisResult.url}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Est. Traffic", value: analysisResult.estimatedTraffic, icon: Users },
                  { label: "Products", value: analysisResult.topProducts, icon: Package },
                  { label: "Price Range", value: analysisResult.priceRange, icon: DollarSign },
                  { label: "Social", value: analysisResult.socialFollowers, icon: Star },
                  { label: "Ad Spend", value: analysisResult.adSpend, icon: BarChart3 },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-lg p-3">
                    <m.icon className="w-4 h-4 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">{m.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Strengths / Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-2">Strengths</p>
                  <ul className="space-y-1.5">
                    {analysisResult.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-2">Weaknesses</p>
                  <ul className="space-y-1.5">
                    {analysisResult.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-500 text-xs font-bold">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Market Research ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Trending Niches
        </h2>
        <p className="text-sm text-gray-500">
          High-growth ecommerce niches based on current market trends and search data.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Niche</th>
                <th className="px-4 py-3 text-right">YoY Growth</th>
                <th className="px-4 py-3 text-right">Market Size</th>
                <th className="px-4 py-3">Competition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TRENDING_NICHES.map((niche) => (
                <tr key={niche.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{niche.name}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{niche.growth}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{niche.size}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        niche.competition === "Low"
                          ? "bg-green-100 text-green-700"
                          : niche.competition === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {niche.competition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Product Research ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          Product Research
        </h2>

        {/* Supplier Directory */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Supplier Directory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUPPLIERS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 group-hover:text-emerald-700">
                    {s.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500" />
                </div>
                <p className="text-xs text-gray-500">{s.type}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Product Evaluation Checklist */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Product Evaluation Checklist
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Use this checklist to evaluate potential products before committing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EVAL_CHECKLIST.map((item, i) => {
              const checked = checkedItems[i] ?? false;
              return (
                <button
                  key={i}
                  onClick={() =>
                    setCheckedItems((prev) => ({ ...prev, [i]: !prev[i] }))
                  }
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-colors ${
                    checked
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  {item}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {Object.values(checkedItems).filter(Boolean).length} / {EVAL_CHECKLIST.length} criteria met
          </p>
        </div>
      </div>
    </div>
  );
}
