"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function s(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  return x === "" ? null : x;
}
function n(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  if (x === "") return null;
  const f = Number(x);
  return Number.isFinite(f) ? f : null;
}

export async function addBrand(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("brands").insert({
    slug: s(formData.get("slug")),
    name: s(formData.get("name")),
    domain: s(formData.get("domain")),
    niche: s(formData.get("niche")),
    country: s(formData.get("country")) ?? "IL",
    base_currency: s(formData.get("base_currency")) ?? "ILS",
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function addSubscription(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").insert({
    app_name: s(formData.get("app_name")),
    category: s(formData.get("category")),
    monthly_cost_usd: n(formData.get("monthly_cost_usd")),
    monthly_cost_ils: n(formData.get("monthly_cost_ils")),
    billing_day: n(formData.get("billing_day")),
    notes: s(formData.get("notes")),
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function addConnection(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("connections").insert({
    brand_id: s(formData.get("brand_id")),
    platform: s(formData.get("platform")),
    account_ref: s(formData.get("account_ref")),
    notes: s(formData.get("notes")),
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function addNiche(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("niches").insert({
    brand_id: s(formData.get("brand_id")),
    name: s(formData.get("name")),
    description: s(formData.get("description")),
    tone_of_voice: s(formData.get("tone_of_voice")),
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function addBenchmark(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("benchmarks").insert({
    brand_id: s(formData.get("brand_id")),
    metric: s(formData.get("metric")),
    target: n(formData.get("target")),
    baseline: n(formData.get("baseline")),
    unit: s(formData.get("unit")),
    context: s(formData.get("context")),
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function upsertTaxEntity(formData: FormData) {
  const supabase = await createClient();
  const brand_id = s(formData.get("brand_id"));
  if (!brand_id) return { error: "brand_id required" };
  const payload = {
    brand_id,
    entity_type: s(formData.get("entity_type")) ?? "osek_murshe",
    legal_name: s(formData.get("legal_name")),
    vat_number: s(formData.get("vat_number")),
    company_id: s(formData.get("company_id")),
    vat_frequency: s(formData.get("vat_frequency")) ?? "bimonthly",
    bituach_leumi_file_no: s(formData.get("bituach_leumi_file_no")),
  };
  const { error } = await supabase.from("tax_entities").upsert(payload, { onConflict: "brand_id" });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/taxes");
  return { ok: true };
}

export async function upsertBrandSettings(formData: FormData) {
  const supabase = await createClient();
  const brand_id = s(formData.get("brand_id"));
  if (!brand_id) return { error: "brand_id required" };
  const { error } = await supabase.from("brand_settings").upsert({
    brand_id,
    shopify_domain: s(formData.get("shopify_domain")),
    ses_sender_email: s(formData.get("ses_sender_email")),
    meta_account_id: s(formData.get("meta_account_id")),
    telegram_chat_id: s(formData.get("telegram_chat_id")),
  }, { onConflict: "brand_id" });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteRow(table: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
