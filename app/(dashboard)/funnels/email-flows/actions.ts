"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function s(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  return x === "" ? null : x;
}
function n(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  if (x === "") return 0;
  const f = Number(x);
  return Number.isFinite(f) ? f : 0;
}

export async function addSequence(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").insert({
    brand_id: s(formData.get("brand_id")),
    name: s(formData.get("name")),
    mailjet_list_id: s(formData.get("mailjet_list_id")),
    trigger_source: s(formData.get("trigger_source")),
    is_active: formData.get("is_active") !== "false",
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/email-flows");
  return { ok: true };
}

export async function addSequenceStep(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequence_steps").insert({
    sequence_id: s(formData.get("sequence_id")),
    brand_id: s(formData.get("brand_id")),
    position: n(formData.get("position")),
    delay_days: n(formData.get("delay_days")),
    subject: s(formData.get("subject")),
    preview_text: s(formData.get("preview_text")),
    html_body: s(formData.get("html_body")),
    text_body: s(formData.get("text_body")),
    mailjet_template_id: s(formData.get("mailjet_template_id")),
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/email-flows");
  return { ok: true };
}

export async function toggleSequence(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/email-flows");
  return { ok: true };
}

export async function deleteSequence(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/email-flows");
  return { ok: true };
}

export async function deleteSequenceStep(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequence_steps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/email-flows");
  return { ok: true };
}
