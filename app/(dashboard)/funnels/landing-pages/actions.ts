"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function s(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  return x === "" ? null : x;
}

export async function addLandingPage(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("landing_pages").insert({
    brand_id: s(formData.get("brand_id")),
    slug: s(formData.get("slug")),
    title: s(formData.get("title")),
    meta_description: s(formData.get("meta_description")),
    html_content: s(formData.get("html_content")),
    status: s(formData.get("status")) ?? "draft",
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/landing-pages");
  return { ok: true };
}

export async function updateLandingPageStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("landing_pages").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/landing-pages");
  return { ok: true };
}

export async function updateLandingPageHtml(id: string, html_content: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("landing_pages").update({ html_content }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/landing-pages");
  return { ok: true };
}

export async function deleteLandingPage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("landing_pages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/landing-pages");
  return { ok: true };
}
