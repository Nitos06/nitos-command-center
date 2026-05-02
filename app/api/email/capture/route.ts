import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/ses";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, source, brand_id } = await req.json();

    if (!email || !brand_id) {
      return NextResponse.json(
        { ok: false, error: "email and brand_id required" },
        { status: 400, headers: CORS }
      );
    }

    const supabase = sb();

    // 1. Upsert subscriber into email_contacts
    await supabase.from("email_contacts").upsert(
      {
        brand_id,
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        source: source || "popup",
        subscribed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_id,email" }
    );

    // 2. Look up active welcome flow for this brand
    const { data: welcomeFlow } = await supabase
      .from("email_flows")
      .select("*")
      .eq("brand_id", brand_id)
      .eq("is_active", true)
      .ilike("name", "%welcome%")
      .maybeSingle();

    // 3. Send welcome email immediately (or use default template)
    const firstName = name?.split(" ")[0] || "there";
    let subject = welcomeFlow?.steps?.[0]?.subject ?? "Welcome — you're in!";
    let html =
      welcomeFlow?.steps?.[0]?.html_template ??
      buildDefaultWelcomeEmail({ name: firstName, brand_id });

    try {
      const messageId = await sendEmail({ to: email, subject, html });

      // 4. Track in email_sends
      await supabase.from("email_sends").insert({
        brand_id,
        recipient_email: email,
        subject,
        flow_type: "welcome",
        delivered: true,
        sent_at: new Date().toISOString(),
      });
    } catch (sesErr: any) {
      // Don't fail the capture if SES is not configured yet
      console.error("[email/capture] SES send failed:", sesErr?.message);
    }

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err: any) {
    console.error("[email/capture] error:", err?.message);
    return NextResponse.json(
      { ok: false, error: err?.message },
      { status: 500, headers: CORS }
    );
  }
}

function buildDefaultWelcomeEmail({ name, brand_id }: { name: string; brand_id: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
    <div style="background:#6366f1;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">You're in! 🎉</h1>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#374151;font-size:16px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:16px;margin:0 0 24px">
        Thanks for subscribing! You'll be the first to know about exclusive deals,
        new arrivals, and special offers — just for subscribers.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:32px 0 0">
        You're receiving this because you signed up at our store.
      </p>
    </div>
  </div>
</body>
</html>`;
}
