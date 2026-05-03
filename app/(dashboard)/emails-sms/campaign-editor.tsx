"use client";

import { useState, useEffect } from "react";
import { Send, Save, Eye, Calendar, Users, FileText } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  subscriber_count?: number;
}

export function CampaignEditor({ brandId, onClose }: { brandId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mjmlSource, setMjmlSource] = useState(DEFAULT_MJML);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/email/segments?brandId=${brandId}`)
      .then((r) => r.json())
      .then((d) => setSegments(d.segments ?? d.data ?? []));
  }, [brandId]);

  async function compileMjml() {
    const res = await fetch("/api/email/mjml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mjml: mjmlSource }),
    });
    if (res.ok) {
      const data = await res.json();
      setPreview(data.html);
    }
  }

  async function saveCampaign() {
    if (!name || !subject) return alert("Name and subject required");
    setSaving(true);

    const res = await fetch("/api/email/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        name,
        subject,
        preview_text: previewText,
        segment_id: segmentId || null,
        scheduled_for: scheduledAt || null,
        mjml_source: mjmlSource,
      }),
    });

    if (res.ok) {
      onClose();
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">New Campaign</h3>
        <button onClick={onClose} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Settings */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Campaign Name</label>
            <input className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Sale 2026" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Subject Line</label>
            <input className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. 30% off everything this weekend!" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Preview Text</label>
            <input className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Shows after subject in inbox" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Segment</label>
            <select className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg" value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
              <option value="">All subscribers</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.subscriber_count ?? 0})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Schedule</label>
            <input type="datetime-local" className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button onClick={saveCampaign} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Campaign"}
            </button>
            <button onClick={compileMjml} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface-tint)]">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>

        {/* Right: MJML Editor */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] block">MJML Source</label>
          <textarea
            className="w-full h-80 px-3 py-2 text-xs font-mono border border-[var(--border)] rounded-lg bg-gray-50 resize-none"
            value={mjmlSource}
            onChange={(e) => setMjmlSource(e.target.value)}
          />
          {preview && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-gray-50 border-b border-[var(--border)] text-xs font-medium text-[var(--text-secondary)]">
                Preview
              </div>
              <iframe srcDoc={preview} className="w-full h-64 bg-white" sandbox="" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_MJML = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="14px" color="#374151" line-height="1.6" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f9fafb">
    <mj-section background-color="#6366f1" padding="32px 40px">
      <mj-column>
        <mj-text color="#ffffff" font-size="24px" font-weight="bold" align="center">
          Your Headline Here
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="32px 40px">
      <mj-column>
        <mj-text>
          Hi {{contact.firstname}},
        </mj-text>
        <mj-text>
          Your email content goes here. Edit this MJML to customize the design.
        </mj-text>
        <mj-button background-color="#6366f1" href="{{shop.url}}">
          Shop Now
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
