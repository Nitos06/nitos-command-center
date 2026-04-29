"use client";

import { useState } from "react";
import { createSegment, deleteSegment } from "./actions";
import { Plus, Trash2, Upload } from "lucide-react";

type Segment = {
  id: string;
  name: string;
  description: string | null;
  customer_count: number | null;
  meta_audience_id: string | null;
  filter_json: Record<string, unknown>;
  last_synced_at: string | null;
};

export function SegmentsPanel({
  segments,
  brands,
}: {
  segments: Segment[];
  brands: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ratingMin, setRatingMin] = useState(5);
  const [ratingMax, setRatingMax] = useState(5);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    await createSegment({
      name,
      filter_json: { rating_min: ratingMin, rating_max: ratingMax, verified_only: verifiedOnly },
    });
    setName("");
    setOpen(false);
    setSubmitting(false);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-ink text-sm">Segments</h3>
        <button
          onClick={() => setOpen(!open)}
          className="btn-primary text-xs px-2.5 py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {open && (
        <div className="mb-3 p-3 rounded-xl bg-surface-tint border border-surface-border space-y-3">
          <div>
            <label className="label">Segment name</label>
            <input
              className="input text-sm"
              placeholder="e.g. 5-star reviewers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Min rating</label>
              <select
                className="input text-sm"
                value={ratingMin}
                onChange={(e) => setRatingMin(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{"★".repeat(v)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Max rating</label>
              <select
                className="input text-sm"
                value={ratingMax}
                onChange={(e) => setRatingMax(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{"★".repeat(v)}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded"
            />
            Verified purchases only
          </label>
          <div className="flex gap-2">
            <button
              className="btn-primary text-xs px-3 py-1.5"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save segment"}
            </button>
            <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {segments.length === 0 ? (
        <p className="text-xs text-ink-muted">No segments yet. Create one to export to Meta Lookalikes.</p>
      ) : (
        <div className="space-y-2">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-surface-border text-sm"
            >
              <div className="min-w-0">
                <div className="font-semibold text-ink text-xs truncate">{seg.name}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {seg.customer_count ?? 0} customers
                  {seg.meta_audience_id && (
                    <span className="badge-success ml-1.5">Synced to Meta</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="btn text-[11px] px-2 py-1 bg-primary-50 text-primary-600 hover:bg-primary-100"
                  title="Export to Meta Lookalike"
                >
                  <Upload className="w-3 h-3" />
                  Meta
                </button>
                <button
                  className="btn-ghost p-1.5"
                  onClick={() => deleteSegment(seg.id)}
                  title="Delete segment"
                >
                  <Trash2 className="w-3.5 h-3.5 text-status-crit" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
