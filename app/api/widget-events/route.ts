import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.type || !body.shop) {
    return NextResponse.json({ error: "Missing type or shop" }, { status: 400 });
  }

  const supabase = await createClient();

  const { type, shop, payload } = body;

  // Route event to correct table
  switch (type) {
    case "review_submitted": {
      const { error } = await supabase.from("reviews").insert({
        shopify_product_id: payload.product_id,
        shopify_order_id: payload.order_id ?? null,
        customer_email: payload.email ?? null,
        customer_name: payload.name ?? null,
        rating: Number(payload.rating),
        title: payload.title ?? null,
        body: payload.body ?? null,
        status: "pending",
        verified_purchase: !!payload.order_id,
        shopify_product_title: payload.product_title ?? null,
        imported_from: "widget",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }

    case "quiz_response": {
      const { error } = await supabase.from("quiz_responses").insert({
        quiz_id: payload.quiz_id,
        customer_email: payload.email ?? null,
        answers: payload.answers,
        result_id: payload.result_id ?? null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }

    case "pp_upsell_shown": {
      await supabase.from("pp_conversions").insert({
        funnel_id: payload.funnel_id,
        step_id: payload.step_id,
        order_id: payload.order_id,
        event: "shown",
      });
      break;
    }

    case "pp_upsell_accepted": {
      await supabase.from("pp_conversions").insert({
        funnel_id: payload.funnel_id,
        step_id: payload.step_id,
        order_id: payload.order_id,
        event: "accepted",
        revenue: payload.revenue ?? 0,
      });
      break;
    }

    case "affiliate_click": {
      await supabase.from("affiliate_clicks").insert({
        referral_code: payload.code,
        shop,
        referrer: payload.referrer ?? null,
        landing_page: payload.landing_page ?? null,
      });
      break;
    }

    case "cs_message": {
      const { data: conv } = await supabase
        .from("cs_conversations")
        .select("id")
        .eq("session_id", payload.session_id)
        .maybeSingle();

      let conversationId = conv?.id;
      if (!conversationId) {
        const { data: newConv } = await supabase
          .from("cs_conversations")
          .insert({
            session_id: payload.session_id,
            customer_email: payload.email ?? null,
            shop,
            status: "open",
          })
          .select("id")
          .single();
        conversationId = newConv?.id;
      }

      if (conversationId) {
        await supabase.from("cs_messages").insert({
          conversation_id: conversationId,
          role: "customer",
          body: payload.message,
        });
      }
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown event type: ${type}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
