"use client";

import { useState, useMemo } from "react";
import {
  Image as ImageIcon, Video, Star, Zap, Check, ExternalLink,
  Loader2, Filter, Download, CheckCircle2, Sparkles, Eye,
} from "lucide-react";

interface UGCAsset {
  id: string;
  review_id?: string;
  type: "photo" | "video";
  url: string;
  thumbnail_url?: string;
  quality_score: number;
  rating: number;
  customer_name?: string;
  product_title?: string;
  used_in_ads: boolean;
  created_at: string;
  brand_id: string;
}

interface Props {
  brandId: string;
  assets: UGCAsset[];
}

type TabId = "all" | "photos" | "videos" | "high_quality" | "unused";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-2.5 h-2.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

export default function CreativeCenterView({ brandId, assets }: Props) {
  const [tab, setTab] = useState<TabId>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: assets.length },
    { id: "photos", label: "Photos", count: assets.filter(a => a.type === "photo").length },
    { id: "videos", label: "Videos", count: assets.filter(a => a.type === "video").length },
    { id: "high_quality", label: "High Quality", count: assets.filter(a => a.quality_score >= 8).length },
    { id: "unused", label: "Unused in Ads", count: assets.filter(a => !a.used_in_ads).length },
  ];

  const filtered = useMemo(() => assets.filter(a => {
    if (tab === "photos") return a.type === "photo";
    if (tab === "videos") return a.type === "video";
    if (tab === "high_quality") return a.quality_score >= 8;
    if (tab === "unused") return !a.used_in_ads;
    return true;
  }), [assets, tab]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  }

  async function exportToMeta() {
    setExporting(true);
    setExported(false);
    try {
      await fetch("/api/ugc/export-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, assetIds: Array.from(selected) }),
      });
      setExported(true);
      setTimeout(() => setExported(false), 3000);
      setSelected(new Set());
    } finally {
      setExporting(false);
    }
  }

  const photos = assets.filter(a => a.type === "photo").length;
  const videos = assets.filter(a => a.type === "video").length;
  const highQuality = assets.filter(a => a.quality_score >= 8).length;
  const avgScore = assets.length ? (assets.reduce((s, a) => s + a.quality_score, 0) / assets.length).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      {/* Auto UGC Pipeline banner */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-gray-900">Auto UGC Pipeline</span>
          <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
        </div>
        <div className="text-xs text-gray-600 leading-relaxed">
          5-star reviews with media are automatically saved as UGC assets and scored for quality. Customer emails from high-quality
          reviews are added to your Meta Custom Audience for lookalike targeting. This pipeline runs automatically with every new
          review -- no manual action needed.
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="bg-white rounded-lg p-2 border border-gray-100 text-center">
            <div className="text-sm font-bold text-gray-900">{assets.length}</div>
            <div className="text-[10px] text-gray-500">Total Assets</div>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100 text-center">
            <div className="text-sm font-bold text-gray-900">{photos}</div>
            <div className="text-[10px] text-gray-500">Photos</div>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100 text-center">
            <div className="text-sm font-bold text-gray-900">{videos}</div>
            <div className="text-[10px] text-gray-500">Videos</div>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100 text-center">
            <div className="text-sm font-bold text-gray-900">{avgScore}</div>
            <div className="text-[10px] text-gray-500">Avg Score /10</div>
          </div>
        </div>
      </div>

      {/* Filter tabs + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelected(new Set()); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                tab === t.id
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {t.label} <span className="text-gray-400 ml-0.5">({t.count})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button
              onClick={selectAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-300"
            >
              <Check className="w-3 h-3" />
              {selected.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={exportToMeta}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : exported ? <CheckCircle2 className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
              {exported ? "Exported!" : `Export to Meta Ads (${selected.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Asset grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <div className="text-xs text-gray-400">No UGC assets match this filter.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(asset => {
            const isSelected = selected.has(asset.id);
            return (
              <div
                key={asset.id}
                onClick={() => toggleSelect(asset.id)}
                className={`group relative bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${
                  isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-gray-100">
                  {asset.thumbnail_url || asset.url ? (
                    <img
                      src={asset.thumbnail_url || asset.url}
                      alt={asset.product_title || "UGC asset"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {asset.type === "video" ? <Video className="w-8 h-8 text-gray-300" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-1.5 left-1.5">
                    {asset.type === "video" ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                        <Video className="w-2.5 h-2.5" /> Video
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                        <ImageIcon className="w-2.5 h-2.5" /> Photo
                      </span>
                    )}
                  </div>

                  {/* Quality score overlay */}
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      asset.quality_score >= 8 ? "bg-green-500 text-white" :
                      asset.quality_score >= 5 ? "bg-amber-500 text-white" :
                      "bg-gray-500 text-white"
                    }`}>
                      {asset.quality_score}/10
                    </span>
                  </div>

                  {/* In ads badge */}
                  {asset.used_in_ads && (
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        In Ads
                      </span>
                    </div>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <Stars rating={asset.rating} />
                  <div className="text-[11px] text-gray-700 mt-0.5 truncate">{asset.product_title || "Unknown product"}</div>
                  <div className="text-[10px] text-gray-400 truncate">{asset.customer_name || "Anonymous"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
