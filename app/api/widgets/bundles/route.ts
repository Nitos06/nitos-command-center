import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bundleId = searchParams.get("bundle_id");
  const brandId = searchParams.get("brand_id");
  const action = searchParams.get("action");

  if (!bundleId) return NextResponse.json({ ok: false, error: "Missing bundle_id" });

  const supabase = createClient();

  const { data: bundle } = await supabase
    .from("bundles")
    .select("*, bundle_items(*)")
    .eq("id", bundleId)
    .single();

  if (!bundle) return NextResponse.json({ ok: false, error: "Bundle not found" });

  // If action=cart_items, return Shopify-formatted items for /cart/add.js
  if (action === "cart_items") {
    const items = (bundle.bundle_items || []).map((item: any) => ({
      id: item.variant_id || item.product_id,
      quantity: item.quantity || 1,
    }));
    return NextResponse.json({ ok: true, items }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  return NextResponse.json({ ok: true, bundle }, {
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}
