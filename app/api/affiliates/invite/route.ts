import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, name, email, commission_type, commission_pct, commission_fixed, program_id } = await req.json();
  if (!brandId || !name || !email) {
    return NextResponse.json({ error: "brandId, name and email required" }, { status: 400 });
  }

  // Generate unique referral code
  const code = name.toUpperCase().replace(/\s+/g, "").slice(0, 8) + Math.floor(Math.random() * 100);

  const { data, error } = await supabase.from("affiliates").insert({
    brand_id:        brandId,
    name,
    email,
    discount_code:   code,
    referral_code:   code,
    commission_type: commission_type ?? "percentage",
    commission_pct:  commission_pct ?? 10,
    commission_fixed:commission_fixed ?? null,
    program_id:      program_id ?? null,
    status:          "active",
    joined_at:       new Date().toISOString(),
    created_at:      new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log for agent
  await supabase.from("agent_logs").insert({
    agent_name: "affiliates",
    action:     "affiliate_invited",
    details:    { affiliate_id: data.id, name, email, code },
    brand_id:   brandId,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, affiliate: data });
}
