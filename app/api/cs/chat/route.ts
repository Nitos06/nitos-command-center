import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, brandId } = body;
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    const supabase = serviceClient();

    // Fetch brand FAQ + CS rules for context
    const [{ data: faq }, { data: rules }, { data: brandRow }] = await Promise.all([
      supabase.from("cs_faq").select("question, answer").eq("brand_id", brandId ?? "").limit(30),
      supabase.from("brand_settings").select("cs_rules").eq("brand_id", brandId ?? "").maybeSingle(),
      supabase.from("brands").select("name, niche").eq("id", brandId ?? "").maybeSingle(),
    ]);

    // Fetch prior conversation turns for this session
    const { data: history } = await supabase
      .from("cs_messages")
      .select("sender, content")
      .eq("session_id", sessionId ?? "anon")
      .order("created_at", { ascending: true })
      .limit(20);

    const brandName = brandRow?.name ?? "our store";
    const csRules = rules?.cs_rules;

    const systemPrompt = `You are a friendly, helpful customer service AI for ${brandName}${brandRow?.niche ? ` (${brandRow.niche})` : ""}.

Your job is to answer customer questions accurately and kindly. Be warm, concise, and human — never robotic.

${csRules ? `\nBrand CS rules:\n${typeof csRules === "string" ? csRules : JSON.stringify(csRules, null, 2)}` : ""}

${faq && faq.length > 0 ? `\nFAQ (use these answers when applicable):\n${faq.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}` : ""}

If you don't know the answer, say you'll escalate to a human agent. Never make up order statuses or tracking numbers. Keep responses under 120 words.`;

    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...(history ?? []).map((m: any) => ({
        role: m.sender === "bot" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "I'm having trouble responding right now. Please try again.";

    // Persist both turns
    const sid = sessionId ?? `anon-${Date.now()}`;
    await supabase.from("cs_messages").insert([
      { session_id: sid, brand_id: brandId, sender: "user", content: message, channel: "chatbot" },
      { session_id: sid, brand_id: brandId, sender: "bot",  content: reply,   channel: "chatbot" },
    ]);

    // Ensure a ticket exists for this session
    await supabase.from("cs_tickets").upsert({
      id: sid,
      brand_id: brandId,
      channel: "chatbot",
      status: "open",
      subject: message.slice(0, 80),
    }, { onConflict: "id", ignoreDuplicates: true });

    return NextResponse.json({ reply, sessionId: sid });
  } catch (err: any) {
    console.error("[cs/chat]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
