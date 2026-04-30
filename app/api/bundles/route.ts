import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });
  const { data } = await supabase.from("bundles").select("*, bundle_items(*)").eq("brand_id", brandId).order("created_at", { ascending: false });
  return NextResponse.json({ bundles: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, name, bundle_type, discount_pct, discount_fixed, products, tiers, widget_title, widget_subtitle } = await req.json();
  if (!brandId || !name) return NextResponse.json({ error: "brandId and name required" }, { status: 400 });

  const { data: bundle, error } = await supabase.from("bundles").insert({
    brand_id:       brandId,
    name,
    bundle_type:    bundle_type ?? "fixed",
    discount_pct:   discount_pct ?? null,
    widget_title:   widget_title ?? name,
    widget_subtitle:widget_subtitle ?? null,
    is_active:      true,
    orders_30d:     0,
    revenue_30d:    0,
    created_at:     new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert bundle items if provided
  if (products?.length && bundle) {
    await supabase.from("bundle_items").insert(
      products.map((p: any) => ({
        bundle_id:         bundle.id,
        shopify_product_id:p.id ?? p,
        product_title:     p.title ?? null,
        quantity:          p.quantity ?? 1,
      }))
    );
  }

  // Create Shopify discount price rule if discount_pct
  if (discount_pct && bundle) {
    await supabase.from("agent_logs").insert({
      agent_name: "bundles",
      action:     "create_shopify_discount",
      details:    { bundle_id: bundle.id, discount_pct },
      brand_id:   brandId,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, bundle });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { bundleId, ...updates } = await req.json();
  const { error } = await supabase.from("bundles").update(updates).eq("id", bundleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { bundleId } = await req.json();
  await supabase.from("bundle_items").delete().eq("bundle_id", bundleId);
  const { error } = await supabase.from("bundles").delete().eq("id", bundleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
