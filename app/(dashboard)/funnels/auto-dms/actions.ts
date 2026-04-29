"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function s(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  return x === "" ? null : x;
}

function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

export async function addDmTrigger(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("dm_triggers").insert({
    brand_id: s(formData.get("brand_id")),
    platform: s(formData.get("platform")) ?? "instagram",
    trigger_type: s(formData.get("trigger_type")),
    name: s(formData.get("name")),
    keywords: parseKeywords(s(formData.get("keywords"))),
    target_post_id: s(formData.get("target_post_id")),
    reply_message: s(formData.get("reply_message")),
    sequence_id: s(formData.get("sequence_id")) || null,
    is_active: formData.get("is_active") !== "false",
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/auto-dms");
  return { ok: true };
}

export async function toggleDmTrigger(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("dm_triggers").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/auto-dms");
  return { ok: true };
}

export async function deleteDmTrigger(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("dm_triggers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/auto-dms");
  return { ok: true };
}
