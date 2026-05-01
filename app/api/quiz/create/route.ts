import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { brand_id, title } = await req.json();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ brand_id: brand_id || null, title: title || "New Quiz", is_active: false })
      .select("id")
      .single();
    if (error) { console.error("Quiz create error:", error); return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); }
    return NextResponse.json({ ok: true, quiz_id: data.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
