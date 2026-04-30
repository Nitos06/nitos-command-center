import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { brandId, vendor, amount, vat, category, date, notes } = body;
  if (!brandId || !amount) return NextResponse.json({ error: "brandId and amount required" }, { status: 400 });

  const { error } = await supabase.from("expenses").insert({
    brand_id: brandId,
    vendor_name: vendor || null,
    total: Number(amount),
    vat_amount: vat ? Number(vat) : null,
    category: category || "General",
    incurred_at: date || new Date().toISOString().slice(0, 10),
    notes: notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
