import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: cors }); }

  const { quiz_id, brand_id, email, name, phone, answers_json } = body;
  if (!quiz_id || !email) {
    return NextResponse.json({ ok: false, error: "quiz_id and email are required" }, { status: 400, headers: cors });
  }

  // Save response
  const { data: resp } = await supabase.from("quiz_responses").insert({
    quiz_id,
    brand_id: brand_id || null,
    email,
    name: name || null,
    phone: phone || null,
    answers_json: answers_json || {},
  }).select("id").single();

  // Add to email contacts if not exists
  if (email) {
    await supabase.from("email_contacts").upsert(
      { email, name: name || null, brand_id: brand_id || null, source: "quiz", tags: ["quiz-taker"] },
      { onConflict: "email,brand_id", ignoreDuplicates: false }
    );
  }

  // Build recommendations from answer→product_tag mapping
  let recommendation: any = { headline: "Your personalized results are ready!", products: [] };

  try {
    // Collect product tags from answers
    const answerOptionIds = Object.values(answers_json ?? {}).flat() as string[];
    if (answerOptionIds.length > 0) {
      const { data: options } = await supabase
        .from("quiz_options")
        .select("product_tags")
        .in("id", answerOptionIds);

      const tags = (options ?? [])
        .flatMap((o: any) => (o.product_tags ?? "").split(",").map((t: string) => t.trim()))
        .filter(Boolean);

      // Return tags as metadata so Lovable can use them to render product cards
      if (tags.length > 0) {
        recommendation.tags = [...new Set(tags)];
        recommendation.headline = `Based on your answers, we recommend products tagged: ${[...new Set(tags)].join(", ")}`;
      }
    }
  } catch { /* recommendation stays default */ }

  return NextResponse.json({ ok: true, response_id: resp?.id, recommendation }, { headers: cors });
}
