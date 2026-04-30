"use client";

import { useState } from "react";
import {
  Package, Truck, Zap, ShieldCheck, Globe, Clock, BarChart2,
  CheckCircle2, ArrowRight, Bot, Sparkles, RefreshCw, Search,
  Link2, ExternalLink
} from "lucide-react";

export default function SuppliersClient() {
  const [hyperConnected, setHyperConnected] = useState(false);
  const [cjConnected, setCjConnected] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Supplier Hub</h1>
        <p className="text-xs text-ink-muted mt-1">Connect your dropshipping suppliers — the agent handles sourcing, ordering, and fulfillment automatically.</p>
      </div>

      {/* Why suppliers matter — agent value prop */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-indigo-900">What the Supplier Agent Does</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Search className="w-4 h-4 text-indigo-500" />,
              title: "Auto-source products",
              desc: "When you describe a product idea, the agent searches both suppliers, compares pricing, shipping times, and MOQ — and recommends the best option.",
            },
            {
              icon: <Zap className="w-4 h-4 text-green-500" />,
              title: "Automated fulfillment",
              desc: "Every Shopify order is automatically forwarded to the supplier. No manual copy-pasting. Orders ship while you sleep.",
            },
            {
              icon: <BarChart2 className="w-4 h-4 text-purple-500" />,
              title: "Margin tracking",
              desc: "Supplier costs feed directly into your P&L and tax expenses. You always know your true margins per product.",
            },
          ].map(item => (
            <div key={item.title} className="bg-white/70 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div>
                <div className="text-xs font-semibold text-gray-800 mb-1">{item.title}</div>
                <div className="text-[11px] text-gray-600 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* HyperSKU */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header band */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-base">HyperSKU</div>
                <div className="text-blue-200 text-xs">Private label · Quality control · Fast shipping</div>
              </div>
            </div>
            {hyperConnected && (
              <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* What it is */}
            <p className="text-xs text-gray-600 leading-relaxed">
              HyperSKU is a premium dropshipping platform focused on <strong>private labeling and brand building</strong>.
              Unlike generic platforms, HyperSKU lets you add custom packaging, logos, and inserts —
              turning generic products into your own brand from day one.
            </p>

            {/* Key features */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Why HyperSKU</div>
              {[
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />, text: "Quality control inspections before every shipment" },
                { icon: <Clock className="w-3.5 h-3.5 text-blue-500" />, text: "7–12 day shipping to US/EU (vs 3–4 weeks standard)" },
                { icon: <Sparkles className="w-3.5 h-3.5 text-blue-500" />, text: "Private labeling, custom packaging and inserts" },
                { icon: <Globe className="w-3.5 h-3.5 text-blue-500" />, text: "Dedicated sourcing agent per account" },
              ].map(f => (
                <div key={f.text} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">{f.icon}</span>
                  <span className="text-xs text-gray-600">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Agent capabilities */}
            <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-blue-500 tracking-wider flex items-center gap-1.5">
                <Bot className="w-3 h-3" /> Agent Capabilities
              </div>
              {[
                "Sources products by keyword or category from HyperSKU catalog",
                "Auto-places orders when Shopify sales come in",
                "Tracks shipments and updates order status in dashboard",
                "Pulls supplier cost data into your tax expenses",
              ].map(c => (
                <div key={c} className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-blue-700">{c}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setHyperConnected(c => !c)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                  hyperConnected
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {hyperConnected ? "Disconnect" : "Connect HyperSKU"}
              </button>
              <a
                href="https://www.hypersku.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {hyperConnected && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold uppercase text-gray-400">Connection Settings</div>
                <input placeholder="API Key" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono" />
                <input placeholder="Account Email" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <button className="w-full py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">Save & Test Connection</button>
              </div>
            )}
          </div>
        </div>

        {/* CJDropshipping */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header band */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-base">CJDropshipping</div>
                <div className="text-orange-100 text-xs">Massive catalog · Print-on-demand · Global warehouses</div>
              </div>
            </div>
            {cjConnected && (
              <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* What it is */}
            <p className="text-xs text-gray-600 leading-relaxed">
              CJDropshipping is one of the <strong>largest all-in-one dropshipping platforms</strong> with 400,000+ products,
              print-on-demand capabilities, and warehouses in 50+ countries. Best for testing new products
              quickly and scaling with a huge variety.
            </p>

            {/* Key features */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Why CJDropshipping</div>
              {[
                { icon: <Globe className="w-3.5 h-3.5 text-orange-500" />, text: "400,000+ products across every niche" },
                { icon: <Sparkles className="w-3.5 h-3.5 text-orange-500" />, text: "Print-on-demand for custom apparel and accessories" },
                { icon: <RefreshCw className="w-3.5 h-3.5 text-orange-500" />, text: "US, EU, and CN warehouses for faster local delivery" },
                { icon: <Link2 className="w-3.5 h-3.5 text-orange-500" />, text: "Native Shopify app + API for full automation" },
              ].map(f => (
                <div key={f.text} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">{f.icon}</span>
                  <span className="text-xs text-gray-600">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Agent capabilities */}
            <div className="bg-orange-50 rounded-xl p-3 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-orange-500 tracking-wider flex items-center gap-1.5">
                <Bot className="w-3 h-3" /> Agent Capabilities
              </div>
              {[
                "Searches CJ catalog by keyword, price range, and shipping time",
                "Auto-fulfills Shopify orders via CJ API — zero manual work",
                "Monitors stock levels and alerts when products go OOS",
                "Compares CJ vs HyperSKU pricing for same product",
              ].map(c => (
                <div key={c} className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-orange-700">{c}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setCjConnected(c => !c)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                  cjConnected
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {cjConnected ? "Disconnect" : "Connect CJDropshipping"}
              </button>
              <a
                href="https://cjdropshipping.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-200 transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {cjConnected && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold uppercase text-gray-400">Connection Settings</div>
                <input placeholder="API Key" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 font-mono" />
                <input placeholder="Account Email" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                <button className="w-full py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition">Save & Test Connection</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="text-xs font-semibold text-gray-700 mb-2">💡 HyperSKU vs CJDropshipping — When to use which?</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <div className="font-semibold text-blue-700 mb-1">Use HyperSKU when:</div>
            <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-500">
              <li>You want to build a real brand with custom packaging</li>
              <li>Product quality and inspection matter (supplements, skincare)</li>
              <li>You need faster shipping as a competitive advantage</li>
              <li>You&apos;re scaling a winning product to private label</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-orange-600 mb-1">Use CJDropshipping when:</div>
            <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-500">
              <li>Testing new product ideas with low upfront cost</li>
              <li>You need print-on-demand for custom designs</li>
              <li>You want the widest product variety to test niches</li>
              <li>Local warehouse stock for US/EU faster delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
