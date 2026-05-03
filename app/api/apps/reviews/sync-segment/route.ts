import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await req.json();
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  // Fetch approved 5-star reviews with photos or video
  const { data: reviews, error: fetchErr } = await supabase
    .from("reviews")
    .select("id, author_name, photos, body, product_title, customer_email")
    .eq("brand_id", brandId)
    .eq("status", "approved")
    .eq("rating", 5)
    .not("photos", "is", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!reviews?.length) return NextResponse.json({ ok: true, synced: 0 });

  let synced = 0;

  for (const review of reviews) {
    // Skip if already in ugc_assets
    const { data: existing } = await supabase
      .from("ugc_assets")
      .select("id")
      .eq("review_id", review.id)
      .limit(1);

    if (existing?.length) continue;

    const mediaUrls: string[] = Array.isArray(review.photos) ? review.photos : [review.photos];

    const assets = mediaUrls.map((url: string) => ({
      brand_id:       brandId,
      review_id:      review.id,
      url,
      type:           url.match(/\.(mp4|mov|webm)/i) ? "video" : "photo",
      quality_score:  7,
      review_rating:  5,
      customer_email: review.customer_email ?? null,
      used_in_ads:    false,
    }));

    const { error: insertErr } = await supabase.from("ugc_assets").insert(assets);
    if (insertErr) continue;

    // Create app_event for downstream processing
    await supabase.from("app_events").insert({
      brand_id:   brandId,
      event_type: "five_star_media_review",
      ref_id:     review.id,
      payload:    { review_id: review.id, author: review.author_name, media_count: mediaUrls.length },
      processed:  false,
      created_at: new Date().toISOString(),
    });

    synced += mediaUrls.length;
  }

  return NextResponse.json({ ok: true, synced });
}
