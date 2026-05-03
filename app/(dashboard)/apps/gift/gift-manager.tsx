"use client";

import { useState, useCallback } from "react";
import {
  Plus, Trash2, Edit3, Save, X, Gift, ShoppingCart,
  ToggleLeft, ToggleRight, Eye, ChevronDown, ChevronRight,
} from "lucide-react";

/* ─── types ─── */
export interface GiftRule {
  id: string;
  brand_id: string;
  product_title: string;
  product_id: string;
  variant_id: string;
  product_image: string;
  threshold: number;
  is_active: boolean;
  label: string;
  widget_config: Record<string, any> | null;
}

interface Props {
  brandId: string;
  giftRules: GiftRule[];
}

const emptyForm = {
  product_title: "",
  product_id: "",
  variant_id: "",
  product_image: "",
  threshold: 50,
  is_active: true,
  label: "Free Gift",
};

/* ─── component ─── */
export default function GiftManager({ brandId, giftRules: initial }: Props) {
  const [rules, setRules] = useState<GiftRule[]>(initial);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewCartTotal, setPreviewCartTotal] = useState(30);
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  /* ─── CRUD helpers ─── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body = { ...form, brand_id: brandId };
      if (editingId) {
        const res = await fetch("/api/apps/gift/rules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...body }),
        });
        const updated = await res.json();
        setRules((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, ...updated } : r))
        );
      } else {
        const res = await fetch("/api/apps/gift/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const created = await res.json();
        setRules((prev) => [created, ...prev]);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  }, [form, editingId, brandId]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this gift rule?")) return;
    await fetch("/api/apps/gift/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggle = useCallback(async (rule: GiftRule) => {
    const newState = !rule.is_active;
    await fetch("/api/apps/gift/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, is_active: newState }),
    });
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: newState } : r))
    );
  }, []);

  const startEdit = (rule: GiftRule) => {
    setForm({
      product_title: rule.product_title,
      product_id: rule.product_id,
      variant_id: rule.variant_id,
      product_image: rule.product_image,
      threshold: rule.threshold,
      is_active: rule.is_active,
      label: rule.label,
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  /* ─── preview helpers ─── */
  const getProgressPercent = (threshold: number) =>
    Math.min(100, (previewCartTotal / threshold) * 100);

  const getRemainingAmount = (threshold: number) =>
    Math.max(0, threshold - previewCartTotal);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-600" />
            Free Gift Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create gift rules to automatically add free products when customers hit a cart threshold
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Gift Rule
        </button>
      </div>

      {/* ─── Add / Edit Form ─── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Gift Rule" : "New Gift Rule"}
            </h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                value={form.product_title}
                onChange={(e) => setForm({ ...form, product_title: e.target.value })}
                placeholder="e.g., Free Sample Pack"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Product ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product ID
              </label>
              <input
                type="text"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                placeholder="e.g., gid://shopify/Product/12345"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Variant ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant ID
              </label>
              <input
                type="text"
                value={form.variant_id}
                onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
                placeholder="e.g., gid://shopify/ProductVariant/12345"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image URL
              </label>
              <input
                type="text"
                value={form.product_image}
                onChange={(e) => setForm({ ...form, product_image: e.target.value })}
                placeholder="https://cdn.shopify.com/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cart Threshold ($)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.threshold}
                onChange={(e) =>
                  setForm({ ...form, threshold: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label Text
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g., Free Gift"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className="flex items-center gap-2 text-sm"
            >
              {form.is_active ? (
                <ToggleRight className="w-6 h-6 text-green-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
              <span className={form.is_active ? "text-green-700 font-medium" : "text-gray-500"}>
                {form.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.product_title || !form.threshold}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Update Rule" : "Create Rule"}
            </button>
            <button
              onClick={cancelForm}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Rules List ─── */}
      {rules.length === 0 && !showForm ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No gift rules yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Create your first gift rule to reward customers with free products
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => {
            const remaining = getRemainingAmount(rule.threshold);
            const pct = getProgressPercent(rule.threshold);
            const isExpanded = expandedPreview === rule.id;

            return (
              <div
                key={rule.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  rule.is_active ? "border-gray-200" : "border-gray-100 opacity-70"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {rule.product_image ? (
                      <img
                        src={rule.product_image}
                        alt={rule.product_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {rule.product_title}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          rule.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      <ShoppingCart className="w-3.5 h-3.5 inline mr-1" />
                      Spend <span className="font-semibold text-purple-600">${rule.threshold.toFixed(2)}</span> to get a free gift
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Label: {rule.label} &middot; Product: {rule.product_id || "N/A"} &middot; Variant: {rule.variant_id || "N/A"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedPreview(isExpanded ? null : rule.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(rule)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={rule.is_active ? "Deactivate" : "Activate"}
                    >
                      {rule.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(rule)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable Preview */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Customer Cart Preview
                    </h4>

                    {/* Simulated cart total input */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500">Simulated cart total: $</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={previewCartTotal}
                        onChange={(e) => setPreviewCartTotal(parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>

                    {/* Cart Message */}
                    <div className="bg-white rounded-lg border border-purple-200 p-4">
                      {remaining > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-purple-500" />
                            <p className="text-sm font-medium text-gray-800">
                              Spend <span className="text-purple-600 font-bold">${remaining.toFixed(2)}</span> more to get a FREE{" "}
                              <span className="font-bold">{rule.product_title}</span>!
                            </p>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-purple-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 text-right">
                            ${previewCartTotal.toFixed(2)} / ${rule.threshold.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-700">
                              You unlocked a FREE {rule.product_title}!
                            </p>
                            <p className="text-xs text-green-600">
                              Your gift has been added to the cart automatically.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
