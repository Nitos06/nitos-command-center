import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, order_total, line_items, shop, customer_email } = body;

    const supabase = createClient();

    // Find the brand by Shopify domain
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .ilike("shopify_domain", `%${shop}%`)
      .single();

    if (!brand) return NextResponse.json(null, { status: 404 });

    // Find an active funnel for this brand that matches the order
    const { data: funnels } = await supabase
      .from("pp_funnels")
      .select("*, pp_steps(*)")
      .eq("brand_id", brand.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!funnels || funnels.length === 0) return NextResponse.json(null, { status: 404 });

    // Simple matching: use first active funnel (can be enhanced with trigger rules)
    const funnel = funnels[0];
    const firstStep = funnel.pp_steps?.[0];

    if (!firstStep) return NextResponse.json(null, { status: 404 });

    // Log the impression (fire-and-forget, never block the offer response)
    try {
      await supabase.from("pp_conversions").insert({
        brand_id: brand.id,
        funnel_id: funnel.id,
        step_id: firstStep.id,
        order_id,
        customer_email,
        event_type: "impression",
        order_value: parseFloat(order_total ?? "0"),
      });
    } catch {
      // non-fatal
    }

    // Return the offer config
    const offerConfig = {
      funnel_id: funnel.id,
      product_title: firstStep.product_title ?? "Special Offer",
      product_image_url: firstStep.product_image_url ?? "",
      headline: firstStep.headline ?? "Wait! One more thing…",
      subheadline: firstStep.subheadline ?? "Add this to your order with one click.",
      cta_text: firstStep.cta_text ?? "Yes, add it!",
      decline_text: firstStep.decline_text ?? "No thanks",
      price: parseFloat(firstStep.offer_price ?? "0"),
      original_price: firstStep.original_price ? parseFloat(firstStep.original_price) : undefined,
      product_variant_id: firstStep.shopify_variant_id ?? "",
    };

    return NextResponse.json(offerConfig);
  } catch (err) {
    console.error("pp-funnels/offer error:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
