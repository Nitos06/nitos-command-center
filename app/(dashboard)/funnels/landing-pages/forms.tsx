"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2, Code } from "lucide-react";
import { addLandingPage, updateLandingPageStatus, updateLandingPageHtml, deleteLandingPage } from "./actions";

type Brand = { id: string; name: string };

function Toggle({ open, setOpen, label }: { open: boolean; setOpen: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => setOpen(!open)} className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700">
      {open ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
      {open ? "Cancel" : label}
    </button>
  );
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm flex items-center gap-2">
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {label}
    </button>
  );
}

function useFormAction<T extends (fd: FormData) => Promise<{ ok?: boolean; error?: string }>>(action: T) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await action(fd);
      if (res?.error) setErr(res.error);
      else { form.reset(); setOpen(false); }
    });
  };
  return { pending, err, open, setOpen, submit };
}

export function LandingPageForm({ brands }: { brands: Brand[] }) {
  const f = useFormAction(addLandingPage);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="New page" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="slug" required placeholder="url-slug (e.g. summer-sale)" className="input col-span-1" />
          <input name="title" required placeholder="Page title" className="input col-span-2" />
          <input name="meta_description" placeholder="Meta description (SEO)" className="input col-span-2" />
          <select name="status" className="input col-span-1">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <div className="col-span-1 flex items-center text-xs text-ink-muted">
            HTML content can be added after creation via the editor
          </div>
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Create page" />
          </div>
        </form>
      )}
    </div>
  );
}

export function HtmlEditor({ id, currentHtml }: { id: string; currentHtml: string | null }) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState(currentHtml ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    start(async () => {
      const res = await updateLandingPageHtml(id, html);
      if (res?.error) setErr(res.error);
      else setOpen(false);
    });
  };

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700">
        <Code className="size-3.5" />
        {open ? "Close editor" : "Edit HTML"}
      </button>
      {open && (
        <div className="mt-2">
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="input w-full font-mono text-xs"
            rows={12}
            placeholder="Paste full HTML here (from Claude Preview or any editor)"
          />
          <div className="flex items-center justify-between mt-2">
            {err && <span className="text-xs text-red-600">{err}</span>}
            <span />
            <button onClick={save} disabled={pending} className="btn-primary text-sm flex items-center gap-2">
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              Save HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusToggle({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const next = status === "published" ? "draft" : "published";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await updateLandingPageStatus(id, next); })}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${
        status === "published" ? "bg-green-100 text-green-700 hover:bg-green-200" :
        status === "archived" ? "bg-gray-100 text-gray-400" :
        "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      }`}
    >
      {pending ? "..." : status}
    </button>
  );
}

export function DeleteLandingPageButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Delete this landing page?")) return; start(async () => { await deleteLandingPage(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}
