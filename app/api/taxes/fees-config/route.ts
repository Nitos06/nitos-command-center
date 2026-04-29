import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { brandId, shopify_fee_pct, wise_fee_pct, wise_fee_fixed, shipping_cost_avg, product_cost_avg, other_fees } = body;
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const fees = {
    shopify_fee_pct: shopify_fee_pct ? Number(shopify_fee_pct) : null,
    wise_fee_pct: wise_fee_pct ? Number(wise_fee_pct) : null,
    wise_fee_fixed: wise_fee_fixed ? Number(wise_fee_fixed) : null,
    shipping_cost_avg: shipping_cost_avg ? Number(shipping_cost_avg) : null,
    product_cost_avg: product_cost_avg ? Number(product_cost_avg) : null,
    other_fees_notes: other_fees || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("brand_settings")
    .upsert({ brand_id: brandId, fees_config: fees }, { onConflict: "brand_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
