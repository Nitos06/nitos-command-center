import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WIDGET_SCRIPTS: Record<string, string> = {
  reviews: "reviews.js",
  bundles: "bundles.js",
  "post-purchase": "post-purchase.js",
  quiz: "quiz.js",
  chat: "chat.js",
  affiliates: "affiliates.js",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const filename = WIDGET_SCRIPTS[type];

  if (!filename) {
    return new NextResponse("Unknown widget type", { status: 404 });
  }

  const shop = req.nextUrl.searchParams.get("shop") ?? "";
  const apiBase = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const widgetPath = path.join(process.cwd(), "public", "widgets", filename);
  let script: string;

  try {
    script = fs.readFileSync(widgetPath, "utf-8");
  } catch {
    script = `/* Widget '${type}' not yet deployed. Check back soon. */`;
  }

  // Inject runtime config at the top of every widget
  const runtimeConfig = `
(function(){
  window.__nitos = window.__nitos || {};
  window.__nitos.shop = ${JSON.stringify(shop)};
  window.__nitos.api = ${JSON.stringify(apiBase)};
  window.__nitos.type = ${JSON.stringify(type)};
})();
`;

  const body = runtimeConfig + "\n" + script;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
