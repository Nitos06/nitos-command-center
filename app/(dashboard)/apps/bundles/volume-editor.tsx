"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Save, Copy, Check, Plus, Trash2, ChevronDown, ChevronRight,
  ShieldCheck, Truck, Award, Headphones, Palette, Type, Tag,
  Settings, Layers, GripVertical,
} from "lucide-react";

/* ─── types ─── */
interface Tier {
  id: string;
  qty: number;
  discountPct: number;
  label: string;
  badge: string;
}

interface Guarantee {
  id: string;
  title: string;
  description: string;
}

interface VolumeConfig {
  unitPrice: number;
  title: string;
  subtitle: string;
  ctaText: string;
  bgColor: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
  tiers: Tier[];
  guarantees: Guarantee[];
}

interface Props {
  brandId: string;
  initialConfig: any | null;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_TIERS: Tier[] = [
  { id: uid(), qty: 1, discountPct: 0, label: "1 Unit", badge: "" },
  { id: uid(), qty: 2, discountPct: 10, label: "2 Units", badge: "Most Popular" },
  { id: uid(), qty: 3, discountPct: 20, label: "3 Units", badge: "Best Value" },
];

const DEFAULT_GUARANTEES: Guarantee[] = [
  { id: uid(), title: "30-Day Guarantee", description: "Full refund, no questions asked" },
  { id: uid(), title: "Free Shipping", description: "On all orders over $50" },
  { id: uid(), title: "Premium Quality", description: "Lab tested & certified" },
  { id: uid(), title: "Fast Support", description: "24/7 customer service" },
];

const GUARANTEE_ICONS: Record<string, any> = {
  "30-Day Guarantee": ShieldCheck,
  "Free Shipping": Truck,
  "Premium Quality": Award,
  "Fast Support": Headphones,
};

function pickIcon(title: string) {
  for (const [k, V] of Object.entries(GUARANTEE_ICONS)) {
    if (title.toLowerCase().includes(k.toLowerCase().split("-")[0].trim().toLowerCase())) return V;
  }
  return ShieldCheck;
}

function parseConfig(raw: any): VolumeConfig {
  if (!raw) {
    return {
      unitPrice: 29.99,
      title: "Buy More, Save More",
      subtitle: "Select your bundle size and save big",
      ctaText: "Add to Cart",
      bgColor: "#ffffff",
      accentColor: "#4f46e5",
      buttonBg: "#4f46e5",
      buttonText: "#ffffff",
      tiers: DEFAULT_TIERS,
      guarantees: DEFAULT_GUARANTEES,
    };
  }
  return {
    unitPrice: raw.unit_price ?? 29.99,
    title: raw.title ?? "Buy More, Save More",
    subtitle: raw.subtitle ?? "Select your bundle size and save big",
    ctaText: raw.cta_text ?? "Add to Cart",
    bgColor: raw.bg_color ?? "#ffffff",
    accentColor: raw.accent_color ?? "#4f46e5",
    buttonBg: raw.button_bg ?? "#4f46e5",
    buttonText: raw.button_text ?? "#ffffff",
    tiers: raw.tiers ?? DEFAULT_TIERS,
    guarantees: raw.guarantees ?? DEFAULT_GUARANTEES,
  };
}

/* ─── collapsible section ─── */
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
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
    </Field>
  );
}

/* ─── LIVE PREVIEW ─── */
function LivePreview({ config, selectedTier, onSelectTier }: {
  config: VolumeConfig; selectedTier: number; onSelectTier: (i: number) => void;
}) {
  const tier = config.tiers[selectedTier] ?? config.tiers[0];
  if (!tier) return null;

  const total = config.unitPrice * tier.qty * (1 - tier.discountPct / 100);
  const perUnit = total / tier.qty;
  const savings = config.unitPrice * tier.qty - total;

  return (
    <div
      className="rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-md w-full"
      style={{ backgroundColor: config.bgColor, fontFamily: "'Barlow Condensed', sans-serif" }}
    >
      {/* Google Fonts link injected via head-like approach */}
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="px-6 pt-6 pb-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {config.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {config.subtitle}
        </p>
      </div>

      {/* Tier selector */}
      <div className="px-6 space-y-2">
        {config.tiers.map((t, i) => {
          const isSelected = i === selectedTier;
          const tierTotal = config.unitPrice * t.qty * (1 - t.discountPct / 100);
          return (
            <button
              key={t.id}
              onClick={() => onSelectTier(i)}
              className="w-full relative rounded-xl border-2 px-4 py-3 flex items-center justify-between transition-all"
              style={{
                borderColor: isSelected ? config.accentColor : "#e5e7eb",
                backgroundColor: isSelected ? `${config.accentColor}08` : "transparent",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: isSelected ? config.accentColor : "#d1d5db" }}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.accentColor }} />
                  )}
                </div>
                <span className="font-semibold text-gray-800" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {t.label}
                </span>
                {t.badge && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ${tierTotal.toFixed(2)}
                </span>
                {t.discountPct > 0 && (
                  <span className="text-xs text-gray-400 line-through ml-2">
                    ${(config.unitPrice * t.qty).toFixed(2)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Price panel */}
      <div className="mx-6 mt-4 rounded-xl p-4" style={{ backgroundColor: `${config.accentColor}0a` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Per unit
            </div>
            <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ${perUnit.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Total
            </div>
            <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ${total.toFixed(2)}
            </div>
          </div>
        </div>
        {savings > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <span className="text-sm font-medium text-green-600" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              You save ${savings.toFixed(2)}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: "#16a34a" }}
            >
              {tier.discountPct}% OFF
            </span>
          </div>
        )}
      </div>

      {/* CTA button */}
      <div className="px-6 mt-4">
        <button
          className="w-full py-3.5 rounded-xl font-bold text-lg tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: config.buttonBg,
            color: config.buttonText,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {config.ctaText} &mdash; ${total.toFixed(2)}
        </button>
      </div>

      {/* Guarantee badges */}
      <div className="px-6 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-2">
          {config.guarantees.map(g => {
            const GIcon = pickIcon(g.title);
            return (
              <div
                key={g.id}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <GIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: config.accentColor }} />
                <div>
                  <div className="text-xs font-semibold text-gray-800" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {g.title}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {g.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN EDITOR ─── */
export default function VolumeEditor({ brandId, initialConfig }: Props) {
  const [config, setConfig] = useState<VolumeConfig>(() => parseConfig(initialConfig));
  const [selectedTier, setSelectedTier] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = useCallback((patch: Partial<VolumeConfig>) => {
    setConfig(c => ({ ...c, ...patch }));
  }, []);

  const updateTier = useCallback((idx: number, patch: Partial<Tier>) => {
    setConfig(c => {
      const tiers = [...c.tiers];
      tiers[idx] = { ...tiers[idx], ...patch };
      return { ...c, tiers };
    });
  }, []);

  const addTier = useCallback(() => {
    setConfig(c => ({
      ...c,
      tiers: [
        ...c.tiers,
        { id: uid(), qty: c.tiers.length + 1, discountPct: (c.tiers.length + 1) * 10, label: `${c.tiers.length + 1} Units`, badge: "" },
      ],
    }));
  }, []);

  const removeTier = useCallback((idx: number) => {
    setConfig(c => {
      const tiers = c.tiers.filter((_, i) => i !== idx);
      return { ...c, tiers };
    });
    setSelectedTier(s => Math.min(s, config.tiers.length - 2));
  }, [config.tiers.length]);

  const updateGuarantee = useCallback((idx: number, patch: Partial<Guarantee>) => {
    setConfig(c => {
      const guarantees = [...c.guarantees];
      guarantees[idx] = { ...guarantees[idx], ...patch };
      return { ...c, guarantees };
    });
  }, []);

  const addGuarantee = useCallback(() => {
    setConfig(c => ({
      ...c,
      guarantees: [...c.guarantees, { id: uid(), title: "New Guarantee", description: "Description here" }],
    }));
  }, []);

  const removeGuarantee = useCallback((idx: number) => {
    setConfig(c => ({
      ...c,
      guarantees: c.guarantees.filter((_, i) => i !== idx),
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/bundles/volume-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          unit_price: config.unitPrice,
          title: config.title,
          subtitle: config.subtitle,
          cta_text: config.ctaText,
          bg_color: config.bgColor,
          accent_color: config.accentColor,
          button_bg: config.buttonBg,
          button_text: config.buttonText,
          tiers: config.tiers,
          guarantees: config.guarantees,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const embedCode = useMemo(() => {
    return `<div id="volume-bundle-widget" data-brand="${brandId}"></div>\n<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widgets/volume-bundle.js" async></script>`;
  }, [brandId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-8 items-start min-h-[calc(100vh-200px)]">
      {/* Live Preview — left side */}
      <div className="flex-1 flex flex-col items-center justify-start pt-4">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Live Preview</div>
        <LivePreview config={config} selectedTier={selectedTier} onSelectTier={setSelectedTier} />
      </div>

      {/* Settings panel — right side, sticky */}
      <div className="w-[420px] flex-shrink-0 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto space-y-3 pb-8 pr-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">Widget Settings</h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              {copied ? "Copied!" : "Embed Code"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition disabled:opacity-50"
              style={{ backgroundColor: config.accentColor }}
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>

        {/* General */}
        <Section title="General" icon={Settings} defaultOpen={true}>
          <Field label="Unit Price ($)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.unitPrice}
              onChange={e => update({ unitPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </Field>
          <Field label="Widget Title">
            <input
              type="text"
              value={config.title}
              onChange={e => update({ title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </Field>
          <Field label="Subtitle">
            <input
              type="text"
              value={config.subtitle}
              onChange={e => update({ subtitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </Field>
          <Field label="CTA Text">
            <input
              type="text"
              value={config.ctaText}
              onChange={e => update({ ctaText: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </Field>
        </Section>

        {/* Colors */}
        <Section title="Colors" icon={Palette} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Background" value={config.bgColor} onChange={v => update({ bgColor: v })} />
            <ColorField label="Accent Color" value={config.accentColor} onChange={v => update({ accentColor: v })} />
            <ColorField label="Button BG" value={config.buttonBg} onChange={v => update({ buttonBg: v })} />
            <ColorField label="Button Text" value={config.buttonText} onChange={v => update({ buttonText: v })} />
          </div>
        </Section>

        {/* Tiers */}
        <Section title="Tiers" icon={Layers} defaultOpen={true}>
          {config.tiers.map((t, i) => (
            <div key={t.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Tier {i + 1}</span>
                {config.tiers.length > 1 && (
                  <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={t.qty}
                    onChange={e => updateTier(i, { qty: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                  />
                </Field>
                <Field label="Discount %">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={t.discountPct}
                    onChange={e => updateTier(i, { discountPct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                  />
                </Field>
              </div>
              <Field label="Label">
                <input
                  type="text"
                  value={t.label}
                  onChange={e => updateTier(i, { label: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                />
              </Field>
              <Field label="Badge Text (optional)">
                <input
                  type="text"
                  value={t.badge}
                  onChange={e => updateTier(i, { badge: e.target.value })}
                  placeholder="e.g. Most Popular"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white placeholder:text-gray-300"
                />
              </Field>
            </div>
          ))}
          <button
            onClick={addTier}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Tier
          </button>
        </Section>

        {/* Guarantees */}
        <Section title="Guarantee Badges" icon={ShieldCheck} defaultOpen={false}>
          {config.guarantees.map((g, i) => (
            <div key={g.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Badge {i + 1}</span>
                <button onClick={() => removeGuarantee(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Field label="Title">
                <input
                  type="text"
                  value={g.title}
                  onChange={e => updateGuarantee(i, { title: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                />
              </Field>
              <Field label="Description">
                <input
                  type="text"
                  value={g.description}
                  onChange={e => updateGuarantee(i, { description: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                />
              </Field>
            </div>
          ))}
          <button
            onClick={addGuarantee}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Badge
          </button>
        </Section>

        {/* Embed code preview */}
        <div className="p-3 bg-gray-900 rounded-lg">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Embed Code</div>
          <pre className="text-[11px] text-green-400 whitespace-pre-wrap break-all font-mono leading-relaxed">
            {embedCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
