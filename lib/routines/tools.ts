import { createClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

export const ROUTINE_TOOLS: Anthropic.Tool[] = [
  {
    name: "database_query",
    description: `Execute SQL against the Supabase PostgreSQL database.
Supports SELECT, INSERT, UPDATE, UPSERT (INSERT ... ON CONFLICT), DELETE.
For SELECT: always alias subqueries as a table name, e.g. SELECT * FROM brands WHERE status='active'
For INSERT/UPDATE/DELETE: they return the affected rows if you add RETURNING *.
You have full access — RLS is bypassed.`,
    input_schema: {
      type: "object" as const,
      properties: {
        sql: { type: "string", description: "SQL statement to execute" },
      },
      required: ["sql"],
    },
  },
  {
    name: "http_request",
    description: `Make an HTTP request to any external API.
Use this for: Shopify Admin REST API, Meta Graph API, Instagram Graph API,
Facebook Graph API, Telegram Bot API, DataForSEO REST API, HeyGen API,
Submagic API, YouTube Data API, TikTok API, Pinterest API, Apify API,
Amazon SES (via our /api/email/send endpoint), and any other HTTP API.
Per-brand API tokens: first query the connections table to get them.`,
    input_schema: {
      type: "object" as const,
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        },
        url: {
          type: "string",
          description: "Full URL including query string params",
        },
        headers: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "HTTP headers. Include Authorization, Content-Type etc.",
        },
        body: {
          type: "string",
          description: "JSON-serialised request body string",
        },
      },
      required: ["method", "url"],
    },
  },
];

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function executeDatabaseQuery(sql: string): Promise<unknown> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("agent_execute_sql", {
    query_text: sql,
  });
  if (error) throw new Error(`DB error: ${error.message}`);
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(`Query error: ${(data as any).error}`);
  }
  return data;
}

export async function executeHttpRequest(
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: string
): Promise<{ status: number; body: string }> {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    ...(body ? { body } : {}),
  });
  const text = await res.text();
  // Truncate large responses so they fit in context
  return { status: res.status, body: text.slice(0, 6000) };
}

export { getServiceClient };
