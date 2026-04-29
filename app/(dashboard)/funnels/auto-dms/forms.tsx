"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addDmTrigger, toggleDmTrigger, deleteDmTrigger } from "./actions";

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

export function DmTriggerForm({ brands, sequences }: { brands: Brand[]; sequences: Sequence[] }) {
  const f = useFormAction(addDmTrigger);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="New trigger" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="name" required placeholder="Trigger name (e.g. Free Guide Comment)" className="input col-span-1" />
          <select name="platform" className="input col-span-1">
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
          <select name="trigger_type" required className="input col-span-1">
            <option value="comment_keyword">Comment keyword</option>
            <option value="story_reply">Story reply</option>
            <option value="reel_comment">Reel comment</option>
            <option value="post_mention">Post mention</option>
            <option value="dm_keyword">DM keyword</option>
          </select>
          <input name="keywords" placeholder="Keywords (comma-separated, e.g. guide,free,info)" className="input col-span-2" />
          <input name="target_post_id" placeholder="Target post/reel ID (leave blank for all)" className="input col-span-2" />
          <textarea name="reply_message" required placeholder="DM message to send (supports {first_name})" className="input col-span-2" rows={3} />
          <select name="sequence_id" className="input col-span-1">
            <option value="">— add to email sequence (optional) —</option>
            {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="is_active" className="input col-span-1">
            <option value="true">Active</option>
            <option value="false">Paused</option>
          </select>
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Create trigger" />
          </div>
        </form>
      )}
    </div>
  );
}

export function ActiveToggle({ id, is_active }: { id: string; is_active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await toggleDmTrigger(id, !is_active); })}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
    >
      {pending ? "..." : is_active ? "Active" : "Paused"}
    </button>
  );
}

export function DeleteTriggerButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Delete this DM trigger?")) return; start(async () => { await deleteDmTrigger(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}
