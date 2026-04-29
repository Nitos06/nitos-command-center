"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function s(v: FormDataEntryValue | null) {
  const x = (v ?? "").toString().trim();
  return x === "" ? null : x;
}

export async function addBioPage(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("link_in_bio_pages").insert({
    brand_id: s(formData.get("brand_id")),
    slug: s(formData.get("slug")),
    title: s(formData.get("title")),
    bio: s(formData.get("bio")),
    bg_color: s(formData.get("bg_color")) ?? "#ffffff",
    accent_color: s(formData.get("accent_color")) ?? "#6366f1",
    is_published: formData.get("is_published") === "true",
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/link-in-bio");
  return { ok: true };
}

export async function addBioItem(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("link_in_bio_items").insert({
    page_id: s(formData.get("page_id")),
    brand_id: s(formData.get("brand_id")),
    type: s(formData.get("type")) ?? "link",
    label: s(formData.get("label")),
    url: s(formData.get("url")),
    position: Number(formData.get("position") ?? 0),
  });
  if (error) return { error: error.message };
  revalidatePath("/funnels/link-in-bio");
  return { ok: true };
}

export async function toggleBioPagePublished(id: string, is_published: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("link_in_bio_pages").update({ is_published }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/link-in-bio");
  return { ok: true };
}

export async function deleteBioPage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("link_in_bio_pages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/link-in-bio");
  return { ok: true };
}

export async function deleteBioItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("link_in_bio_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/funnels/link-in-bio");
  return { ok: true };
}
