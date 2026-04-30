import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { order_id, funnel_id } = await req.json();
    const supabase = createClient();

    await supabase.from("pp_conversions").insert({
      funnel_id,
      order_id,
      event_type: "declined",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
