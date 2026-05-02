"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Copy, Pause, Play, BarChart2, Package, Settings2,
  ChevronDown, Check, Search, ShoppingBag, Layers, X, Edit2, Tag,
  AlertCircle, ChevronUp, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface Props {
  brandId: string;
  bundles: any[];
  quantityBreaks: any[];
}

const TABS = ["Bundles", "Analytics"] as const;
type Tab = typeof TABS[number];

type BundleType = "fixed" | "fbt" | "volume" | "bogo";

/* ─── Badge ─────────────────────────────────────── */
function Badge({ label, color }: { label: string; color: "blue" | "purple" | "orange" | "green" | "gray" | "yellow" | "red" }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-600",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {label}
    </span>
  );
}

const TYPE_META: Record<BundleType, { label: string; color: "blue" | "purple" | "orange" | "green" }> = {
  fixed: { label: "Fixed", color: "blue" },
  fbt: { label: "FBT", color: "purple" },
  volume: { label: "Volume", color: "orange" },
  bogo: { label: "BOGO", color: "green" },
};

/* ─── Types ─────────────────────────────────────── */
interface Tier {
  qty: number;
  discount_pct: number;
  label: string;
  badge: string;
}

interface BundleFormState {
  name: string;
  bundle_type: BundleType;
  discount_pct: string;
  products: string[];
  productSearch: string;
  tiers: Tier[];
  widget_title: string;
  widget_subtitle: string;
  buy_qty: string;
  free_product_search: string;
}

const DEFAULT_FORM: BundleFormState = {
  name: "",
  bundle_type: "fixed",
  discount_pct: "",
  products: [],
  productSearch: "",
  tiers: [
    { qty: 2, discount_pct: 10, label: "Buy 2 Save 10%", badge: "" },
    { qty: 3, discount_pct: 15, label: "Buy 3 Save 15%", badge: "Most Popular" },
    { qty: 5, discount_pct: 20, label: "Buy 5 Save 20%", badge: "Best Value" },
  ],
  widget_title: "",
  widget_subtitle: "",
  buy_qty: "1",
  free_product_search: "",
};

/* ─── Bundle Form (shared by New + Edit) ────────── */
function BundleForm({
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
  submitLabel,
}: {
  form: BundleFormState;
  setForm: React.Dispatch<React.SetStateAction<BundleFormState>>;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const set = <K extends keyof BundleFormState>(key: K, val: BundleFormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const addProduct = () => {
    const trimmed = form.productSearch.trim();
    if (!trimmed || form.products.includes(trimmed)) return;
    set("products", [...form.products, trimmed]);
    set("productSearch", "");
  };

  const removeProduct = (p: string) =>
    set("products", form.products.filter(x => x !== p));

  const updateTier = (i: number, patch: Partial<Tier>) =>
    set("tiers", form.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const removeTier = (i: number) =>
    set("tiers", form.tiers.filter((_, j) => j !== i));

  const addTier = () =>
    set("tiers", [
      ...form.tiers,
      { qty: form.tiers.length + 2, discount_pct: 5, label: "", badge: "" },
    ]);

  return (
    <div className="p-6 space-y-5">
      {/* Name */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Bundle name *</label>
        <input
          value={form.name}
          onChange={e => set("name", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="e.g. Starter Kit"
        />
      </div>

      {/* Type selector */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Bundle type</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(TYPE_META) as BundleType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set("bundle_type", t)}
              className={`py-2 rounded-xl border text-xs font-semibold transition ${
                form.bundle_type === t
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              {TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed bundle fields */}
      {form.bundle_type === "fixed" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Products</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  value={form.productSearch}
                  onChange={e => set("productSearch", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addProduct()}
                  className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Type product name and press Enter or + Add"
                />
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
              >
                + Add
              </button>
            </div>
            {form.products.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.products.map(p => (
                  <span
                    key={p}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
                  >
                    {p}
                    <button type="button" onClick={() => removeProduct(p)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.discount_pct}
                onChange={e => set("discount_pct", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="15"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Widget title</label>
              <input
                value={form.widget_title}
                onChange={e => set("widget_title", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Bundle & Save"
              />
            </div>
          </div>
        </div>
      )}

      {/* FBT fields */}
      {form.bundle_type === "fbt" && (
        <div className="space-y-3">
          <button
            type="button"
            className="w-full py-2.5 border border-dashed border-purple-300 rounded-xl text-sm text-purple-600 hover:bg-purple-50 transition"
            onClick={() => {
              // TODO: call auto-detect API when available
              alert("Auto-detect from order history — API integration pending");
            }}
          >
            Auto-detect from order history
          </button>
          <div className="text-xs text-gray-400 text-center">— or add manually —</div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={form.productSearch}
                onChange={e => set("productSearch", e.target.value)}
                onKeyDown={e => e.key === "Enter" && addProduct()}
                className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search products…"
              />
            </div>
            <button
              type="button"
              onClick={addProduct}
              className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              + Add
            </button>
          </div>
          {form.products.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.products.map(p => (
                <span
                  key={p}
                  className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full"
                >
                  {p}
                  <button type="button" onClick={() => removeProduct(p)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.discount_pct}
              onChange={e => set("discount_pct", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="10"
            />
          </div>
        </div>
      )}

      {/* Volume tiers */}
      {form.bundle_type === "volume" && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500 block">Volume tiers</label>
          {form.tiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-[48px_64px_auto_64px_64px_28px] gap-2 items-center">
              <span className="text-xs text-gray-400 text-right">Qty</span>
              <input
                type="number"
                min={1}
                value={tier.qty}
                onChange={e => updateTier(i, { qty: +e.target.value })}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
              />
              <input
                value={tier.label}
                onChange={e => updateTier(i, { label: e.target.value })}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Label"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={tier.discount_pct}
                onChange={e => updateTier(i, { discount_pct: +e.target.value })}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
              />
              <span className="text-xs text-gray-400">% off</span>
              <button type="button" onClick={() => removeTier(i)} className="text-gray-300 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTier}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            + Add tier
          </button>
        </div>
      )}

      {/* BOGO fields */}
      {form.bundle_type === "bogo" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Buy quantity</label>
            <input
              type="number"
              min={1}
              value={form.buy_qty}
              onChange={e => set("buy_qty", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Free product</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={form.free_product_search}
                onChange={e => set("free_product_search", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search product…"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.discount_pct}
              onChange={e => set("discount_pct", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="100 (free) or partial"
            />
          </div>
        </div>
      )}

      {/* Widget copy */}
      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Widget title</label>
          <input
            value={form.widget_title}
            onChange={e => set("widget_title", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Frequently bought together"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Widget subtitle</label>
          <input
            value={form.widget_subtitle}
            onChange={e => set("widget_subtitle", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Save when you buy together"
          />
        </div>
      </div>

      {/* Inline preview */}
      <div className="border border-dashed border-gray-300 rounded-xl p-4">
        <div className="text-xs text-gray-400 mb-2">Widget preview</div>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <div className="text-sm font-semibold text-gray-800">
            {form.widget_title || "Your widget title"}
          </div>
          <div className="text-xs text-gray-500">
            {form.widget_subtitle || "Your widget subtitle"}
          </div>
          {form.products.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {form.products.map(p => (
                <span key={p} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                  {p}
                </span>
              ))}
            </div>
          )}
          {form.discount_pct && (
            <div className="text-xs font-semibold text-indigo-600 mt-1">
              {form.discount_pct}% off when bundled
            </div>
          )}
          {form.bundle_type === "volume" && form.tiers.length > 0 && (
            <div className="space-y-1 mt-2">
              {form.tiers.map((t, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-2 py-1 rounded border text-xs ${
                    i === 0 ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  <span>Buy {t.qty} — {t.label || `${t.discount_pct}% off`}</span>
                  {t.badge && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">{t.badge}</span>
                  )}
                  <span className="font-bold">{t.discount_pct}% off</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !form.name.trim()}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving…
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── New Bundle Modal ──────────────────────────── */
function NewBundleModal({
  brandId,
  onClose,
  onCreated,
}: {
  brandId: string;
  onClose: () => void;
  onCreated: (bundle: any) => void;
}) {
  const [form, setForm] = useState<BundleFormState>({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          name: form.name.trim(),
          bundle_type: form.bundle_type,
          discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
          products: form.products,
          tiers: form.bundle_type === "volume" ? form.tiers : [],
          widget_title: form.widget_title.trim(),
          widget_subtitle: form.widget_subtitle.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const newBundle = await res.json();
      onCreated(newBundle);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create bundle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Bundle</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <BundleForm
          form={form}
          setForm={setForm}
          onClose={onClose}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Create bundle"
        />
      </div>
    </div>
  );
}

/* ─── Edit Bundle Modal ─────────────────────────── */
function EditBundleModal({
  bundle,
  brandId,
  onClose,
  onUpdated,
}: {
  bundle: any;
  brandId: string;
  onClose: () => void;
  onUpdated: (bundle: any) => void;
}) {
  const [form, setForm] = useState<BundleFormState>({
    name: bundle.name ?? "",
    bundle_type: (bundle.bundle_type ?? bundle.type ?? "fixed") as BundleType,
    discount_pct: bundle.discount_pct != null ? String(bundle.discount_pct) : "",
    products: (bundle.bundle_items ?? []).map((i: any) => i.product_title ?? i.product_id ?? i),
    productSearch: "",
    tiers: bundle.tiers?.length
      ? bundle.tiers.map((t: any) => ({
          qty: t.qty ?? t.quantity ?? 2,
          discount_pct: t.discount_pct ?? t.pct ?? 10,
          label: t.label ?? "",
          badge: t.badge ?? "",
        }))
      : [...DEFAULT_FORM.tiers],
    widget_title: bundle.widget_title ?? "",
    widget_subtitle: bundle.widget_subtitle ?? "",
    buy_qty: String(bundle.buy_qty ?? 1),
    free_product_search: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bundles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          name: form.name.trim(),
          bundle_type: form.bundle_type,
          discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
          products: form.products,
          tiers: form.bundle_type === "volume" ? form.tiers : [],
          widget_title: form.widget_title.trim(),
          widget_subtitle: form.widget_subtitle.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      onUpdated(updated);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to update bundle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Edit Bundle</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <BundleForm
          form={form}
          setForm={setForm}
          onClose={onClose}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}

/* ─── Bundle Preview Card ───────────────────────── */
function BundleCard({
  bundle,
  isActive,
  onToggle,
  onEdit,
  onDelete,
}: {
  bundle: any;
  isActive: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const type = (bundle.bundle_type ?? bundle.type ?? "fixed") as BundleType;
  const typeMeta = TYPE_META[type] ?? { label: type, color: "gray" as const };
  const products: any[] = bundle.bundle_items ?? [];
  const revenue = Number(bundle.revenue_30d ?? 0);
  const orders = Number(bundle.orders_30d ?? 0);
  const discount = bundle.discount_pct;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-200 transition">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{bundle.name}</span>
            <Badge label={typeMeta.label} color={typeMeta.color} />
          </div>
          <div className="text-xs text-gray-500">
            {products.length > 0
              ? `${products.length} product${products.length !== 1 ? "s" : ""}`
              : "No products"}
            {discount != null && ` · ${discount}% off`}
          </div>
        </div>
        <div className="text-right text-xs shrink-0">
          <div className="font-semibold text-gray-900">${revenue.toLocaleString()}</div>
          <div className="text-gray-400">{orders} orders</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 ${
            isActive
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-50 text-gray-500"
          }`}
        >
          {isActive ? (
            <><Pause className="w-3 h-3 inline mr-1" />Active</>
          ) : (
            <><Play className="w-3 h-3 inline mr-1" />Paused</>
          )}
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-indigo-500 rounded hover:bg-indigo-50 transition"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview section */}
      {(products.length > 0 || bundle.widget_title) && (
        <div className="mx-4 mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
          {bundle.widget_title && (
            <div className="text-xs font-semibold text-gray-700 mb-1">{bundle.widget_title}</div>
          )}
          {bundle.widget_subtitle && (
            <div className="text-xs text-gray-500 mb-2">{bundle.widget_subtitle}</div>
          )}
          {products.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {products.slice(0, 4).map((p: any, i: number) => (
                <span key={i} className="text-[11px] bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                  {p.product_title ?? p.title ?? p}
                </span>
              ))}
              {products.length > 4 && (
                <span className="text-[11px] text-gray-400">+{products.length - 4} more</span>
              )}
            </div>
          )}
          {discount != null && (
            <div className="text-xs font-semibold text-indigo-600 mt-1.5">{discount}% off when bundled</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Bundles Tab ───────────────────────────────── */
function BundlesTab({ brandId, bundles: initialBundles }: { brandId: string; bundles: any[] }) {
  const [bundles, setBundles] = useState<any[]>(initialBundles);
  const [showNew, setShowNew] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const handleToggle = async (bundle: any) => {
    const id = bundle.id;
    if (toggling.has(id)) return;
    const newActive = !bundle.is_active;
    // Optimistic update
    setBundles(bs => bs.map(b => (b.id === id ? { ...b, is_active: newActive } : b)));
    setToggling(s => new Set(s).add(id));
    try {
      const res = await fetch("/api/bundles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId: id, is_active: newActive }),
      });
      if (!res.ok) {
        // Revert on failure
        setBundles(bs => bs.map(b => (b.id === id ? { ...b, is_active: !newActive } : b)));
      }
    } catch {
      setBundles(bs => bs.map(b => (b.id === id ? { ...b, is_active: !newActive } : b)));
    } finally {
      setToggling(s => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const handleDelete = async (bundle: any) => {
    const id = bundle.id;
    if (!confirm(`Delete "${bundle.name}"? This cannot be undone.`)) return;
    setDeleting(s => new Set(s).add(id));
    try {
      const res = await fetch("/api/bundles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId: id }),
      });
      if (res.ok) {
        setBundles(bs => bs.filter(b => b.id !== id));
      } else {
        alert("Failed to delete bundle. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(s => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  return (
    <div className="space-y-4">
      {showNew && (
        <NewBundleModal
          brandId={brandId}
          onClose={() => setShowNew(false)}
          onCreated={b => setBundles(bs => [b, ...bs])}
        />
      )}
      {editingBundle && (
        <EditBundleModal
          bundle={editingBundle}
          brandId={brandId}
          onClose={() => setEditingBundle(null)}
          onUpdated={updated =>
            setBundles(bs => bs.map(b => (b.id === updated.id ? updated : b)))
          }
        />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" /> New Bundle
        </button>
      </div>

      {bundles.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No bundles yet. Click "New Bundle" to create your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map(b => (
            <div key={b.id} className={deleting.has(b.id) ? "opacity-40 pointer-events-none" : ""}>
              <BundleCard
                bundle={b}
                isActive={!!b.is_active}
                onToggle={() => handleToggle(b)}
                onEdit={() => setEditingBundle(b)}
                onDelete={() => handleDelete(b)}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

/* ─── Analytics Tab ─────────────────────────────── */
function BundleAnalyticsTab({ bundles }: { bundles: any[] }) {
  const revenueByType = [
    { type: "Fixed", revenue: 4200, orders: 58 },
    { type: "FBT", revenue: 6800, orders: 92 },
    { type: "Volume", revenue: 3100, orders: 41 },
    { type: "BOGO", revenue: 2400, orders: 35 },
  ];

  const aovData = [
    { label: "Before bundles", aov: 48 },
    { label: "After bundles", aov: 67 },
  ];

  const topBundles = bundles.slice(0, 5).map(b => ({
    name: b.name,
    revenue: Number(b.revenue_30d ?? 0),
    orders: Number(b.orders_30d ?? 0),
    type: ((b.bundle_type ?? b.type ?? "fixed") as BundleType),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Revenue by bundle type (30d)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByType}>
              <XAxis dataKey="type" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {revenueByType.map((_, i) => (
                  <Cell key={i} fill={["#6366f1", "#8b5cf6", "#f97316", "#10b981"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">AOV impact</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={aovData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`$${v}`, "AOV"]} />
              <Bar dataKey="aov" radius={[6, 6, 0, 0]}>
                <Cell fill="#e5e7eb" />
                <Cell fill="#6366f1" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-green-600 font-semibold mt-1">
            +$19 AOV lift (+40%)
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Top 5 bundles (30d)</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Bundle</th>
              <th className="text-left pb-2 font-medium">Type</th>
              <th className="text-right pb-2 font-medium">Orders</th>
              <th className="text-right pb-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topBundles.length > 0 ? (
              topBundles.map((b, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 text-gray-800">{b.name}</td>
                  <td className="py-2">
                    <Badge
                      label={TYPE_META[b.type]?.label ?? b.type}
                      color={TYPE_META[b.type]?.color ?? "gray"}
                    />
                  </td>
                  <td className="py-2 text-right text-gray-600">{b.orders}</td>
                  <td className="py-2 text-right font-semibold text-indigo-600">
                    ${b.revenue.toFixed(0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400 text-xs">
                  No data yet — create bundles to see analytics
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Volume Bundle Editor ──────────────────────── */
interface VolumeTier {
  qty: number;
  pct: number;
  label: string;
  badge: string;
}

interface GuaranteeItem {
  title: string;
  desc: string;
}

interface VolumeCfg {
  unitPrice: number;
  title: string;
  subtitle: string;
  ctaText: string;
  bgColor: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
  tiers: VolumeTier[];
  guarantees: GuaranteeItem[];
}

function CollapseSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

function VolumeBundleEditor({ brandId }: { brandId: string }) {
  const [cfg, setCfg] = useState<VolumeCfg>({
    unitPrice: 49,
    title: 'Choose Your Bundle',
    subtitle: 'Save more when you buy more',
    ctaText: 'Add to Cart',
    bgColor: '#f7f5f2',
    accentColor: '#2c2c2c',
    buttonBg: '#2c2c2c',
    buttonText: '#ffffff',
    tiers: [
      { qty: 1, pct: 0, label: '1 Unit', badge: '' },
      { qty: 2, pct: 10, label: '2 Units', badge: 'Most Popular' },
      { qty: 3, pct: 20, label: '3 Units', badge: 'Best Value' },
    ],
    guarantees: [
      { title: '30-Day Guarantee', desc: 'Not happy? Full refund, no questions asked.' },
      { title: 'Free Shipping', desc: 'On all orders over $75. Delivered fast.' },
      { title: 'Premium Quality', desc: 'Every batch tested and certified.' },
      { title: 'Fast Support', desc: 'Real humans. Reply within 24 hours.' },
    ],
  });

  const [selectedTier, setSelectedTier] = useState(1);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const linkId = 'barlow-font';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  const set = <K extends keyof VolumeCfg>(key: K, val: VolumeCfg[K]) => setCfg(c => ({ ...c, [key]: val }));

  const updateTier = (i: number, patch: Partial<VolumeTier>) =>
    set('tiers', cfg.tiers.map((t, j) => j === i ? { ...t, ...patch } : t));

  const removeTier = (i: number) => {
    set('tiers', cfg.tiers.filter((_, j) => j !== i));
    if (selectedTier >= i && selectedTier > 0) setSelectedTier(s => s - 1);
  };

  const addTier = () => set('tiers', [...cfg.tiers, { qty: cfg.tiers.length + 1, pct: 5, label: `${cfg.tiers.length + 1} Units`, badge: '' }]);

  const updateGuarantee = (i: number, patch: Partial<GuaranteeItem>) =>
    set('guarantees', cfg.guarantees.map((g, j) => j === i ? { ...g, ...patch } : g));

  const removeGuarantee = (i: number) => set('guarantees', cfg.guarantees.filter((_, j) => j !== i));

  const addGuarantee = () => set('guarantees', [...cfg.guarantees, { title: 'New Guarantee', desc: 'Description here.' }]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/bundles/brand-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, volumeConfig: cfg }),
      });
    } catch {}
    setSaving(false);
  };

  const embedSnippet = `<div id="volume-bundle-widget" data-brand="${brandId}"></div>\n<script src="/widgets/volume-bundle.js"></script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTierSafe = cfg.tiers[selectedTier] ?? cfg.tiers[0];
  const totalPrice = currentTierSafe ? cfg.unitPrice * currentTierSafe.qty * (1 - currentTierSafe.pct / 100) : 0;
  const perUnit = currentTierSafe ? cfg.unitPrice * (1 - currentTierSafe.pct / 100) : 0;
  const savings = currentTierSafe ? cfg.unitPrice * currentTierSafe.qty * currentTierSafe.pct / 100 : 0;

  return (
    <div className="flex gap-6 items-start">
      {/* Left: Live widget preview */}
      <div className="flex-1">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-xs font-semibold uppercase text-gray-400 mb-4">Live Preview</div>
          <div style={{ background: cfg.bgColor, borderRadius: 16, padding: 24, maxWidth: 460, fontFamily: "'Barlow Condensed', sans-serif" }}>
            <h2 style={{ fontWeight: 700, fontSize: 22, textAlign: 'center', marginBottom: 4, color: '#111' }}>{cfg.title}</h2>
            <p style={{ color: '#888', textAlign: 'center', fontSize: 14, marginBottom: 16 }}>{cfg.subtitle}</p>

            {/* Tier selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {cfg.tiers.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTier(i)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 12,
                    border: selectedTier === i ? `2px solid ${cfg.accentColor}` : '2px solid #e0e0e0',
                    background: selectedTier === i ? cfg.accentColor : '#fff',
                    color: selectedTier === i ? cfg.buttonText : '#333',
                    fontFamily: 'inherit', cursor: 'pointer', position: 'relative',
                  }}
                >
                  {t.badge && (
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#ff6b35', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {t.badge}
                    </span>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: selectedTier === i ? 'rgba(255,255,255,0.8)' : '#888' }}>
                    {t.pct > 0 ? `${t.pct}% off` : 'Regular price'}
                  </div>
                </button>
              ))}
            </div>

            {/* Price panel */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#888' }}>Total Price</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>${totalPrice.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    ${perUnit.toFixed(2)} per unit
                    {(currentTierSafe?.pct ?? 0) > 0 && ` · You save $${savings.toFixed(2)}`}
                  </div>
                </div>
                {(currentTierSafe?.pct ?? 0) > 0 && (
                  <div style={{ background: '#e8f5e9', color: '#2dc653', fontWeight: 700, borderRadius: 8, padding: '4px 10px', fontSize: 14 }}>
                    {currentTierSafe.pct}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* CTA button */}
            <button style={{ width: '100%', padding: 14, borderRadius: 12, background: cfg.buttonBg, color: cfg.buttonText, fontFamily: 'inherit', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 16 }}>
              {cfg.ctaText} — ${totalPrice.toFixed(2)}
            </button>

            {/* Guarantees */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {cfg.guarantees.map((g, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{g.title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Settings panel */}
      <div className="w-[320px] bg-white rounded-xl border border-gray-200 p-5 space-y-4 h-fit sticky top-4">
        <div className="text-sm font-semibold text-gray-700">Widget Settings</div>

        <CollapseSection title="General">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Unit price ($)</label>
            <input type="number" step={0.01} min={0} value={cfg.unitPrice} onChange={e => set('unitPrice', Number(e.target.value))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input value={cfg.title} onChange={e => set('title', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subtitle</label>
            <input value={cfg.subtitle} onChange={e => set('subtitle', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">CTA text</label>
            <input value={cfg.ctaText} onChange={e => set('ctaText', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </CollapseSection>

        <CollapseSection title="Colors">
          {([
            { key: 'bgColor', label: 'Background' },
            { key: 'accentColor', label: 'Accent / Selected tier' },
            { key: 'buttonBg', label: 'Button background' },
            { key: 'buttonText', label: 'Button text' },
          ] as { key: keyof VolumeCfg; label: string }[]).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-xs text-gray-500 flex-1">{label}</label>
              <input type="color" value={cfg[key] as string} onChange={e => set(key, e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
              <span className="text-xs font-mono text-gray-500 w-16">{cfg[key] as string}</span>
            </div>
          ))}
        </CollapseSection>

        <CollapseSection title="Tiers">
          <div className="space-y-3">
            {cfg.tiers.map((t, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Tier {i + 1}</span>
                  <button onClick={() => removeTier(i)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Qty</label>
                    <input type="number" min={1} value={t.qty} onChange={e => updateTier(i, { qty: Number(e.target.value) })} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Discount %</label>
                    <input type="number" min={0} max={100} value={t.pct} onChange={e => updateTier(i, { pct: Number(e.target.value) })} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">Label</label>
                  <input value={t.label} onChange={e => updateTier(i, { label: e.target.value })} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-0.5 block">Badge (optional)</label>
                  <input value={t.badge} onChange={e => updateTier(i, { badge: e.target.value })} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Most Popular" />
                </div>
              </div>
            ))}
            <button onClick={addTier} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add Tier</button>
          </div>
        </CollapseSection>

        <CollapseSection title="Guarantees">
          <div className="space-y-2">
            {cfg.guarantees.map((g, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-1">
                <div className="flex items-center gap-1">
                  <input value={g.title} onChange={e => updateGuarantee(i, { title: e.target.value })} className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Title" />
                  <button onClick={() => removeGuarantee(i)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                </div>
                <input value={g.desc} onChange={e => updateGuarantee(i, { desc: e.target.value })} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Description" />
              </div>
            ))}
            <button onClick={addGuarantee} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add Guarantee</button>
          </div>
        </CollapseSection>

        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
            {saving ? 'Saving…' : 'Save to Brand'}
          </button>
          <button onClick={handleCopyEmbed} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Embed'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Root Component ────────────────────────────── */
export default function BundlesClient({ brandId, bundles, quantityBreaks }: Props) {
  const [tab, setTab] = useState<Tab>("Bundles");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Bundles" && <BundlesTab brandId={brandId} bundles={bundles} />}
      {tab === "Analytics" && <BundleAnalyticsTab bundles={bundles} />}
    </div>
  );
}
