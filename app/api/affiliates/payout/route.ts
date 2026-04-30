import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, affiliate_id, amount, method, period_start, period_end, reference } = await req.json();
  if (!brandId || !affiliate_id || !amount) {
    return NextResponse.json({ error: "brandId, affiliate_id and amount required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("affiliate_payouts").insert({
    brand_id:     brandId,
    affiliate_id,
    amount,
    method:       method ?? "manual",
    status:       "paid",
    period_start: period_start ?? null,
    period_end:   period_end ?? null,
    paid_at:      new Date().toISOString(),
    reference:    reference ?? null,
    created_at:   new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update affiliate total_paid
  await supabase.rpc("increment_affiliate_paid", { aff_id: affiliate_id, amount }).catch(() => {});

  return NextResponse.json({ ok: true, payout: data });
}

// Mark pending payout as paid
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { payoutId } = await req.json();
  const { error } = await supabase.from("affiliate_payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payoutId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
