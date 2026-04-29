"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addBioPage, addBioItem, toggleBioPagePublished, deleteBioPage, deleteBioItem } from "./actions";

type Brand = { id: string; name: string };
type Page = { id: string; title: string; brand_id: string };

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

export function BioPageForm({ brands }: { brands: Brand[] }) {
  const f = useFormAction(addBioPage);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="New page" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="slug" required placeholder="url-slug (e.g. mybrand)" className="input col-span-1" />
          <input name="title" required placeholder="Page title" className="input col-span-2" />
          <textarea name="bio" placeholder="Bio / tagline" className="input col-span-2" rows={2} />
          <input name="bg_color" type="color" defaultValue="#ffffff" className="input col-span-1 h-9 px-2" title="Background color" />
          <input name="accent_color" type="color" defaultValue="#6366f1" className="input col-span-1 h-9 px-2" title="Accent color" />
          <select name="is_published" className="input col-span-2">
            <option value="false">Save as draft</option>
            <option value="true">Publish immediately</option>
          </select>
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

export function BioItemForm({ pages, brands }: { pages: Page[]; brands: Brand[] }) {
  const f = useFormAction(addBioItem);
  const [selectedPage, setSelectedPage] = useState(pages[0]?.id ?? "");
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add block" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select
            name="page_id"
            required
            className="input col-span-1"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
          >
            <option value="">— page —</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input name="brand_id" type="hidden" value={pages.find(p => p.id === selectedPage)?.brand_id ?? brands[0]?.id ?? ""} />
          <select name="type" required className="input col-span-1">
            <option value="link">Link</option>
            <option value="form">Capture form</option>
            <option value="text">Text block</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="divider">Divider</option>
          </select>
          <input name="label" required placeholder="Button label / heading" className="input col-span-2" />
          <input name="url" placeholder="URL (for links)" className="input col-span-2" />
          <input name="position" type="number" defaultValue={0} placeholder="Position (order)" className="input col-span-1" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Add block" />
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
      onClick={() => start(async () => { await toggleBioPagePublished(id, !is_published); })}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${is_published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
    >
      {pending ? "..." : is_published ? "Published" : "Draft"}
    </button>
  );
}

export function DeletePageButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Delete this page and all its blocks?")) return; start(async () => { await deleteBioPage(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}

export function DeleteItemButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Remove this block?")) return; start(async () => { await deleteBioItem(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}
