"use client";

import { useState } from "react";
import {
  Mail, MessageSquare, Clock, Gift, Star, Send, Loader2,
  CheckCircle2, Settings, Zap, Bell,
} from "lucide-react";

interface Settings {
  id?: string;
  brand_id: string;
  enabled: boolean;
  send_after_days: number;
  reminder_after_days: number;
  channel: "email" | "sms" | "both";
  email_subject: string;
  email_body: string;
  reward_enabled: boolean;
  reward_type: "discount_pct" | "fixed" | "free_product";
  reward_value: number;
  reward_min_rating: number;
  auto_publish_enabled: boolean;
  auto_publish_min_rating: number;
}

const DEFAULTS: Settings = {
  brand_id: "",
  enabled: true,
  send_after_days: 7,
  reminder_after_days: 14,
  channel: "email",
  email_subject: "How was your order, {{customer_name}}?",
  email_body: "Hi {{customer_name}},\n\nWe hope you're loving your recent purchase! We'd really appreciate it if you could take a moment to leave a review.\n\n{{review_link}}\n\nThank you for being a valued customer!",
  reward_enabled: false,
  reward_type: "discount_pct",
  reward_value: 10,
  reward_min_rating: 4,
  auto_publish_enabled: true,
  auto_publish_min_rating: 4,
};

interface Props {
  brandId: string;
  settings: Settings | null;
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

export default function RequestSettingsForm({ brandId, settings }: Props) {
  const initial = settings ? { ...DEFAULTS, ...settings } : { ...DEFAULTS, brand_id: brandId };
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/apps/reviews/request-settings", {
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

  async function sendTest() {
    setTestSending(true);
    try {
      await fetch("/api/apps/reviews/request-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } finally {
      setTestSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <Toggle
          checked={form.enabled}
          onChange={v => set("enabled", v)}
          label="Review Request Emails"
          description="Automatically send review request emails after order fulfillment"
        />
      </div>

      {/* Timing */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">Timing</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Send after (days)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.send_after_days}
              onChange={e => set("send_after_days", Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <div className="text-[10px] text-gray-400 mt-0.5">Days after order fulfillment</div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Reminder after (days)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.reminder_after_days}
              onChange={e => set("reminder_after_days", Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <div className="text-[10px] text-gray-400 mt-0.5">Days after first email if no review</div>
          </div>
        </div>
      </div>

      {/* Channel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">Channel</span>
        </div>
        <div className="flex items-center gap-2">
          {(["email", "sms", "both"] as const).map(ch => (
            <button
              key={ch}
              onClick={() => set("channel", ch)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                form.channel === ch
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {ch === "email" && <Mail className="w-3 h-3" />}
              {ch === "sms" && <MessageSquare className="w-3 h-3" />}
              {ch === "both" && <Zap className="w-3 h-3" />}
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Email template */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">Email Template</span>
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Subject</label>
          <input
            type="text"
            value={form.email_subject}
            onChange={e => set("email_subject", e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Body</label>
          <textarea
            value={form.email_body}
            onChange={e => set("email_body", e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none font-mono"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Variables:</span>
          {["{{customer_name}}", "{{review_link}}"].map(v => (
            <span key={v} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono">{v}</span>
          ))}
        </div>
      </div>

      {/* Reward settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-900">Review Rewards</span>
        </div>
        <Toggle
          checked={form.reward_enabled}
          onChange={v => set("reward_enabled", v)}
          label="Enable rewards"
          description="Incentivize customers to leave reviews with rewards"
        />
        {form.reward_enabled && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Reward type</label>
              <select
                value={form.reward_type}
                onChange={e => set("reward_type", e.target.value as Settings["reward_type"])}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none"
              >
                <option value="discount_pct">Discount %</option>
                <option value="fixed">Fixed amount</option>
                <option value="free_product">Free product</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                {form.reward_type === "discount_pct" ? "Discount %" : form.reward_type === "fixed" ? "Amount ($)" : "Value"}
              </label>
              <input
                type="number"
                min={0}
                value={form.reward_value}
                onChange={e => set("reward_value", Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Min rating for reward</label>
              <select
                value={form.reward_min_rating}
                onChange={e => set("reward_min_rating", Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Auto-publish */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold text-gray-900">Auto-Publish</span>
        </div>
        <Toggle
          checked={form.auto_publish_enabled}
          onChange={v => set("auto_publish_enabled", v)}
          label="Auto-publish reviews"
          description="Automatically approve reviews above the minimum rating"
        />
        {form.auto_publish_enabled && (
          <div className="pt-1">
            <label className="text-xs text-gray-600 block mb-1">Minimum rating to auto-publish</label>
            <div className="flex items-center gap-2">
              {[3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => set("auto_publish_min_rating", r)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    form.auto_publish_min_rating === r
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Star className={`w-3 h-3 ${form.auto_publish_min_rating === r ? "fill-green-400 text-green-400" : ""}`} />
                  {r}+ stars
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
        <button
          onClick={sendTest}
          disabled={testSending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : testSent ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Send className="w-3.5 h-3.5" />}
          {testSent ? "Test Sent!" : "Send Test Email"}
        </button>
      </div>
    </div>
  );
}
