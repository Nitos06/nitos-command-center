import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addScriptTag, listScriptTags } from "@/lib/shopify-queries";

const WIDGET_TYPES = ["reviews", "bundles", "post-purchase", "quiz", "chat", "affiliates"] as const;
type WidgetType = (typeof WIDGET_TYPES)[number];

export async function POST(req: NextRequest) {
  const { widgetType, brandId } = await req.json().catch(() => ({}));

  if (!widgetType || !WIDGET_TYPES.includes(widgetType as WidgetType)) {
    return NextResponse.json({ error: "Invalid widget type" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL env var not set" }, { status: 500 });
  }

  const supabase = await createClient();

  // Get shop domain
  const { data: conn } = await supabase
    .from("connections")
    .select("account_ref")
    .eq("platform", "shopify")
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "No connected Shopify store found." }, { status: 404 });
  }

  const scriptSrc = `${appUrl}/api/widgets/${widgetType}?shop=${conn.account_ref}`;

  // Check if already installed
  const existing = await listScriptTags(brandId).catch(() => ({ script_tags: [] }));
  const alreadyInstalled = existing.script_tags.some((t) => t.src === scriptSrc);
  if (alreadyInstalled) {
    return NextResponse.json({ ok: true, message: "Already installed", src: scriptSrc });
  }

  await addScriptTag(scriptSrc, brandId);

  return NextResponse.json({ ok: true, message: "Script tag installed", src: scriptSrc });
}

export async function DELETE(req: NextRequest) {
  const { widgetType, brandId } = await req.json().catch(() => ({}));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const supabase = await createClient();

  const { data: conn } = await supabase
    .from("connections")
    .select("account_ref")
    .eq("platform", "shopify")
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (!conn) return NextResponse.json({ error: "No Shopify connection" }, { status: 404 });

  const scriptSrc = `${appUrl}/api/widgets/${widgetType}?shop=${conn.account_ref}`;
  const existing = await listScriptTags(brandId).catch(() => ({ script_tags: [] }));
  const found = existing.script_tags.find((t) => t.src === scriptSrc);

  if (found) {
    const { deleteScriptTag } = await import("@/lib/shopify-queries");
    await deleteScriptTag(found.id, brandId);
  }

  return NextResponse.json({ ok: true });
}
