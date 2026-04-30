import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

// Called when a review is submitted with 5 stars + media
// 1. Saves to ugc_assets table
// 2. Adds customer email to Meta Custom Audience (via the existing export-meta endpoint)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { review_id, brand_id, customer_email, media_urls, rating } = body;

    if (rating < 5 || !media_urls?.length) {
      return NextResponse.json({ skipped: true, reason: "Not 5-star or no media" });
    }

    const supabase = createClient();

    // Insert each media item as a ugc_asset
    const assets = media_urls.map((url: string) => ({
      brand_id,
      review_id,
      url,
      type: url.match(/\.(mp4|mov|webm)/i) ? "video" : "photo",
      quality_score: 7, // default score; agent can update via AI analysis
      review_rating: rating,
      customer_email,
      used_in_ads: false,
    }));

    const { data: inserted, error } = await supabase
      .from("ugc_assets")
      .insert(assets)
      .select("id");

    if (error) throw error;

    // Auto-export to Meta Custom Audience
    if (customer_email && inserted?.length) {
      const ids = inserted.map((a: any) => a.id);
      // Fire-and-forget — don't block the response
      fetch(new URL("/api/ugc/export-meta", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, brandId: brand_id, emails: [customer_email] }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, assets_created: inserted?.length ?? 0 });
  } catch (err) {
    console.error("process-ugc error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
