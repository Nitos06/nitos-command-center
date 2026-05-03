"use client";

import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";

interface Condition {
  field: string;
  op: string;
  value: any;
}

interface SegmentRules {
  operator: "AND" | "OR";
  conditions: Condition[];
}

const FIELD_OPTIONS = [
  { value: "total_orders", label: "Total Orders" },
  { value: "total_spent", label: "Total Spent ($)" },
  { value: "avg_order_value", label: "Avg Order Value ($)" },
  { value: "rfm_recency", label: "Days Since Last Order" },
  { value: "rfm_frequency", label: "Order Frequency (12mo)" },
  { value: "rfm_monetary", label: "Revenue (12mo)" },
  { value: "emails_opened", label: "Emails Opened" },
  { value: "emails_clicked", label: "Emails Clicked" },
  { value: "emails_sent", label: "Emails Sent" },
  { value: "subscribed", label: "Subscribed" },
  { value: "source", label: "Source" },
  { value: "created_at", label: "Signup Date" },
  { value: "last_order_at", label: "Last Order Date" },
  { value: "last_email_opened_at", label: "Last Email Opened" },
];

const OP_OPTIONS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "contains", label: "contains" },
  { value: "within_days", label: "within last N days" },
  { value: "before", label: "before date" },
  { value: "after", label: "after date" },
];

export function SegmentBuilder({
  brandId,
  initialRules,
  segmentName,
  onSave,
}: {
  brandId: string;
  initialRules?: SegmentRules;
  segmentName?: string;
  onSave?: (name: string, rules: SegmentRules) => void;
}) {
  const [name, setName] = useState(segmentName ?? "");
  const [operator, setOperator] = useState<"AND" | "OR">(initialRules?.operator ?? "AND");
  const [conditions, setConditions] = useState<Condition[]>(
    initialRules?.conditions ?? [{ field: "total_orders", op: "gte", value: 1 }]
  );
  const [saving, setSaving] = useState(false);

  function addCondition() {
    setConditions([...conditions, { field: "total_orders", op: "gte", value: 1 }]);
  }

  function removeCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  function updateCondition(index: number, updates: Partial<Condition>) {
    setConditions(conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  }

  async function handleSave() {
    if (!name.trim()) return alert("Segment name required");
    if (conditions.length === 0) return alert("Add at least one condition");

    setSaving(true);
    const rules: SegmentRules = { operator, conditions };

    if (onSave) {
      onSave(name, rules);
    } else {
      await fetch("/api/email/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, name, type: "dynamic", rules }),
      });
    }
    setSaving(false);
  }

  return (
    <div className="card p-5 space-y-4">
      {/* Segment name */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Segment Name</label>
        <input
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. VIP Customers"
        />
      </div>

      {/* Operator toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)]">Match</span>
        <button
          onClick={() => setOperator(operator === "AND" ? "OR" : "AND")}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            operator === "AND" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {operator === "AND" ? "ALL conditions" : "ANY condition"}
        </button>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        {conditions.map((condition, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              className="flex-1 px-2 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-white"
              value={condition.field}
              onChange={(e) => updateCondition(i, { field: e.target.value })}
            >
              {FIELD_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <select
              className="w-32 px-2 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-white"
              value={condition.op}
              onChange={(e) => updateCondition(i, { op: e.target.value })}
            >
              {OP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              className="w-24 px-2 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-white"
              value={condition.value}
              onChange={(e) => updateCondition(i, { value: e.target.value })}
              placeholder="Value"
            />
            <button onClick={() => removeCondition(i)} className="p-1 text-red-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={addCondition} className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add Condition
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save Segment"}
        </button>
      </div>
    </div>
  );
}
