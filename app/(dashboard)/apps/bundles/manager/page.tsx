"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, Package, Layers, Repeat, Gift, Tag,
  ToggleLeft, ToggleRight, Pencil, Trash2, X, ChevronDown,
  DollarSign, ShoppingCart, BarChart3, Check, Loader2,
  Copy, Eye,
} from "lucide-react";

/* ─── types ─── */
type BundleType = "fixed" | "fbt" | "volume" | "bogo";

interface VolumeTier {
  qty: number;
  discountPct: number;
  label: string;
}

interface BogoConfig {
  buyQty: number;
  getQty: number;
  getDiscountPct: number;
}

interface Bundle {
  id: string;
  name: string;
  type: BundleType;
  active: boolean;
  discountPct: number;
  products: string[];
  volumeTiers: VolumeTier[];
  bogoConfig: BogoConfig;
  widgetTitle: string;
  widgetSubtitle: string;
  revenue30d: number;
  orders30d: number;
  created_at: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TYPE_META: Record<BundleType, { label: string; color: string; icon: any }> = {
  fixed: { label: "Fixed", color: "bg-blue-100 text-blue-700", icon: Package },
  fbt: { label: "FBT", color: "bg-purple-100 text-purple-700", icon: Layers },
  volume: { label: "Volume", color: "bg-amber-100 text-amber-700", icon: BarChart3 },
  bogo: { label: "BOGO", color: "bg-green-100 text-green-700", icon: Gift },
};

const EMPTY_BUNDLE: Omit<Bundle, "id" | "created_at"> = {
  name: "",
  type: "fixed",
  active: true,
  discountPct: 10,
  products: [],
  volumeTiers: [
    { qty: 1, discountPct: 0, label: "1 Unit" },
    { qty: 2, discountPct: 10, label: "2 Units" },
    { qty: 3, discountPct: 20, label: "3 Units" },
  ],
  bogoConfig: { buyQty: 2, getQty: 1, getDiscountPct: 100 },
  widgetTitle: "Bundle & Save",
  widgetSubtitle: "Add these items together and save",
  revenue30d: 0,
  orders30d: 0,
};

/* ─── sample data ─── */
const SAMPLE_BUNDLES: Bundle[] = [
  {
    id: uid(), name: "Summer Essentials Pack", type: "fixed", active: true, discountPct: 15,
    products: ["Sunscreen SPF50", "Beach Towel", "Flip Flops"], volumeTiers: [], bogoConfig: { buyQty: 2, getQty: 1, getDiscountPct: 100 },
    widgetTitle: "Summer Bundle", widgetSubtitle: "Everything you need for summer",
    revenue30d: 4520, orders30d: 89, created_at: "2025-04-01",
  },
  {
    id: uid(), name: "Skincare Routine", type: "fbt", active: true, discountPct: 10,
    products: ["Cleanser", "Toner", "Moisturizer", "Serum"], volumeTiers: [], bogoConfig: { buyQty: 2, getQty: 1, getDiscountPct: 100 },
    widgetTitle: "Complete Your Routine", widgetSubtitle: "Frequently bought together",
    revenue30d: 8340, orders30d: 167, created_at: "2025-03-15",
  },
  {
    id: uid(), name: "Protein Powder Volume", type: "volume", active: false, discountPct: 0,
    products: ["Whey Protein 2lb"],
    volumeTiers: [
      { qty: 1, discountPct: 0, label: "1 Tub" },
      { qty: 2, discountPct: 10, label: "2 Tubs" },
      { qty: 3, discountPct: 20, label: "3 Tubs" },
    ],
    bogoConfig: { buyQty: 2, getQty: 1, getDiscountPct: 100 },
    widgetTitle: "Buy More Save More", widgetSubtitle: "Stock up and save",
    revenue30d: 6120, orders30d: 102, created_at: "2025-02-20",
  },
  {
    id: uid(), name: "Buy 2 Get 1 Free Socks", type: "bogo", active: true, discountPct: 0,
    products: ["Athletic Socks"],
    volumeTiers: [],
    bogoConfig: { buyQty: 2, getQty: 1, getDiscountPct: 100 },
    widgetTitle: "Buy 2 Get 1 Free!", widgetSubtitle: "Stock up on your favorites",
    revenue30d: 2180, orders30d: 145, created_at: "2025-04-10",
  },
];

/* ─── product search mock ─── */
const ALL_PRODUCTS = [
  "Sunscreen SPF50", "Beach Towel", "Flip Flops", "Cleanser", "Toner",
  "Moisturizer", "Serum", "Whey Protein 2lb", "Athletic Socks", "Running Shoes",
  "Yoga Mat", "Water Bottle", "Backpack", "Headphones", "Phone Case",
];

function ProductSearch({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = ALL_PRODUCTS.filter(p => !selected.includes(p) && p.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-white min-h-[40px]">
        {selected.map(p => (
          <span key={p} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
            {p}
            <button onClick={() => onChange(selected.filter(s => s !== p))} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products..."
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
        />
      </div>
      {open && q && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
          {results.slice(0, 8).map(p => (
            <button
              key={p}
              onClick={() => { onChange([...selected, p]); setQ(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Mini inline preview ─── */
function MiniPreview({ bundle }: { bundle: Omit<Bundle, "id" | "created_at"> }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="text-center mb-2">
        <div className="text-sm font-bold text-gray-800">{bundle.widgetTitle || "Bundle Title"}</div>
        <div className="text-[10px] text-gray-500">{bundle.widgetSubtitle || "Subtitle"}</div>
      </div>
      {bundle.type === "fixed" && (
        <div className="flex flex-wrap gap-1 justify-center">
          {bundle.products.map(p => (
            <span key={p} className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded">{p}</span>
          ))}
          {bundle.products.length > 0 && (
            <div className="w-full text-center mt-1">
              <span className="text-[10px] font-bold text-green-600">{bundle.discountPct}% OFF Bundle</span>
            </div>
          )}
        </div>
      )}
      {bundle.type === "fbt" && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {bundle.products.slice(0, 3).map((p, i) => (
            <span key={p}>
              <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded">{p}</span>
              {i < Math.min(bundle.products.length, 3) - 1 && <span className="text-gray-400 text-xs mx-0.5">+</span>}
            </span>
          ))}
          <div className="w-full text-center mt-1">
            <span className="text-[10px] font-bold text-purple-600">Save {bundle.discountPct}% together</span>
          </div>
        </div>
      )}
      {bundle.type === "volume" && (
        <div className="space-y-1">
          {bundle.volumeTiers.map(t => (
            <div key={t.qty} className="flex justify-between text-[10px] px-2 py-1 bg-white rounded border border-gray-200">
              <span>{t.label}</span>
              <span className="font-bold text-amber-600">{t.discountPct > 0 ? `${t.discountPct}% OFF` : "Full Price"}</span>
            </div>
          ))}
        </div>
      )}
      {bundle.type === "bogo" && (
        <div className="text-center">
          <div className="text-xs font-bold text-green-600">
            Buy {bundle.bogoConfig.buyQty} Get {bundle.bogoConfig.getQty}
            {bundle.bogoConfig.getDiscountPct === 100 ? " FREE" : ` at ${bundle.bogoConfig.getDiscountPct}% OFF`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Modal ─── */
function BundleModal({
  bundle,
  onSave,
  onClose,
}: {
  bundle: Omit<Bundle, "id" | "created_at"> | (Bundle);
  onSave: (b: Omit<Bundle, "id" | "created_at">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Bundle, "id" | "created_at">>({
    name: bundle.name,
    type: bundle.type,
    active: bundle.active,
    discountPct: bundle.discountPct,
    products: [...bundle.products],
    volumeTiers: bundle.volumeTiers.map(t => ({ ...t })),
    bogoConfig: { ...bundle.bogoConfig },
    widgetTitle: bundle.widgetTitle,
    widgetSubtitle: bundle.widgetSubtitle,
    revenue30d: bundle.revenue30d,
    orders30d: bundle.orders30d,
  });

  const patch = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {"id" in bundle ? "Edit Bundle" : "New Bundle"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase">Bundle Name</span>
            <input
              type="text"
              value={form.name}
              onChange={e => patch({ name: e.target.value })}
              placeholder="e.g. Summer Essentials Pack"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </label>

          {/* Type selector */}
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Bundle Type</span>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {(["fixed", "fbt", "volume", "bogo"] as BundleType[]).map(t => {
                const meta = TYPE_META[t];
                const Icon = meta.icon;
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => patch({ type: t })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                      active ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                    <span className={`text-xs font-semibold ${active ? "text-indigo-700" : "text-gray-500"}`}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products */}
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Products</span>
            <div className="mt-1">
              <ProductSearch selected={form.products} onChange={v => patch({ products: v })} />
            </div>
          </div>

          {/* Fixed / FBT discount */}
          {(form.type === "fixed" || form.type === "fbt") && (
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Discount %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discountPct}
                onChange={e => patch({ discountPct: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </label>
          )}

          {/* Volume tiers */}
          {form.type === "volume" && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Volume Tiers</span>
              <div className="mt-1 space-y-2">
                {form.volumeTiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={t.qty}
                      onChange={e => {
                        const tiers = [...form.volumeTiers];
                        tiers[i] = { ...tiers[i], qty: parseInt(e.target.value) || 1 };
                        patch({ volumeTiers: tiers });
                      }}
                      className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded"
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={t.label}
                      onChange={e => {
                        const tiers = [...form.volumeTiers];
                        tiers[i] = { ...tiers[i], label: e.target.value };
                        patch({ volumeTiers: tiers });
                      }}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded"
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={t.discountPct}
                      onChange={e => {
                        const tiers = [...form.volumeTiers];
                        tiers[i] = { ...tiers[i], discountPct: parseFloat(e.target.value) || 0 };
                        patch({ volumeTiers: tiers });
                      }}
                      className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded"
                      placeholder="% OFF"
                    />
                    <button
                      onClick={() => patch({ volumeTiers: form.volumeTiers.filter((_, j) => j !== i) })}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => patch({
                    volumeTiers: [...form.volumeTiers, { qty: form.volumeTiers.length + 1, discountPct: (form.volumeTiers.length + 1) * 10, label: `${form.volumeTiers.length + 1} Units` }],
                  })}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Tier
                </button>
              </div>
            </div>
          )}

          {/* BOGO config */}
          {form.type === "bogo" && (
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 uppercase">Buy Qty</span>
                <input
                  type="number"
                  min="1"
                  value={form.bogoConfig.buyQty}
                  onChange={e => patch({ bogoConfig: { ...form.bogoConfig, buyQty: parseInt(e.target.value) || 1 } })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 uppercase">Get Qty</span>
                <input
                  type="number"
                  min="1"
                  value={form.bogoConfig.getQty}
                  onChange={e => patch({ bogoConfig: { ...form.bogoConfig, getQty: parseInt(e.target.value) || 1 } })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 uppercase">Get Discount %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.bogoConfig.getDiscountPct}
                  onChange={e => patch({ bogoConfig: { ...form.bogoConfig, getDiscountPct: parseFloat(e.target.value) || 0 } })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </label>
            </div>
          )}

          {/* Widget title / subtitle */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Widget Title</span>
              <input
                type="text"
                value={form.widgetTitle}
                onChange={e => patch({ widgetTitle: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase">Widget Subtitle</span>
              <input
                type="text"
                value={form.widgetSubtitle}
                onChange={e => patch({ widgetSubtitle: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </label>
          </div>

          {/* Inline preview */}
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase mb-1 block">Preview</span>
            <MiniPreview bundle={form} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
          >
            {"id" in bundle ? "Update Bundle" : "Create Bundle"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function BundleManagerPage() {
  const [bundles, setBundles] = useState<Bundle[]>(SAMPLE_BUNDLES);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<BundleType | "all">("all");
  const [modal, setModal] = useState<{ mode: "new" } | { mode: "edit"; bundle: Bundle } | null>(null);

  const filtered = useMemo(() =>
    bundles.filter(b => {
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      return true;
    }),
    [bundles, search, typeFilter]
  );

  const toggleActive = (id: string) => {
    setBundles(bs => bs.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const deleteBundle = (id: string) => {
    setBundles(bs => bs.filter(b => b.id !== id));
  };

  const handleSave = (form: Omit<Bundle, "id" | "created_at">) => {
    if (modal?.mode === "edit") {
      setBundles(bs => bs.map(b => b.id === modal.bundle.id ? { ...b, ...form } : b));
    } else {
      setBundles(bs => [...bs, { ...form, id: uid(), created_at: new Date().toISOString() } as Bundle]);
    }
    setModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bundle Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage all bundle types</p>
        </div>
        <button
          onClick={() => setModal({ mode: "new" })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" /> New Bundle
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bundles..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "fixed", "fbt", "volume", "bogo"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                typeFilter === t ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t === "all" ? "All" : TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Bundle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(b => {
          const meta = TYPE_META[b.type];
          const Icon = meta.icon;
          return (
            <div
              key={b.id}
              className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{b.name}</div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(b.id)}
                  className="flex items-center gap-1.5"
                  title={b.active ? "Pause bundle" : "Activate bundle"}
                >
                  {b.active
                    ? <ToggleRight className="w-7 h-7 text-green-500" />
                    : <ToggleLeft className="w-7 h-7 text-gray-300" />
                  }
                  <span className={`text-[10px] font-semibold ${b.active ? "text-green-600" : "text-gray-400"}`}>
                    {b.active ? "Active" : "Paused"}
                  </span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">Products</div>
                  <div className="text-sm font-bold text-gray-700">{b.products.length}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">30d Revenue</div>
                  <div className="text-sm font-bold text-gray-700">${b.revenue30d.toLocaleString()}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 uppercase">30d Orders</div>
                  <div className="text-sm font-bold text-gray-700">{b.orders30d}</div>
                </div>
              </div>

              {/* Discount info */}
              <div className="text-xs text-gray-500 mb-3">
                {b.type === "fixed" && <span>Fixed bundle discount: <strong>{b.discountPct}%</strong></span>}
                {b.type === "fbt" && <span>FBT discount: <strong>{b.discountPct}%</strong></span>}
                {b.type === "volume" && <span>{b.volumeTiers.length} volume tiers (up to <strong>{Math.max(...b.volumeTiers.map(t => t.discountPct))}% OFF</strong>)</span>}
                {b.type === "bogo" && (
                  <span>
                    Buy {b.bogoConfig.buyQty} Get {b.bogoConfig.getQty}
                    {b.bogoConfig.getDiscountPct === 100 ? " Free" : ` at ${b.bogoConfig.getDiscountPct}% OFF`}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setModal({ mode: "edit", bundle: b })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => deleteBundle(b.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="text-sm font-medium">No bundles found</div>
          <div className="text-xs mt-1">Create your first bundle to get started</div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <BundleModal
          bundle={modal.mode === "edit" ? modal.bundle : EMPTY_BUNDLE as any}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
