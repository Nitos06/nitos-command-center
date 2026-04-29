"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveReview(id: string) {
  const supabase = await createClient();
  await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
  revalidatePath("/reviews");
}

export async function rejectReview(id: string) {
  const supabase = await createClient();
  await supabase.from("reviews").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/reviews");
}

export async function replyToReview(id: string, reply: string) {
  const supabase = await createClient();
  await supabase
    .from("reviews")
    .update({ reply, reply_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/reviews");
}

export async function createSegment(data: {
  name: string;
  description?: string;
  filter_json: Record<string, unknown>;
  brand_id?: string;
}) {
  const supabase = await createClient();

  // Count how many reviews match the filter
  let query = supabase.from("reviews").select("customer_email", { count: "exact" });

  const f = data.filter_json as {
    rating_min?: number;
    rating_max?: number;
    verified_only?: boolean;
    date_from?: string;
    date_to?: string;
  };

  if (f.rating_min) query = query.gte("rating", f.rating_min) as typeof query;
  if (f.rating_max) query = query.lte("rating", f.rating_max) as typeof query;
  if (f.verified_only) query = query.eq("verified_purchase", true) as typeof query;
  if (f.date_from) query = query.gte("created_at", f.date_from) as typeof query;
  if (f.date_to) query = query.lte("created_at", f.date_to) as typeof query;

  query = query.eq("status", "approved") as typeof query;

  const { count } = await query;

  await supabase.from("review_segments").insert({
    ...data,
    customer_count: count ?? 0,
    last_synced_at: new Date().toISOString(),
  });

  revalidatePath("/reviews");
}

export async function deleteSegment(id: string) {
  const supabase = await createClient();
  await supabase.from("review_segments").delete().eq("id", id);
  revalidatePath("/reviews");
}

export async function installWidget(widgetType: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/widget-install`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ widgetType }),
  });
  const json = await res.json();
  revalidatePath("/reviews");
  return json;
}
