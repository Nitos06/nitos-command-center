"use client";

import { useState } from "react";
import {
  Save, Copy, Check, Palette, Type, Code, Zap, ToggleLeft, ToggleRight,
  RefreshCw,
} from "lucide-react";

interface WidgetDefaults {
  bgColor: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
  fontFamily: string;
  borderRadius: number;
}

const FONT_OPTIONS = [
  { value: "'Barlow Condensed', sans-serif", label: "Barlow Condensed" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "system-ui, sans-serif", label: "System Default" },
  { value: "'Georgia', serif", label: "Georgia (Serif)" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 text-xs font-mono px-2 py-1.5 border border-gray-200 rounded bg-white"
        />
      </div>
    </div>
  );
}

export default function BundleSettingsPage() {
  const [defaults, setDefaults] = useState<WidgetDefaults>({
    bgColor: "#ffffff",
    accentColor: "#4f46e5",
    buttonBg: "#4f46e5",
    buttonText: "#ffffff",
    fontFamily: "'Barlow Condensed', sans-serif",
    borderRadius: 12,
  });

  const [autoDetectFBT, setAutoDetectFBT] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const patch = (p: Partial<WidgetDefaults>) => setDefaults(d => ({ ...d, ...p }));

  const embedCode = `<!-- Bundle Widget -->
<div id="bundle-widget" data-brand="YOUR_BRAND_ID"></div>
<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widgets/bundle-widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/bundles/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widget_defaults: defaults,
          auto_detect_fbt: autoDetectFBT,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bundle Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Default widget styling and configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Default Widget Styling */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Default Widget Colors</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Background" value={defaults.bgColor} onChange={v => patch({ bgColor: v })} />
          <ColorField label="Accent Color" value={defaults.accentColor} onChange={v => patch({ accentColor: v })} />
          <ColorField label="Button Background" value={defaults.buttonBg} onChange={v => patch({ buttonBg: v })} />
          <ColorField label="Button Text" value={defaults.buttonText} onChange={v => patch({ buttonText: v })} />
        </div>
      </div>

      {/* Font & Border Radius */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Type className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Typography & Shape</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Font Family</span>
            <select
              value={defaults.fontFamily}
              onChange={e => patch({ fontFamily: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Border Radius (px)</span>
            <input
              type="number"
              min="0"
              max="32"
              value={defaults.borderRadius}
              onChange={e => patch({ borderRadius: parseInt(e.target.value) || 0 })}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </div>
        </div>

        {/* Preview swatch */}
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Preview</span>
          <div
            className="p-4 border border-gray-200"
            style={{
              backgroundColor: defaults.bgColor,
              borderRadius: `${defaults.borderRadius}px`,
              fontFamily: defaults.fontFamily,
            }}
          >
            <div className="text-sm font-bold text-gray-800 mb-2">Widget Title Preview</div>
            <div className="text-xs text-gray-500 mb-3">This is how text looks with your settings</div>
            <div
              className="w-full py-2 text-center text-sm font-semibold"
              style={{
                backgroundColor: defaults.buttonBg,
                color: defaults.buttonText,
                borderRadius: `${Math.max(defaults.borderRadius - 4, 4)}px`,
              }}
            >
              Add to Cart
            </div>
            <div className="flex items-center gap-2 mt-2 justify-center">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: defaults.accentColor }}
              />
              <span className="text-[10px] font-medium" style={{ color: defaults.accentColor }}>
                Accent color
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Storefront Widget Embed Code</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-[11px] text-green-400 whitespace-pre-wrap break-all font-mono leading-relaxed">
            {embedCode}
          </pre>
        </div>
        <p className="text-xs text-gray-500">
          Paste this code into your Shopify theme, product page template, or any HTML page where you want the bundle widget to appear.
        </p>
      </div>

      {/* Auto-detect FBT */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Auto-detect Frequently Bought Together</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Analyze your order history to automatically suggest FBT bundles. Products that are frequently purchased together will be identified and suggested as new bundles.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoDetectFBT(!autoDetectFBT)}
            className="flex-shrink-0"
          >
            {autoDetectFBT
              ? <ToggleRight className="w-10 h-10 text-green-500" />
              : <ToggleLeft className="w-10 h-10 text-gray-300" />
            }
          </button>
        </div>
        {autoDetectFBT && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-purple-700 font-medium">
              FBT analysis runs daily. Last run: 2 hours ago &mdash; 3 new suggestions found.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
