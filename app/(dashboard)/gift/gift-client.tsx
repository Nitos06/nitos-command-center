"use client";

import { useState } from "react";
import { Gift, Plus, Trash2, ToggleLeft, ToggleRight, ShoppingCart, Package, ChevronDown, Check } from "lucide-react";

interface GiftRule {
  id?: string;
  brand_id: string;
  product_title: string;
  product_id: string;
  variant_id: string;
  product_image?: string;
  threshold: number;
  is_active: boolean;
  label: string;
}

interface Props {
  brandId: string;
  giftRules: GiftRule[];
}

export default function GiftClient({ brandId, giftRules: initial }: Props) {
  const [rules, setRules] = useState<GiftRule[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_title: "",
    product_id: "",
    variant_id: "",
    threshold: 75,
    label: "🎁 You've earned a free gift!",
    is_active: true,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/gift/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, ...form }),
      });
      const data = await res.json();
      if (data.rule) {
        setRules(r => [data.rule, ...r]);
        setShowForm(false);
        setForm({ product_title: "", product_id: "", variant_id: "", threshold: 75, label: "🎁 You've earned a free gift!", is_active: true });
      }
    } catch {}
    setSaving(false);
  }

  async function toggleRule(id: string, is_active: boolean) {
    setRules(r => r.map(rule => rule.id === id ? { ...rule, is_active } : rule));
    await fetch("/api/gift/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    });
  }

  async function deleteRule(id: string) {
    setRules(r => r.filter(rule => rule.id !== id));
    await fetch("/api/gift/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Free Gift</h1>
          <p className="text-xs text-ink-muted mt-1">Auto-add a gift product to cart when order reaches a threshold.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Gift Rule
        </button>
      </div>

      {/* How Free Gift Bar works */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎁</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">How Free Gift Bar works</div>
            <div className="text-xs text-gray-500">Configure in app → connect to design → live on store</div>
          </div>
          <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Full pipeline</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">① Configure</div>
            <div className="text-xs text-gray-700">Add a gift rule here — set the cart threshold (e.g. $75), name the gift product, and toggle it active. You can have multiple rules at different thresholds.</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">② Connect</div>
            <div className="text-xs text-gray-700">Copy the two code blocks from the embed panel at the bottom. Block 1 goes on your cart page (shows the progress bar). Block 2 goes in global scripts (runs on every page to track cart changes).</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">③ Live</div>
            <div className="text-xs text-gray-700">Shoppers see an animated progress bar on the cart page: &quot;Add $X more to get a free [gift]&quot;. When the threshold is hit the bar turns green. The bar updates in real-time as products are added or removed.</div>
          </div>
        </div>
        <div className="bg-white/80 rounded-xl p-3 border border-gray-100">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">🤖 What the agent does automatically</div>
          <div className="text-xs text-gray-600">Monitors gift rule impact on Average Order Value weekly. If AOV increases significantly after activating a rule, it suggests lowering the threshold to unlock more conversions. If there&apos;s no impact, it recommends changing the gift product.</div>
        </div>
      </div>

      {/* Add rule form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-800">New Gift Rule</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Gift Product Title</label>
              <input
                value={form.product_title}
                onChange={e => set("product_title", e.target.value)}
                placeholder="e.g. Free Tote Bag"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Shopify Product ID</label>
              <input
                value={form.product_id}
                onChange={e => set("product_id", e.target.value)}
                placeholder="gid://shopify/Product/..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Variant ID</label>
              <input
                value={form.variant_id}
                onChange={e => set("variant_id", e.target.value)}
                placeholder="gid://shopify/ProductVariant/..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Order threshold ($)</label>
              <input
                type="number"
                value={form.threshold}
                onChange={e => set("threshold", +e.target.value)}
                min={0}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-[10px] text-gray-400 mt-1">Gift added when cart subtotal ≥ ${form.threshold}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cart message</label>
              <input
                value={form.label}
                onChange={e => set("label", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Preview */}
          {form.product_title && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-green-800">{form.label}</div>
                <div className="text-[11px] text-green-600">{form.product_title} — added free when cart ≥ ${form.threshold}</div>
              </div>
              <Check className="w-4 h-4 text-green-500 ml-auto shrink-0" />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.product_title || !form.variant_id}
              className="flex-1 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Rule"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-xs text-gray-500 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <Gift className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <div className="text-sm font-medium text-gray-500">No gift rules yet</div>
          <div className="text-xs text-gray-400 mt-1">Click &quot;Add Gift Rule&quot; to set up your first free gift offer.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{rule.product_title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Free when cart ≥ <strong>${rule.threshold}</strong> · {rule.label}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => rule.id && toggleRule(rule.id, !rule.is_active)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    rule.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {rule.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {rule.is_active ? "Active" : "Paused"}
                </button>
                <button
                  onClick={() => rule.id && deleteRule(rule.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embed panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-800">📋 Add Gift Bar to Your Store</span>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Page Builder Ready</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Add these two code blocks in your page builder — first on your cart page, second on every page (global scripts section):</p>
        <div className="text-xs font-medium text-gray-600 mb-1">1. Cart page — gift progress bar:</div>
        <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre mb-3">{`<div id="gift-bar" data-brand-id="${brandId}"></div>\n<script src="https://nitaiecompro-nine.vercel.app/widgets/gift.js"></script>`}</div>
        <div className="text-xs font-medium text-gray-600 mb-1">2. Global scripts (every page) — for cart total tracking:</div>
        <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre">{`<script src="https://nitaiecompro-nine.vercel.app/widgets/gift.js" data-brand-id="${brandId}"></script>`}</div>
      </div>
    </div>
  );
}
