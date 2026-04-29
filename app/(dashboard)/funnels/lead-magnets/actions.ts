"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function s(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  return x === "" ? null : x;
}

export async function addLeadMagnet(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").insert({
    brand_id: s(formData.get("brand_id")),
    title: s(formData.get("title")),
    description: s(formData.get("description")),
    file_url: s(formData.get("file_url")),
    cover_image_url: s(formData.get("cover_image_url")),
    thank_you_url: s(formData.get("thank_you_url")),
    sequence_id: s(formData.get("sequence_id")) || null,
    is_published: formData.get("is_published") === "true",
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/lead-magnets");
  return { ok: true };
}

export async function toggleLeadMagnetPublished(id: string, is_published: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").update({ is_published }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/lead-magnets");
  return { ok: true };
}

export async function deleteLeadMagnet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/lead-magnets");
  return { ok: true };
}
