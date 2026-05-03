"use client";

import { useState } from "react";
import {
  Star, Grid3X3, Image as ImageIcon, BarChart3, MessageSquare,
  Layout, Copy, CheckCircle2, Settings, Palette, Hash, Eye,
} from "lucide-react";

interface WidgetType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: string;
}

interface WidgetConfig {
  minRating: number;
  count: number;
  accentColor: string;
}

interface Props {
  brandId: string;
  appUrl: string;
}

const WIDGETS: WidgetType[] = [
  {
    id: "carousel",
    name: "Reviews Carousel",
    description: "Scrollable carousel of customer reviews with star ratings and photos",
    icon: Layout,
    preview: "Horizontal scroll of review cards with navigation arrows",
  },
  {
    id: "star-badge",
    name: "Star Rating Badge",
    description: "Compact star rating summary with total review count",
    icon: Star,
    preview: "Inline badge showing average rating and review count",
  },
  {
    id: "grid",
    name: "Reviews Grid",
    description: "Responsive grid layout showing multiple reviews at once",
    icon: Grid3X3,
    preview: "Multi-column grid of review cards with pagination",
  },
  {
    id: "ugc-wall",
    name: "UGC Photo Wall",
    description: "Instagram-style masonry grid of customer photos and videos",
    icon: ImageIcon,
    preview: "Masonry layout of customer-submitted photos",
  },
  {
    id: "trust-bar",
    name: "Floating Trust Bar",
    description: "Sticky bottom bar showing real-time review activity",
    icon: BarChart3,
    preview: "Fixed bottom bar with recent review notifications",
  },
  {
    id: "popup",
    name: "Review Request Popup",
    description: "Post-purchase popup prompting customers to leave a review",
    icon: MessageSquare,
    preview: "Modal popup with star selector and text area",
  },
];

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#000000",
];

export default function WidgetConfigurator({ brandId, appUrl }: Props) {
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, WidgetConfig>>({});
  const [copied, setCopied] = useState<string | null>(null);

  function getConfig(widgetId: string): WidgetConfig {
    return configs[widgetId] || { minRating: 4, count: 10, accentColor: "#6366f1" };
  }

  function updateConfig(widgetId: string, update: Partial<WidgetConfig>) {
    setConfigs(prev => ({
      ...prev,
      [widgetId]: { ...getConfig(widgetId), ...update },
    }));
  }

  function getEmbedCode(widget: WidgetType): string {
    const cfg = getConfig(widget.id);
    return `<div data-reviews-widget="${widget.id}" data-brand="${brandId}" data-min-rating="${cfg.minRating}" data-count="${cfg.count}" data-color="${cfg.accentColor}"></div>\n<script src="${appUrl}/api/apps/reviews/widget.js" defer></script>`;
  }

  function copyEmbed(widgetId: string) {
    const widget = WIDGETS.find(w => w.id === widgetId);
    if (!widget) return;
    navigator.clipboard.writeText(getEmbedCode(widget));
    setCopied(widgetId);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Widget grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {WIDGETS.map(widget => {
          const isActive = activeWidget === widget.id;
          const Icon = widget.icon;
          const cfg = getConfig(widget.id);
          return (
            <div key={widget.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${isActive ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"}`}>
              {/* Mini preview */}
              <div className="bg-gray-50 p-4 border-b border-gray-100 min-h-[100px] flex flex-col items-center justify-center gap-2">
                <Icon className="w-8 h-8 text-gray-300" />
                <div className="text-[10px] text-gray-400 text-center">{widget.preview}</div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="text-xs font-semibold text-gray-900">{widget.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{widget.description}</div>

                <div className="flex items-center gap-1.5 mt-3">
                  <button
                    onClick={() => setActiveWidget(isActive ? null : widget.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                      isActive ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Settings className="w-3 h-3" />
                    Customize
                  </button>
                  <button
                    onClick={() => copyEmbed(widget.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    {copied === widget.id ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copied === widget.id ? "Copied!" : "Copy Code"}
                  </button>
                </div>
              </div>

              {/* Customization panel */}
              {isActive && (
                <div className="border-t border-gray-100 p-3 bg-gray-50/30 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Min Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          onClick={() => updateConfig(widget.id, { minRating: r })}
                          className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs border transition-colors ${
                            cfg.minRating === r ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-gray-200 text-gray-500"
                          }`}
                        >
                          <Star className={`w-2.5 h-2.5 ${cfg.minRating === r ? "fill-amber-400 text-amber-400" : ""}`} />
                          {r}+
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Review Count</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={cfg.count}
                      onChange={e => updateConfig(widget.id, { count: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Accent Color</label>
                    <div className="flex items-center gap-1.5">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => updateConfig(widget.id, { accentColor: c })}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${cfg.accentColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Embed Code</label>
                    <pre className="bg-gray-900 text-green-400 text-[10px] p-2.5 rounded-lg overflow-x-auto leading-relaxed">
                      {getEmbedCode(widget)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
