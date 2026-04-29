"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addLeadMagnet, toggleLeadMagnetPublished, deleteLeadMagnet } from "./actions";

type Brand = { id: string; name: string };
type Sequence = { id: string; name: string };

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

export function LeadMagnetForm({ brands, sequences }: { brands: Brand[]; sequences: Sequence[] }) {
  const f = useFormAction(addLeadMagnet);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="New lead magnet" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="title" required placeholder="Title (e.g. 10 Growth Hacks PDF)" className="input col-span-1" />
          <textarea name="description" placeholder="Short description shown before the form" className="input col-span-2" rows={2} />
          <input name="file_url" placeholder="File URL (Supabase storage / Drive link)" className="input col-span-2" />
          <input name="cover_image_url" placeholder="Cover image URL (optional)" className="input col-span-1" />
          <input name="thank_you_url" placeholder="Thank-you redirect URL" className="input col-span-1" />
          <select name="sequence_id" className="input col-span-1">
            <option value="">— email sequence (optional) —</option>
            {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="is_published" className="input col-span-1">
            <option value="false">Save as draft</option>
            <option value="true">Publish immediately</option>
          </select>
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Create lead magnet" />
          </div>
        </form>
      )}
    </div>
  );
}

export function PublishToggle({ id, is_published }: { id: string; is_published: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await toggleLeadMagnetPublished(id, !is_published); })}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${is_published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
    >
      {pending ? "..." : is_published ? "Published" : "Draft"}
    </button>
  );
}

export function DeleteLeadMagnetButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Delete this lead magnet?")) return; start(async () => { await deleteLeadMagnet(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}
