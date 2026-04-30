"use client";

import { useState } from "react";
import {
  Plus, Trash2, Copy, Pause, Play, BarChart2, Package, Settings2,
  ChevronDown, Check, Search, ShoppingBag, Layers, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

interface Props {
  brandId: string;
  bundles: any[];
  quantityBreaks: any[];
}

const TABS = ["Bundles", "Quantity Breaks", "Cart Upsells", "Analytics"] as const;
type Tab = typeof TABS[number];

type BundleType = "fixed" | "fbt" | "volume" | "bogo";

function Badge({ label, color }: { label: string; color: "blue" | "purple" | "orange" | "green" | "gray" | "yellow" }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-600",
    yellow: "bg-amber-100 text-amber-700",
  };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>{label}</span>;
}

const TYPE_META: Record<BundleType, { label: string; color: "blue" | "purple" | "orange" | "green" }> = {
  fixed: { label: "Fixed", color: "blue" },
  fbt: { label: "FBT", color: "purple" },
  volume: { label: "Volume", color: "orange" },
  bogo: { label: "BOGO", color: "green" },
};

/* ─── New Bundle Modal ──────────────────────────── */
function NewBundleModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<BundleType>("fixed");
  const [tiers, setTiers] = useState([
    { qty: 2, pct: 10, label: "Buy 2 Save 10%" },
    { qty: 3, pct: 15, label: "Buy 3 Save 15%" },
    { qty: 5, pct: 20, label: "Buy 5 Save 20%" },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Bundle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bundle name</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. Starter Kit" />
          </div>

          {/* Type selector */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Bundle type</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TYPE_META) as BundleType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition ${type === t ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}
                >
                  {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific config */}
          {type === "fixed" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Products</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Search by name or SKU…" />
                  </div>
                  <button className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600">+ Add</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Discount type</label>
                  <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option>Percentage off</option>
                    <option>Fixed amount off</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Discount value</label>
                  <input type="number" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="15" />
                </div>
              </div>
            </div>
          )}

          {type === "fbt" && (
            <div className="space-y-3">
              <button className="w-full py-2.5 border border-dashed border-purple-300 rounded-xl text-sm text-purple-600 hover:bg-purple-50 transition">
                Auto-detect from order history
              </button>
              <div className="text-xs text-gray-400 text-center">— or add manually —</div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Search products…" />
                </div>
                <button className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600">+ Add</button>
              </div>
            </div>
          )}

          {type === "volume" && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 block">Volume tiers</label>
              {tiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-shrink-0 text-xs text-gray-500 w-8">Qty</div>
                  <input type="number" value={tier.qty} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, qty: +e.target.value } : t))} className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center" />
                  <div className="flex-shrink-0 text-xs text-gray-500">→</div>
                  <input type="number" value={tier.pct} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, pct: +e.target.value } : t))} className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center" />
                  <div className="flex-shrink-0 text-xs text-gray-500">% off</div>
                  <input value={tier.label} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, label: e.target.value } : t))} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Label" />
                  <button onClick={() => setTiers(ts => ts.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setTiers(ts => [...ts, { qty: ts.length + 2, pct: 5, label: "" }])} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add tier</button>
            </div>
          )}

          {type === "bogo" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Buy quantity</label>
                <input type="number" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" defaultValue={1} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Free product</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Search product…" />
                </div>
              </div>
            </div>
          )}

          {/* Widget copy */}
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Widget title</label>
              <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Frequently bought together" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Widget subtitle</label>
              <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Save when you buy together" />
            </div>
          </div>

          {/* Preview placeholder */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center text-xs text-gray-400">
            Widget preview renders here after save
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">Create bundle</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bundles Tab ───────────────────────────────── */
function BundlesTab({ bundles }: { bundles: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(bundles.map(b => [b.id, b.is_active]))
  );

  return (
    <div className="space-y-4">
      {showModal && <NewBundleModal onClose={() => setShowModal(false)} />}
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> New Bundle
        </button>
      </div>

      {bundles.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No bundles yet.</div>
      ) : (
        <div className="space-y-3">
          {bundles.map(b => {
            const typeMeta = TYPE_META[(b.type as BundleType) ?? "fixed"];
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{b.name}</span>
                      <Badge label={typeMeta.label} color={typeMeta.color} />
                    </div>
                    <div className="text-xs text-gray-500">{b.bundle_items?.length ?? 0} products · {b.discount_pct ? `${b.discount_pct}% off` : "—"}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold text-gray-900">${Number(b.revenue_30d ?? 0).toLocaleString()}</div>
                    <div className="text-gray-400">{b.orders_30d ?? 0} orders</div>
                  </div>
                  <button
                    onClick={() => setActive(a => ({ ...a, [b.id]: !a[b.id] }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${active[b.id] ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                  >
                    {active[b.id] ? <><Pause className="w-3 h-3 inline mr-1" />Active</> : <><Play className="w-3 h-3 inline mr-1" />Paused</>}
                  </button>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-500 rounded hover:bg-indigo-50 transition" title="Edit"><Settings2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition" title="Duplicate"><Copy className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Quantity Breaks Tab ───────────────────────── */
function QtyBreaksTab({ quantityBreaks }: { quantityBreaks: any[] }) {
  const [adding, setAdding] = useState(false);
  const defaultTiers = [
    { qty: 2, pct: 10, label: "Buy 2 Save 10%", badge: "" },
    { qty: 3, pct: 15, label: "Buy 3 Save 15%", badge: "Most Popular" },
    { qty: 5, pct: 20, label: "Buy 5 Save 20%", badge: "Best Value" },
  ];
  const [tiers, setTiers] = useState(defaultTiers);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Add Quantity Break
        </button>
      </div>

      {(quantityBreaks.length === 0 && !adding) ? (
        <div className="text-center py-12 text-gray-400 text-sm">No quantity breaks yet.</div>
      ) : (
        <>
          <div className="space-y-2">
            {quantityBreaks.map((qb, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="flex-1 font-medium text-sm text-gray-900">{qb.product_title ?? "Product"}</div>
                <div className="text-xs text-gray-500">{qb.tiers_count ?? 3} tiers</div>
                <Badge label={qb.is_active ? "Active" : "Inactive"} color={qb.is_active ? "green" : "gray"} />
                <div className="text-xs text-gray-500">{qb.revenue_impact ? `+$${qb.revenue_impact}` : "—"}</div>
              </div>
            ))}
          </div>

          {adding && (
            <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">Configure Quantity Break</span>
                <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Select product</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Search Shopify products…" />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">Tiers</div>
                <div className="space-y-2">
                  {tiers.map((tier, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center">
                      <input type="number" value={tier.qty} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, qty: +e.target.value } : t))} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center" placeholder="Qty" />
                      <input type="number" value={tier.pct} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, pct: +e.target.value } : t))} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center" placeholder="% off" />
                      <input value={tier.label} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, label: e.target.value } : t))} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Label" />
                      <input value={tier.badge} onChange={e => setTiers(ts => ts.map((t, j) => j === i ? { ...t, badge: e.target.value } : t))} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Badge (optional)" />
                    </div>
                  ))}
                  <button onClick={() => setTiers(ts => [...ts, { qty: ts.length + 2, pct: 5, label: "", badge: "" }])} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add tier</button>
                </div>
              </div>

              {/* Widget preview */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-2">Widget preview</div>
                <div className="space-y-1.5">
                  {tiers.map((tier, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${i === 0 ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                      <div className="text-sm font-medium text-gray-800">Buy {tier.qty} — {tier.label}</div>
                      {tier.badge && <span className="text-[11px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">{tier.badge}</span>}
                      <div className="text-sm font-bold text-indigo-700">{tier.pct}% off</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setAdding(false)} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">Save Quantity Break</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Cart Upsells Tab ──────────────────────────── */
function CartUpsellsTab({ brandId }: { brandId: string }) {
  const [enabled, setEnabled] = useState(true);
  const [freeShipThreshold, setFreeShipThreshold] = useState("75");
  const [freeGiftThreshold, setFreeGiftThreshold] = useState("100");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/bundles/cart-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, enabled, freeShipThreshold, freeGiftThreshold, primaryColor }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm">Cart Drawer Config</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="peer sr-only" />
          <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
        </label>
      </div>

      {[
        { label: "Free shipping threshold ($)", value: freeShipThreshold, set: setFreeShipThreshold },
        { label: "Free gift threshold ($)", value: freeGiftThreshold, set: setFreeGiftThreshold },
      ].map(f => (
        <div key={f.label}>
          <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
          <input type="number" value={f.value} onChange={e => f.set(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
      ))}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Free shipping progress message</label>
        <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" defaultValue="You're {{remaining}} away from free shipping!" />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Free gift product (Shopify product ID)</label>
        <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="gid://shopify/Product/…" />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Upsell product IDs (up to 5, comma-separated)</label>
        <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="id1, id2, id3" />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Upsell widget title</label>
        <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" defaultValue="You might also like" />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Urgency message</label>
        <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Only 3 left in stock!" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Enable order note field</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" defaultChecked className="peer sr-only" />
          <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500">Primary color</label>
        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-8 rounded border border-gray-200 cursor-pointer" />
        <span className="text-xs font-mono text-gray-600">{primaryColor}</span>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
        {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? "Saving…" : "Save config"}
      </button>
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

  const topBundles = bundles.slice(0, 5).map(b => ({
    name: b.name,
    revenue: Number(b.revenue_30d ?? Math.random() * 3000),
    orders: Number(b.orders_30d ?? Math.floor(Math.random() * 50)),
    type: (b.type ?? "fixed") as BundleType,
  }));

  const aovData = [
    { label: "Before bundles", aov: 48 },
    { label: "After bundles", aov: 67 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Revenue by bundle type (30d)</div>
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
          <div className="text-center text-xs text-green-600 font-semibold mt-1">+$19 AOV lift (+40%)</div>
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
            {topBundles.map((b, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 text-gray-800">{b.name}</td>
                <td className="py-2"><Badge label={TYPE_META[b.type]?.label ?? b.type} color={TYPE_META[b.type]?.color ?? "gray"} /></td>
                <td className="py-2 text-right text-gray-600">{b.orders}</td>
                <td className="py-2 text-right font-semibold text-indigo-600">${b.revenue.toFixed(0)}</td>
              </tr>
            ))}
            {topBundles.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-xs">No data yet</td></tr>
            )}
          </tbody>
        </table>
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
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Bundles" && <BundlesTab bundles={bundles} />}
      {tab === "Quantity Breaks" && <QtyBreaksTab quantityBreaks={quantityBreaks} />}
      {tab === "Cart Upsells" && <CartUpsellsTab brandId={brandId} />}
      {tab === "Analytics" && <BundleAnalyticsTab bundles={bundles} />}
    </div>
  );
}
