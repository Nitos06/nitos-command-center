"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import {
  addBrand,
  addSubscription,
  addConnection,
  addNiche,
  addBenchmark,
  upsertTaxEntity,
  upsertBrandSettings,
  deleteRow,
} from "./actions";

type Brand = { id: string; name: string };

function Toggle({ open, setOpen, label }: { open: boolean; setOpen: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700"
    >
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
      else {
        form.reset();
        setOpen(false);
      }
    });
  };
  return { pending, err, open, setOpen, submit };
}

export function BrandForm() {
  const f = useFormAction(addBrand);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add brand" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <input name="slug" required placeholder="slug (e.g. mybrand)" className="input col-span-1" />
          <input name="name" required placeholder="Brand name" className="input col-span-1" />
          <input name="domain" placeholder="example.com" className="input col-span-1" />
          <input name="niche" placeholder="niche (e.g. skincare)" className="input col-span-1" />
          <input name="country" placeholder="IL" defaultValue="IL" className="input col-span-1" />
          <input name="base_currency" placeholder="ILS" defaultValue="ILS" className="input col-span-1" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save brand" />
          </div>
        </form>
      )}
    </div>
  );
}

export function SubscriptionForm() {
  const f = useFormAction(addSubscription);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add subscription" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <input name="app_name" required placeholder="App name (e.g. Klaviyo)" className="input col-span-1" />
          <input name="category" placeholder="category (email/design/ai/...)" className="input col-span-1" />
          <input name="monthly_cost_usd" type="number" step="0.01" placeholder="USD/mo" className="input col-span-1" />
          <input name="monthly_cost_ils" type="number" step="0.01" placeholder="ILS/mo" className="input col-span-1" />
          <input name="billing_day" type="number" min="1" max="31" placeholder="billing day (1-31)" className="input col-span-1" />
          <input name="notes" placeholder="notes" className="input col-span-1" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save subscription" />
          </div>
        </form>
      )}
    </div>
  );
}

export function ConnectionForm({ brands }: { brands: Brand[] }) {
  const f = useFormAction(addConnection);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add connection" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="platform" required placeholder="platform (meta_ads, shopify, klaviyo...)" className="input col-span-1" />
          <input name="account_ref" placeholder="account ID / ref" className="input col-span-1" />
          <input name="notes" placeholder="notes" className="input col-span-1" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save connection" />
          </div>
        </form>
      )}
    </div>
  );
}

export function NicheForm({ brands }: { brands: Brand[] }) {
  const f = useFormAction(addNiche);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add niche" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="name" required placeholder="Niche name" className="input col-span-1" />
          <input name="tone_of_voice" placeholder="tone of voice" className="input col-span-2" />
          <textarea name="description" placeholder="description" className="input col-span-2" rows={2} />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save niche" />
          </div>
        </form>
      )}
    </div>
  );
}

export function BenchmarkForm({ brands }: { brands: Brand[] }) {
  const f = useFormAction(addBenchmark);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label="Add benchmark" />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" className="input col-span-1">
            <option value="">— brand (optional) —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input name="metric" required placeholder="metric (e.g. roas_target)" className="input col-span-1" />
          <input name="target" type="number" step="0.0001" placeholder="target" className="input col-span-1" />
          <input name="baseline" type="number" step="0.0001" placeholder="baseline" className="input col-span-1" />
          <input name="unit" placeholder="unit (x, %, ILS)" className="input col-span-1" />
          <input name="context" placeholder="context" className="input col-span-1" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save benchmark" />
          </div>
        </form>
      )}
    </div>
  );
}

export function TaxEntityForm({ brands, current }: { brands: Brand[]; current: any | null }) {
  const f = useFormAction(upsertTaxEntity);
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label={current ? "Edit tax entity" : "Set tax entity"} />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <select name="brand_id" required defaultValue={current?.brand_id ?? ""} className="input col-span-1">
            <option value="">— brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select name="entity_type" defaultValue={current?.entity_type ?? "osek_murshe"} className="input col-span-1">
            <option value="osek_patur">Osek Patur</option>
            <option value="osek_murshe">Osek Murshe</option>
            <option value="chevra_baam">Chevra Ba'am</option>
          </select>
          <input name="legal_name" defaultValue={current?.legal_name ?? ""} placeholder="Legal name" className="input col-span-1" />
          <input name="vat_number" defaultValue={current?.vat_number ?? ""} placeholder="VAT number" className="input col-span-1" />
          <input name="company_id" defaultValue={current?.company_id ?? ""} placeholder="Company ID / ת.ז." className="input col-span-1" />
          <select name="vat_frequency" defaultValue={current?.vat_frequency ?? "bimonthly"} className="input col-span-1">
            <option value="monthly">Monthly</option>
            <option value="bimonthly">Bi-monthly</option>
          </select>
          <input name="bituach_leumi_file_no" defaultValue={current?.bituach_leumi_file_no ?? ""} placeholder="Bituach Leumi file #" className="input col-span-2" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save tax entity" />
          </div>
        </form>
      )}
    </div>
  );
}

export function BrandSettingsForm({ brandId, current }: { brandId: string; current: any | null }) {
  const f = useFormAction((fd) => {
    fd.append("brand_id", brandId);
    return upsertBrandSettings(fd);
  });
  return (
    <div>
      <Toggle open={f.open} setOpen={f.setOpen} label={current ? "Edit" : "Configure"} />
      {f.open && (
        <form onSubmit={f.submit} className="mt-3 grid grid-cols-2 gap-2">
          <input name="shopify_domain" defaultValue={current?.shopify_domain ?? ""} placeholder="mystore.myshopify.com" className="input col-span-1" />
          <input name="ses_sender_email" defaultValue={current?.ses_sender_email ?? ""} placeholder="hello@brand.com (SES verified)" className="input col-span-1" />
          <input name="meta_account_id" defaultValue={current?.meta_account_id ?? ""} placeholder="Meta ad account ID" className="input col-span-1" />
          <input name="telegram_chat_id" defaultValue={current?.telegram_chat_id ?? ""} placeholder="Telegram chat ID" className="input col-span-1" />
          <div className="col-span-2 flex justify-between items-center">
            {f.err && <span className="text-xs text-red-600">{f.err}</span>}
            <span />
            <Submit pending={f.pending} label="Save brand settings" />
          </div>
        </form>
      )}
    </div>
  );
}

export function DeleteButton({ table, id }: { table: string; id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("Delete this row?")) return;
        start(async () => {
          await deleteRow(table, id);
        });
      }}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
      title="Delete"
    >
      {pending ? "..." : "✕"}
    </button>
  );
}
