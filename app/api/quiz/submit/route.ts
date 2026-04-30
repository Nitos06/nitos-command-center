import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quiz_id,
      brand_id,
      email,
      name,
      answers,           // { question_id: answer_text }[]
      answers_json,      // raw answers object
    } = body;

    const supabase = createClient();

    // 1. Save quiz response
    const { data: response, error: respError } = await supabase
      .from("quiz_responses")
      .insert({
        quiz_id,
        brand_id,
        email,
        name,
        answers_json: answers_json ?? answers ?? {},
        converted: false,
      })
      .select("id")
      .single();

    if (respError) throw respError;

    // 2. Add email to email_contacts if provided
    if (email) {
      // Upsert the contact
      const { data: contact } = await supabase
        .from("email_contacts")
        .upsert({
          brand_id,
          email,
          name: name ?? null,
          source: "quiz",
          quiz_id,
          subscribed: true,
          tags: ["quiz_taker"],
          custom_fields: { quiz_answers: answers_json ?? answers ?? {} },
        }, { onConflict: "brand_id,email" })
        .select("id")
        .single();

      // 3. Ensure "Quiz Takers" segment exists and add contact to it
      const { data: segment } = await supabase
        .from("email_segments")
        .upsert({
          brand_id,
          name: "Quiz Takers",
          description: "Contacts who completed a quiz and opted in",
          filter_json: { source: "quiz" },
        }, { onConflict: "brand_id,name" })
        .select("id")
        .single();

      if (contact?.id && segment?.id) {
        await supabase
          .from("segment_contacts")
          .upsert({ segment_id: segment.id, contact_id: contact.id }, { onConflict: "segment_id,contact_id" });
      }

      // 4. High-intent segment: add if answers suggest strong interest
      const answersStr = JSON.stringify(answers_json ?? answers ?? {}).toLowerCase();
      const highIntentKeywords = ["yes", "ready", "now", "definitely", "absolutely", "asap", "immediately"];
      const isHighIntent = highIntentKeywords.some(kw => answersStr.includes(kw));

      if (isHighIntent && contact?.id) {
        const { data: hiSegment } = await supabase
          .from("email_segments")
          .upsert({
            brand_id,
            name: "Quiz High Intent",
            description: "Quiz takers whose answers indicate strong purchase intent",
            filter_json: { source: "quiz", intent: "high" },
          }, { onConflict: "brand_id,name" })
          .select("id")
          .single();

        if (hiSegment?.id) {
          await supabase
            .from("segment_contacts")
            .upsert({ segment_id: hiSegment.id, contact_id: contact.id }, { onConflict: "segment_id,contact_id" });
        }
      }
    }

    // 5. Simple recommendation: return a placeholder for now
    // (agent can enhance with Shopify product matching later)
    const recommendation = {
      headline: "Based on your answers, we recommend:",
      products: [], // populated by the recommendation engine
      message: "Your personalized results are ready!",
    };

    return NextResponse.json({
      ok: true,
      response_id: response?.id,
      recommendation,
      email_captured: !!email,
    });
  } catch (err) {
    console.error("quiz/submit error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
