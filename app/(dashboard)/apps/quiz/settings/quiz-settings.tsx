"use client";

import { useState } from "react";
import {
  Save, Loader2, CheckCircle2, Copy, Check, Mail, Link2,
  Code2, Share2, Gift, Tag, Settings2, Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  brandId: string;
  quizzes: any[];
}

interface SettingsState {
  emailFlowId: string;
  autoTagPrefix: string;
  autoTagEnabled: boolean;
  referralEnabled: boolean;
  referralRewardType: "discount_pct" | "fixed";
  referralRewardValue: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Icon className="w-4 h-4 text-indigo-500" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </label>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? "bg-indigo-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-gray-50 border rounded-lg px-3 py-2.5 text-xs font-mono text-gray-700 break-all select-all">
          {value}
        </code>
        <button
          onClick={copy}
          className="shrink-0 p-2 rounded-lg border hover:bg-gray-50 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function QuizSettings({ brandId, quizzes }: Props) {
  const firstQuiz = quizzes[0];
  const meta = firstQuiz?.meta ?? {};

  const [settings, setSettings] = useState<SettingsState>({
    emailFlowId: meta.settings?.emailFlowId ?? "",
    autoTagPrefix: meta.settings?.autoTagPrefix ?? "quiz_",
    autoTagEnabled: meta.settings?.autoTagEnabled ?? true,
    referralEnabled: meta.settings?.referralEnabled ?? false,
    referralRewardType: meta.settings?.referralRewardType ?? "discount_pct",
    referralRewardValue: meta.settings?.referralRewardValue ?? 10,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/apps/quiz/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, quizId: firstQuiz?.id, settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const quizId = firstQuiz?.id ?? "YOUR_QUIZ_ID";
  const embedCode = `<div id="quiz-widget" data-quiz-id="${quizId}"></div>\n<script src="https://cdn.yourdomain.com/quiz-widget.js" async></script>`;
  const quizUrl = `https://yourdomain.com/quiz/${quizId}`;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Email connection */}
      <Section title="Email App Connection" icon={Mail}>
        <Field
          label="Email Flow ID"
          value={settings.emailFlowId}
          onChange={v => set("emailFlowId", v)}
          placeholder="flow_abc123"
          hint="The email flow that triggers when a quiz visitor submits their email. Create flows in the Email app."
        />
        <Toggle
          label="Auto-tag contacts"
          description="Automatically tag contacts with their quiz answers (e.g. quiz_comfort, quiz_performance)."
          checked={settings.autoTagEnabled}
          onChange={v => set("autoTagEnabled", v)}
        />
        {settings.autoTagEnabled && (
          <Field
            label="Tag prefix"
            value={settings.autoTagPrefix}
            onChange={v => set("autoTagPrefix", v)}
            placeholder="quiz_"
            hint="Tags will be formatted as prefix + answer tag (e.g. quiz_comfort)."
          />
        )}
      </Section>

      {/* Referral settings */}
      <Section title="Referral Settings" icon={Gift}>
        <Toggle
          label="Enable quiz referrals"
          description="Let customers share their quiz results with a referral link and earn rewards."
          checked={settings.referralEnabled}
          onChange={v => set("referralEnabled", v)}
        />
        {settings.referralEnabled && (
          <div className="space-y-4 pt-2">
            <div>
              <span className="text-xs font-medium text-gray-600 mb-1.5 block">Reward type</span>
              <div className="flex items-center gap-2">
                {(["discount_pct", "fixed"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => set("referralRewardType", t)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                      settings.referralRewardType === t
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {t === "discount_pct" ? "Percentage discount" : "Fixed amount"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-600 mb-1 block">
                Reward value {settings.referralRewardType === "discount_pct" ? "(%)" : "($)"}
              </span>
              <input
                type="number"
                value={settings.referralRewardValue}
                onChange={e => set("referralRewardValue", Number(e.target.value))}
                className="w-32 border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}
      </Section>

      {/* Embed code */}
      <Section title="Widget Embed Code" icon={Code2}>
        <p className="text-xs text-gray-500">
          Paste this snippet into your Shopify theme or any page where you want the quiz widget to appear.
        </p>
        <CopyBlock label="Embed snippet" value={embedCode} />
      </Section>

      {/* Quiz URL */}
      <Section title="Quiz URL" icon={Link2}>
        <p className="text-xs text-gray-500">
          Share this link directly with customers via email, social media, or ads.
        </p>
        <CopyBlock label="Shareable URL" value={quizUrl} />
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
