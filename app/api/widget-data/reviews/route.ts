import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  if (!productId) return NextResponse.json({ reviews: [], summary: null });

  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, title, body, created_at, verified_purchase, media_urls")
    .eq("shopify_product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  const items = reviews ?? [];
  const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
  const counts = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: items.filter((r) => r.rating === star).length,
  }));

  return NextResponse.json(
    { reviews: items, summary: { average: avg, total: items.length, counts } },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
