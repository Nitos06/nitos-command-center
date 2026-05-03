"use client";

import { useState } from "react";
import { Save, Settings, FileSpreadsheet, Mail, Shield } from "lucide-react";

export default function BulkEditorSettingsPage() {
  const [defaultFormat, setDefaultFormat] = useState<"csv" | "xlsx">("csv");
  const [autoBackup, setAutoBackup] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/apps/bulk-editor/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_format: defaultFormat,
          auto_backup: autoBackup,
          notification_email: notificationEmail,
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
          <Settings className="w-6 h-6 text-indigo-600" />
          Bulk Editor Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure default behaviors for imports and exports
        </p>
      </div>

      {/* Default Export Format */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          Default Export Format
        </h2>
        <div className="flex gap-3">
          {(["csv", "xlsx"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setDefaultFormat(fmt)}
              className={`px-6 py-3 rounded-lg border text-sm font-medium uppercase transition-colors ${
                defaultFormat === fmt
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Backup */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          Auto Backup Before Import
        </h2>
        <p className="text-sm text-gray-500">
          Automatically create a backup export of the affected entity before starting an import job.
        </p>
        <button
          onClick={() => setAutoBackup(!autoBackup)}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors ${
            autoBackup
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-500"
          }`}
        >
          <div
            className={`w-10 h-6 rounded-full transition-colors relative ${
              autoBackup ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                autoBackup ? "left-5" : "left-1"
              }`}
            />
          </div>
          {autoBackup ? "Enabled" : "Disabled"}
        </button>
      </div>

      {/* Notification Email */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-500" />
          Job Completion Notification
        </h2>
        <p className="text-sm text-gray-500">
          Receive an email when an import or export job completes or fails.
        </p>
        <input
          type="email"
          value={notificationEmail}
          onChange={(e) => setNotificationEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
