"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addSequence, addSequenceStep, toggleSequence, deleteSequence, deleteSequenceStep } from "./actions";

type Brand = { id: string; name: string };
type Sequence = { id: string; name: string; brand_id: string };

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

export function SequenceForm({ brands }: { brands: Brand[] }) {
  const f = useFormAction(addSequence);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="New sequence" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="name" required placeholder="Sequence name (e.g. Welcome Series)" className="input col-span-1" />
          <input name="mailjet_list_id" placeholder="Mailjet contact list ID" className="input col-span-1" />
          <select name="trigger_source" className="input col-span-1">
            <option value="">— triggered from —</option>
            <option value="lead_magnet">Lead magnet</option>
            <option value="landing_page">Landing page</option>
            <option value="link_in_bio">Link in bio</option>
            <option value="auto_dm">Auto DM</option>
            <option value="manual">Manual enroll</option>
          </select>
          <select name="is_active" className="input col-span-2">
            <option value="true">Active</option>
            <option value="false">Paused</option>
          </select>
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Create sequence" />
          </div>
        </form>
      )}
    </div>
  );
}

export function StepForm({ sequences, brands }: { sequences: Sequence[]; brands: Brand[] }) {
  const f = useFormAction(addSequenceStep);
  const [selectedSeq, setSelectedSeq] = useState(sequences[0]?.id ?? "");
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add email step" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select
            name="sequence_id"
            required
            className="input col-span-1"
            value={selectedSeq}
            onChange={(e) => setSelectedSeq(e.target.value)}
          >
            <option value="">— sequence —</option>
            {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input name="brand_id" type="hidden" value={sequences.find(s => s.id === selectedSeq)?.brand_id ?? brands[0]?.id ?? ""} />
          <input name="position" type="number" defaultValue={1} placeholder="Step # (order)" className="input col-span-1" />
          <input name="delay_days" type="number" defaultValue={0} placeholder="Delay (days after previous)" className="input col-span-1" />
          <input name="subject" required placeholder="Email subject line" className="input col-span-1" />
          <input name="preview_text" placeholder="Preview text (shown in inbox)" className="input col-span-2" />
          <textarea name="html_body" placeholder="HTML email body (or leave blank to use Mailjet template)" className="input col-span-2 font-mono text-xs" rows={5} />
          <textarea name="text_body" placeholder="Plain text fallback" className="input col-span-2" rows={3} />
          <input name="mailjet_template_id" placeholder="Mailjet template ID (optional)" className="input col-span-2" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Add email step" />
          </div>
        </form>
      )}
    </div>
  );
}

export function SequenceToggle({ id, is_active }: { id: string; is_active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await toggleSequence(id, !is_active); })}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
    >
      {pending ? "..." : is_active ? "Active" : "Paused"}
    </button>
  );
}

export function DeleteSequenceButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Delete this sequence and all its steps?")) return; start(async () => { await deleteSequence(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}

export function DeleteStepButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => { if (!confirm("Remove this email step?")) return; start(async () => { await deleteSequenceStep(id); }); }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}
