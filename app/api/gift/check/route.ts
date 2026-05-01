import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(req: NextRequest) {
  const brand_id = req.nextUrl.searchParams.get("brand_id") ?? "";
  const cart_total = parseFloat(req.nextUrl.searchParams.get("cart_total") ?? "0");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch active promotion rules for brand — table may not exist yet, handle gracefully
  let promos: any[] | null = null;
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("brand_id", brand_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error) promos = data;
  } catch {
    // promotions table doesn't exist yet
  }

  if (!promos || promos.length === 0) {
    return NextResponse.json({ eligible: false, threshold: null, progress_pct: 0 }, { headers: cors });
  }

  const promo = promos[0];
  const threshold = promo.threshold ?? promo.trigger_rules?.min_cart_total ?? 50;
  const progress_pct = Math.min(100, Math.round((cart_total / threshold) * 100));
  const eligible = cart_total >= threshold;

  return NextResponse.json({
    eligible,
    threshold,
    current_total: cart_total,
    progress_pct,
    remaining: eligible ? 0 : parseFloat((threshold - cart_total).toFixed(2)),
    gift_product: promo.gift_product ?? null,
    message: eligible
      ? "You qualify for a free gift! It will be added at checkout."
      : `Spend $${(threshold - cart_total).toFixed(2)} more to unlock your free gift!`,
  }, { headers: cors });
}
