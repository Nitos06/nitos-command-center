import { GoogleGenerativeAI, type GenerateContentRequest } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY env var not set");
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

export async function analyzeHook(videoUrl: string, prompt?: string): Promise<{
  hook_type: string;
  pattern: string;
  emotion: string;
  score: number;
  notes: string;
}> {
  const model = getGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" });

  const systemPrompt = prompt ?? `Analyze this video ad hook. Return JSON with:
- hook_type: (question|statement|shock|story|problem|before_after|social_proof)
- pattern: short description of the hook pattern used
- emotion: primary emotion triggered (curiosity|fear|desire|excitement|empathy|urgency)
- score: 1-10 rating for hook strength
- notes: 1-2 sentence analysis of why it works or doesn't

Return only valid JSON, no markdown.`;

  const request: GenerateContentRequest = {
    contents: [{
      role: "user",
      parts: [
        { text: systemPrompt },
        { fileData: { mimeType: "video/mp4", fileUri: videoUrl } },
      ],
    }],
  };

  const result = await model.generateContent(request);
  const text = result.response.text().trim();
  try {
    return JSON.parse(text);
  } catch {
    return { hook_type: "unknown", pattern: text.slice(0, 100), emotion: "unknown", score: 0, notes: text.slice(0, 200) };
  }
}

export async function generateAdConcept(brief: {
  product: string;
  audience: string;
  hook_pattern: string;
  format: string;
  brand_voice: string;
}): Promise<{ concept: string; script: string; visual_direction: string }> {
  const model = getGeminiClient().getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `You are a direct-response ad copywriter. Create an ad concept for:
Product: ${brief.product}
Target audience: ${brief.audience}
Hook pattern to use: ${brief.hook_pattern}
Format: ${brief.format}
Brand voice: ${brief.brand_voice}

Return JSON with:
- concept: 1-line concept title
- script: full ad script (hook → problem → solution → CTA)
- visual_direction: visual/editing direction for the creative team

Return only valid JSON.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  try {
    return JSON.parse(text);
  } catch {
    return { concept: "Untitled concept", script: text, visual_direction: "" };
  }
}
