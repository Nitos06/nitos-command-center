import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ question_id: string }> }
) {
  const { question_id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await supabase.from("quiz_options").delete().eq("question_id", question_id);
  const { error } = await supabase.from("quiz_questions").delete().eq("id", question_id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
