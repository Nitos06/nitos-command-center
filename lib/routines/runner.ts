import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { executeDatabaseQuery, executeHttpRequest, getServiceClient } from "./tools";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "database_query",
        description: `Execute SQL against the Supabase PostgreSQL database.
Supports SELECT, INSERT, UPDATE, UPSERT (INSERT ... ON CONFLICT DO UPDATE), DELETE.
RLS is bypassed — you have full access. Always use RETURNING * for writes.`,
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            sql: { type: FunctionDeclarationSchemaType.STRING, description: "SQL statement to execute" },
          },
          required: ["sql"],
        },
      },
      {
        name: "http_request",
        description: `Make an HTTP request to any external API.
Use for: Shopify Admin REST API, Meta Graph API, Instagram Graph API, Facebook Graph API,
Telegram Bot API, DataForSEO REST API, HeyGen API, Submagic API, YouTube Data API,
TikTok API, Pinterest API, Apify API, Amazon SES.
Get per-brand tokens first with database_query on the connections table.`,
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            method: { type: FunctionDeclarationSchemaType.STRING, description: "GET POST PUT PATCH DELETE" },
            url: { type: FunctionDeclarationSchemaType.STRING, description: "Full URL" },
            headers: { type: FunctionDeclarationSchemaType.OBJECT, description: "HTTP headers as key-value pairs" },
            body: { type: FunctionDeclarationSchemaType.STRING, description: "JSON-serialised request body" },
          },
          required: ["method", "url"],
        },
      },
    ],
  },
];

export async function runRoutine(routineName: string) {
  const startedAt = new Date();
  const supabase = getServiceClient();

  // Read SKILL.md — bundled in Vercel deployment at skills/[name]/SKILL.md
  const skillPath = path.join(process.cwd(), "skills", routineName, "SKILL.md");
  let skillContent: string;
  try {
    skillContent = fs.readFileSync(skillPath, "utf-8");
  } catch {
    return { ok: false, error: `Skill not found: skills/${routineName}/SKILL.md` };
  }

  // Get active brands
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, niche, base_currency")
    .eq("status", "active");

  const brandsCtx = brands?.length
    ? brands.map((b: any) => `ID:${b.id} name:${b.name} slug:${b.slug} niche:${b.niche}`).join("\n")
    : "No active brands yet.";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: TOOLS,
    systemInstruction:
      "You are an autonomous business agent. Execute the routine completely and precisely. " +
      "Use database_query for all Supabase reads and writes. Use http_request for all external APIs. " +
      "Do not describe what you would do — just do it with the tools.",
  });

  const chat = model.startChat();

  const initialMessage = `Today: ${new Date().toISOString()}

Active brands:
${brandsCtx}

=== SKILL: ${routineName} ===
${skillContent}
=== END SKILL ===

Execute this routine now for all active brands.
- Use database_query for all DB operations
- Use http_request for external APIs (Shopify, Meta, Telegram, DataForSEO, HeyGen, etc.)
- Get per-brand API tokens: SELECT account_ref FROM connections WHERE brand_id='...' AND platform='...'
- Get per-brand settings: SELECT * FROM brand_settings WHERE brand_id='...'
- Insert into agent_logs when done: INSERT INTO agent_logs (brand_id, agent_name, type, message) VALUES (...)`;

  let response = await chat.sendMessage(initialMessage);
  let iterations = 0;
  const MAX = 40;

  try {
    while (iterations++ < MAX) {
      const parts = response.response.candidates?.[0]?.content?.parts ?? [];
      const fnCalls = parts.filter((p: any) => p.functionCall);

      // No more tool calls — we're done
      if (fnCalls.length === 0) {
        const summary = parts
          .filter((p: any) => p.text)
          .map((p: any) => p.text as string)
          .join("\n")
          .slice(0, 500);

        await supabase.from("routine_runs").insert({
          routine_name: routineName,
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
          status: "success",
          artifacts: { headline: summary.split("\n")[0] },
        });

        return { ok: true, summary };
      }

      // Execute all function calls in parallel
      const fnResponses = await Promise.all(
        fnCalls.map(async (part: any) => {
          const { name, args } = part.functionCall;
          let result: unknown;
          try {
            if (name === "database_query") {
              result = await executeDatabaseQuery(args.sql);
            } else if (name === "http_request") {
              result = await executeHttpRequest(args.method, args.url, args.headers, args.body);
            } else {
              result = { error: `Unknown function: ${name}` };
            }
          } catch (err: any) {
            result = { error: err.message };
          }
          return {
            functionResponse: {
              name,
              response: { result: JSON.stringify(result).slice(0, 8000) },
            },
          };
        })
      );

      response = await chat.sendMessage(fnResponses);
    }

    throw new Error("Max iterations reached");
  } catch (err: any) {
    await supabase.from("routine_runs").insert({
      routine_name: routineName,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      status: "failed",
      error_summary: err.message,
    });
    return { ok: false, error: err.message };
  }
}
