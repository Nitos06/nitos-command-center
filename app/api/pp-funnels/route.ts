import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, name, trigger_type, trigger_value, ai_pick, placement, steps } = await req.json();
  if (!brandId || !name) return NextResponse.json({ error: "brandId and name required" }, { status: 400 });

  const { data: funnel, error } = await supabase.from("pp_funnels").insert({
    brand_id:     brandId,
    name,
    trigger_type: trigger_type ?? "all_orders",
    trigger_value:trigger_value ?? null,
    ai_pick:      ai_pick ?? false,
    placement:    placement ?? "post_purchase",
    is_active:    false,
    created_at:   new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (steps?.length && funnel) {
    await supabase.from("pp_steps").insert(
      steps.map((s: any, i: number) => ({
        funnel_id:    funnel.id,
        brand_id:     brandId,
        step_type:    s.step_type ?? "upsell",
        product_id:   s.product_id ?? null,
        product_title:s.product_title ?? null,
        discount_pct: s.discount_pct ?? null,
        discount_type:s.discount_type ?? "percentage",
        headline:     s.headline ?? null,
        subheadline:  s.subheadline ?? null,
        button_text:  s.button_text ?? "Add to my order",
        decline_text: s.decline_text ?? "No thanks",
        sort_order:   i,
      }))
    );
  }

  return NextResponse.json({ ok: true, funnel });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { funnelId, ...updates } = await req.json();
  const { error } = await supabase.from("pp_funnels").update(updates).eq("id", funnelId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { funnelId } = await req.json();
  await supabase.from("pp_steps").delete().eq("funnel_id", funnelId);
  const { error } = await supabase.from("pp_funnels").delete().eq("id", funnelId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
