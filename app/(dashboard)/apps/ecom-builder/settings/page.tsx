"use client";

import { useState } from "react";
import { Save, Settings, RotateCcw, Globe, BookOpen } from "lucide-react";

export default function EcomBuilderSettingsPage() {
  const [storeUrl, setStoreUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/apps/ecom-builder/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_url: storeUrl }),
      });
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetProgress = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    // Clear local storage progress
    localStorage.removeItem("ecom-builder-progress");
    setResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Builder Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your e-commerce builder guide preferences
        </p>
      </div>

      {/* Guide Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          Guide Progress
        </h2>
        <p className="text-sm text-gray-500">
          Reset your guide progress to start fresh. This will uncheck all completed steps.
        </p>
        <button
          onClick={handleResetProgress}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            resetConfirm
              ? "bg-red-600 text-white hover:bg-red-700"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {resetConfirm ? "Click Again to Confirm Reset" : "Reset Progress"}
        </button>
        {resetConfirm && (
          <p className="text-xs text-red-500">
            This action cannot be undone. Click the button again to confirm.
          </p>
        )}
      </div>

      {/* Default Store URL */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" />
          Default Store URL
        </h2>
        <p className="text-sm text-gray-500">
          Set your Shopify store URL to enable quick links throughout the guide.
        </p>
        <input
          type="url"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://your-store.myshopify.com"
          className="w-full max-w-lg border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
