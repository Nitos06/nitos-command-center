"use client";

import { useState } from "react";
import {
  Save, Settings, Percent, Clock, DollarSign, Shield, CreditCard,
  Globe, Palette, CheckCircle2, AlertTriangle, Link2, Copy, Eye,
} from "lucide-react";

interface SettingsData {
  default_commission_rate: number;
  commission_type: string;
  cookie_duration: number;
  auto_approve: boolean;
  min_payout_threshold: number;
  payment_method: string;
  paypal_email: string;
  bank_info: string;
  signup_page_url: string;
  signup_page_heading: string;
  signup_page_description: string;
}

interface Props {
  brandId: string;
  settings: SettingsData;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function AffiliateSettings({ brandId, settings: initial }: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const signupUrl = typeof window !== "undefined"
    ? `${window.location.origin}/affiliate/signup?brand=${brandId}`
    : `/affiliate/signup?brand=${brandId}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/affiliates/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brand_id: brandId }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Commission Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <Percent size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Commission Settings</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
              <select
                value={form.commission_type}
                onChange={e => update("commission_type", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission Rate</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.default_commission_rate}
                  onChange={e => update("default_commission_rate", Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {form.commission_type === "percentage" ? "%" : "$"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cookie Duration (days)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.cookie_duration}
                onChange={e => update("cookie_duration", Number(e.target.value))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400">How long the tracking cookie persists after a click</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <Shield size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Approval Settings</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-approve Affiliates</label>
              <p className="text-xs text-gray-400 mt-0.5">Automatically approve new affiliate signups without manual review</p>
            </div>
            <Toggle on={form.auto_approve} onChange={v => update("auto_approve", v)} />
          </div>
          {!form.auto_approve && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Manual approval is enabled. New affiliates will be in "pending" status until you approve them.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <CreditCard size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Payout Settings</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout Threshold ($)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.min_payout_threshold}
                onChange={e => update("min_payout_threshold", Number(e.target.value))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400">Minimum commission balance before a payout can be requested</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={form.payment_method}
              onChange={e => update("payment_method", e.target.value)}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="store_credit">Store Credit</option>
            </select>
          </div>
          {form.payment_method === "paypal" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
              <input
                type="email"
                value={form.paypal_email}
                onChange={e => update("paypal_email", e.target.value)}
                placeholder="your@paypal.com"
                className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          {form.payment_method === "bank_transfer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Information</label>
              <textarea
                value={form.bank_info}
                onChange={e => update("bank_info", e.target.value)}
                placeholder="Bank name, account number, routing number, SWIFT/BIC..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">This information is used for processing affiliate payouts</p>
            </div>
          )}
        </div>
      </div>

      {/* Signup Page */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <Globe size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Affiliate Signup Page</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signup Page URL</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 font-mono truncate">
                {signupUrl}
              </div>
              <button
                onClick={copyUrl}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  copied ? "bg-green-100 text-green-700" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {copied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Heading</label>
            <input
              value={form.signup_page_heading}
              onChange={e => update("signup_page_heading", e.target.value)}
              placeholder="Join Our Affiliate Program"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Description</label>
            <textarea
              value={form.signup_page_description}
              onChange={e => update("signup_page_description", e.target.value)}
              placeholder="Describe the benefits of joining your affiliate program..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <Eye size={12} /> Preview
            </p>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6 text-center">
              <h4 className="text-lg font-bold text-gray-900">{form.signup_page_heading || "Join Our Affiliate Program"}</h4>
              {form.signup_page_description && (
                <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">{form.signup_page_description}</p>
              )}
              <div className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
                Apply Now
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {form.commission_type === "percentage"
                  ? `Earn ${form.default_commission_rate}% commission`
                  : `Earn $${form.default_commission_rate} per sale`
                }
                {" "}&middot; {form.cookie_duration}-day cookie
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} />
              Settings saved successfully
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <><Save size={16} /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}
