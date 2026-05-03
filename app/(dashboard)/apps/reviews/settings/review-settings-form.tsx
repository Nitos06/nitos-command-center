"use client";

import { useState } from "react";
import {
  Settings, Loader2, CheckCircle2, Key, Link, Mail, Store,
  Palette, Eye, EyeOff, Star, Zap, ExternalLink,
} from "lucide-react";

interface ReviewSettings {
  id?: string;
  brand_id: string;
  meta_api_key?: string;
  meta_audience_id?: string;
  email_auto_segment_enabled: boolean;
  email_segment_min_rating: number;
  store_name_display?: string;
  widget_branding_enabled: boolean;
}

const DEFAULTS: ReviewSettings = {
  brand_id: "",
  meta_api_key: "",
  meta_audience_id: "",
  email_auto_segment_enabled: true,
  email_segment_min_rating: 5,
  store_name_display: "",
  widget_branding_enabled: true,
};

interface Props {
  brandId: string;
  settings: ReviewSettings | null;
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs font-medium text-gray-900">{label}</div>
        {description && <div className="text-[11px] text-gray-500 mt-0.5">{description}</div>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}

export default function ReviewSettingsForm({ brandId, settings }: Props) {
  const initial = settings ? { ...DEFAULTS, ...settings } : { ...DEFAULTS, brand_id: brandId };
  const [form, setForm] = useState<ReviewSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const set = <K extends keyof ReviewSettings>(key: K, value: ReviewSettings[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/apps/reviews/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brand_id: brandId }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Meta Ads Connection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Meta Ads Connection</div>
            <div className="text-[11px] text-gray-500">Connect your Meta Ads account for UGC export and Custom Audiences</div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Meta API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type={showApiKey ? "text" : "password"}
              value={form.meta_api_key || ""}
              onChange={e => set("meta_api_key", e.target.value)}
              placeholder="Enter your Meta Marketing API key"
              className="w-full pl-8 pr-10 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Custom Audience ID</label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={form.meta_audience_id || ""}
              onChange={e => set("meta_audience_id", e.target.value)}
              placeholder="e.g., 23851234567890123"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="text-[10px] text-gray-400 mt-1">UGC customer emails will be added to this audience for lookalike targeting</div>
        </div>
      </div>

      {/* Email App Connection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
            <Mail className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Email App Connection</div>
            <div className="text-[11px] text-gray-500">Auto-segment 5-star reviewers into your email flows</div>
          </div>
        </div>

        <Toggle
          checked={form.email_auto_segment_enabled}
          onChange={v => set("email_auto_segment_enabled", v)}
          label="Auto-segment high-rating reviewers"
          description="Automatically add reviewers to a VIP segment in your email app"
        />

        {form.email_auto_segment_enabled && (
          <div>
            <label className="text-xs text-gray-600 block mb-1">Minimum rating for auto-segment</label>
            <div className="flex items-center gap-1.5">
              {[3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => set("email_segment_min_rating", r)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    form.email_segment_min_rating === r
                      ? "bg-purple-50 border-purple-200 text-purple-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Star className={`w-3 h-3 ${form.email_segment_min_rating === r ? "fill-purple-400 text-purple-400" : ""}`} />
                  {r}+ stars
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <Store className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">General Settings</div>
            <div className="text-[11px] text-gray-500">Customize how your store appears in review widgets</div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Store Name Display</label>
          <input
            type="text"
            value={form.store_name_display || ""}
            onChange={e => set("store_name_display", e.target.value)}
            placeholder="Your Store Name"
            className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <div className="text-[10px] text-gray-400 mt-1">Displayed in the review widget header and reply signatures</div>
        </div>

        <Toggle
          checked={form.widget_branding_enabled}
          onChange={v => set("widget_branding_enabled", v)}
          label="Show widget branding"
          description={'Display "Powered by Reviews" in the widget footer'}
        />
      </div>

      {/* Save */}
      <div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
