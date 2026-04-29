import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { order_id, customer_email, customer_name, brand_id, product_names } = body;

  if (!customer_email || !brand_id) {
    return NextResponse.json({ error: "customer_email and brand_id required" }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("brand_settings")
    .select("ses_sender_email")
    .eq("brand_id", brand_id)
    .maybeSingle();

  const { data: brand } = await supabase
    .from("brands")
    .select("name, tone_of_voice")
    .eq("id", brand_id)
    .maybeSingle();

  const fromEmail = settings?.ses_sender_email ?? process.env.SES_FROM_EMAIL;
  if (!fromEmail) {
    return NextResponse.json({ error: "No sender email configured for brand" }, { status: 400 });
  }

  const brandName = brand?.name ?? "us";
  const firstName = customer_name?.split(" ")[0] ?? "there";
  const productList = Array.isArray(product_names) && product_names.length > 0
    ? product_names.join(", ")
    : "your recent order";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const reviewUrl = `${appUrl}/api/widgets/review-form?brand=${brand_id}&order=${order_id ?? ""}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <p style="font-size:16px;line-height:1.6">Hey ${firstName} 👋</p>
  <p style="font-size:15px;line-height:1.6;color:#444">
    We noticed you received your ${productList} — how's it going?
  </p>
  <p style="font-size:15px;line-height:1.6;color:#444">
    If you have 60 seconds, we'd love to hear what you think. Real feedback from real customers
    means everything to us — it helps others make better decisions and helps us keep improving.
  </p>
  <div style="text-align:center;margin:28px 0">
    <a href="${reviewUrl}" style="background:#6366F1;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
      Leave a quick review →
    </a>
  </div>
  <p style="font-size:13px;color:#888;line-height:1.6">
    Photos and videos are always welcome if you want to share — they help a lot! 📸
  </p>
  <p style="font-size:14px;color:#444;margin-top:20px">
    Thanks for being a ${brandName} customer 🙏<br/>
    — The ${brandName} team
  </p>
  <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0"/>
  <p style="font-size:11px;color:#bbb">
    You received this because you placed an order at ${brandName}.
    <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(customer_email)}" style="color:#bbb">Unsubscribe</a>
  </p>
</body>
</html>`;

  try {
    const messageId = await sendEmail({
      to: customer_email,
      from: fromEmail,
      subject: `How's your ${productList}? 👀`,
      html,
    });

    await supabase.from("email_sends").insert({
      brand_id,
      to_email: customer_email,
      sent_at: new Date().toISOString(),
      opened: false,
      clicked: false,
      converted: false,
      revenue: 0,
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
