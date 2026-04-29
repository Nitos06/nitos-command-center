import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, sendBulkEmail } from "@/lib/ses";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { to, subject, html, text, from, replyTo, brand_id, campaign_id, bulk } = body;

  if (!subject || !html) {
    return NextResponse.json({ error: "subject and html required" }, { status: 400 });
  }

  try {
    if (bulk && Array.isArray(to)) {
      const result = await sendBulkEmail(
        to.map((email: string) => ({ email })),
        { subject, html, text, from, replyTo }
      );

      if (campaign_id && brand_id) {
        await supabase.from("email_campaigns").update({
          status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", campaign_id);
      }

      return NextResponse.json({ ok: true, ...result });
    }

    if (!to) return NextResponse.json({ error: "to required" }, { status: 400 });
    const messageId = await sendEmail({ to, subject, html, text, from, replyTo });

    if (brand_id) {
      await supabase.from("email_sends").insert({
        brand_id,
        campaign_id: campaign_id ?? null,
        to_email: Array.isArray(to) ? to[0] : to,
        sent_at: new Date().toISOString(),
        opened: false,
        clicked: false,
        converted: false,
        revenue: 0,
      });
    }

    return NextResponse.json({ ok: true, messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
