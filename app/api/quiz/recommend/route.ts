import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { quiz_id, brand_id, answers_json, email } = await req.json();
    const supabase = createClient();

    // Get quiz questions + options to build context
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*, quiz_options(*)")
      .eq("quiz_id", quiz_id);

    // Build answer context: map question_id → selected option text(s)
    const answerContext: string[] = [];
    if (questions && answers_json) {
      for (const q of questions) {
        const answerId = answers_json[q.id];
        if (answerId && q.quiz_options) {
          if (Array.isArray(answerId)) {
            for (const aid of answerId) {
              const opt = q.quiz_options.find((o: any) => o.id === aid);
              if (opt) answerContext.push(opt.option_text);
            }
          } else {
            const opt = q.quiz_options.find((o: any) => o.id === answerId);
            if (opt) answerContext.push(opt.option_text);
          }
        }
      }
    }

    // Try to get Shopify connection and fetch products
    let products: any[] = [];
    try {
      const { data: conn } = await supabase
        .from("connections")
        .select("credentials")
        .eq("brand_id", brand_id)
        .eq("platform", "shopify")
        .single();

      if (conn?.credentials?.shop && conn?.credentials?.access_token) {
        const resp = await fetch(
          `https://${conn.credentials.shop}/admin/api/2024-01/products.json?limit=50&status=active`,
          { headers: { "X-Shopify-Access-Token": conn.credentials.access_token } }
        );
        const shopifyData = await resp.json();
        products = shopifyData?.products ?? [];
      }
    } catch {
      // Shopify not connected — use empty products
    }

    // Score products by keyword overlap with answer context
    const answerText = answerContext.join(" ").toLowerCase();
    const scored = products
      .map((p: any) => {
        const text =
          `${p.title} ${p.tags} ${p.product_type} ${p.body_html?.replace(/<[^>]+>/g, "") ?? ""}`.toLowerCase();
        let score = 0;
        for (const word of answerText.split(/\s+/)) {
          if (word.length > 3 && text.includes(word)) score++;
        }
        return { ...p, score };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);

    const recommendation = {
      headline:
        answerContext.length > 0
          ? `Based on your answers, here's what we recommend for you:`
          : `Here are our top picks for you:`,
      products: scored.map((p: any) => ({
        id: p.id,
        name: p.title,
        price: p.variants?.[0]?.price ? `$${p.variants[0].price}` : "",
        image: p.images?.[0]?.src ?? "",
        url: p.handle ? `/products/${p.handle}` : "#",
        description: p.body_html?.replace(/<[^>]+>/g, "").slice(0, 120) ?? "",
      })),
      message: "Your personalized results are ready!",
      answer_summary: answerContext.slice(0, 3),
    };

    return NextResponse.json({ ok: true, recommendation });
  } catch (err) {
    console.error("quiz/recommend error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
