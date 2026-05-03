"use client";

import { useState } from "react";
import { Save, Copy, Check, Settings, Palette, Type, Layout } from "lucide-react";

export default function GiftSettingsPage() {
  const [progressColor, setProgressColor] = useState("#9333ea");
  const [progressBg, setProgressBg] = useState("#e5e7eb");
  const [messageText, setMessageText] = useState(
    "Spend {{remaining}} more to get a FREE {{product}}!"
  );
  const [unlockedText, setUnlockedText] = useState(
    "You unlocked a FREE {{product}}! Added to your cart."
  );
  const [position, setPosition] = useState<"above-checkout" | "below-items" | "cart-drawer">(
    "above-checkout"
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = `<div id="gift-progress-widget" data-brand="YOUR_BRAND_ID"></div>
<script src="https://cdn.yourdomain.com/widgets/gift-progress.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/apps/gift/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressColor,
          progressBg,
          messageText,
          unlockedText,
          position,
        }),
      });
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          Gift Widget Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize how the free gift progress widget appears on your store
        </p>
      </div>

      {/* Progress Bar Colors */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-500" />
          Progress Bar Appearance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bar Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={progressColor}
                onChange={(e) => setProgressColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={progressColor}
                onChange={(e) => setProgressColor(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={progressBg}
                onChange={(e) => setProgressBg(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={progressBg}
                onChange={(e) => setProgressBg(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Preview</p>
          <div className="w-full rounded-full h-4 overflow-hidden" style={{ backgroundColor: progressBg }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: "65%", backgroundColor: progressColor }}
            />
          </div>
        </div>
      </div>

      {/* Text Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Type className="w-4 h-4 text-purple-500" />
          Message Text
        </h2>
        <p className="text-xs text-gray-400">
          Use {"{{remaining}}"} for dollar amount remaining and {"{{product}}"} for gift product name.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progress Message
          </label>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unlocked Message
          </label>
          <input
            type="text"
            value={unlockedText}
            onChange={(e) => setUnlockedText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Position */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Layout className="w-4 h-4 text-purple-500" />
          Widget Position
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { value: "above-checkout", label: "Above Checkout Button" },
              { value: "below-items", label: "Below Cart Items" },
              { value: "cart-drawer", label: "Cart Drawer Header" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPosition(opt.value)}
              className={`border rounded-lg p-3 text-sm text-left transition-colors ${
                position === opt.value
                  ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embed Code */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Widget Embed Code</h2>
        <p className="text-xs text-gray-400">
          Add this snippet to your Shopify theme (cart template) or use the Theme App Extension.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
