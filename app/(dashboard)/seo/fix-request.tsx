"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, Wrench } from "lucide-react";

export function FixRequestPanel({ brandId }: { brandId: string | null }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ url: "", issue: "", priority: "medium" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) return;
    setSending(true);
    try {
      const res = await fetch("/api/seo/fix-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brandId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      setForm({ url: "", issue: "", priority: "medium" });
      setTimeout(() => { setDone(false); setOpen(false); }, 3000);
    } catch (err: any) {
      alert(err.message ?? "Failed to queue fix request");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 btn-outline text-xs px-3 py-1.5"
      >
        <Wrench className="w-3 h-3" />
        Request manual fix
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2.5 p-4 rounded-xl border border-surface-border bg-surface-tint/30">
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Page URL (optional)</label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://yourstore.myshopify.com/products/…"
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Describe the issue / what to fix</label>
            <textarea
              required
              rows={3}
              value={form.issue}
              onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
              placeholder="e.g. Missing H1 on collection page. Add schema markup to product page. Fix meta description on blog post X."
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={sending || !brandId} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : done ? <CheckCircle2 className="w-3 h-3" /> : <Send className="w-3 h-3" />}
              {done ? "Queued!" : sending ? "Sending…" : "Queue for SEO agent"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-muted hover:text-ink px-2">cancel</button>
          </div>
          {!brandId && <p className="text-xs text-amber-500">Select a brand first.</p>}
        </form>
      )}
    </div>
  );
}

export function ApplyFixButton({ fixIndex, brandId, fixTitle }: { fixIndex: number; brandId: string | null; fixTitle: string }) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function apply() {
    if (!brandId) return;
    setSending(true);
    try {
      const res = await fetch("/api/seo/fix-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, issue: `Apply fix: ${fixTitle}`, priority: "high", fixIndex }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  if (done) return <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Queued</span>;

  return (
    <button
      onClick={apply}
      disabled={sending || !brandId}
      className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-0.5 disabled:opacity-40 transition-colors"
    >
      {sending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wrench className="w-2.5 h-2.5" />}
      {sending ? "…" : "Fix"}
    </button>
  );
}
