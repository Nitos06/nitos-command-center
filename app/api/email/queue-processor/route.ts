/**
 * Email Automation Queue Processor
 *
 * Runs every 15 minutes via Vercel cron (GET) or manual trigger (POST).
 * Picks up rows from automation_queue where trigger_at <= now() and sends via SES.
 *
 * Vercel cron sends GET with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/ses";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return !process.env.CRON_SECRET || auth === `Bearer ${process.env.CRON_SECRET}`;
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runProcessor();
}

// Manual / internal trigger via POST
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runProcessor();
}

async function runProcessor() {

  const supabase = sb();
  const now = new Date().toISOString();

  // Grab up to 100 pending items ready to send
  const { data: pending, error: fetchErr } = await supabase
    .from("automation_queue")
    .select("*")
    .lte("trigger_at", now)
    .eq("sent", false)
    .eq("recovered", false)
    .limit(100);

  if (fetchErr) {
    return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const item of pending) {
    try {
      const { subject, html } = await buildEmail(item, supabase);

      if (!subject || !html) {
        // No template found, mark as sent to avoid retrying forever
        await supabase
          .from("automation_queue")
          .update({ sent: true, sent_at: now })
          .eq("id", item.id);
        continue;
      }

      await sendEmail({ to: item.email, subject, html });

      // Track in email_sends
      await supabase.from("email_sends").insert({
        brand_id: item.brand_id,
        recipient_email: item.email,
        subject,
        flow_type: item.flow_type,
        delivered: true,
        sent_at: new Date().toISOString(),
      });

      // Mark queue item as sent
      await supabase
        .from("automation_queue")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", item.id);

      processed++;
    } catch (err: any) {
      errors.push(`${item.email}: ${err.message}`);
      console.error(`[queue-processor] failed for ${item.email}:`, err.message);
    }
  }

  return NextResponse.json({ ok: true, processed, errors: errors.length ? errors : undefined });
}

// ── Email template builder ────────────────────────────────────────────────────

async function buildEmail(item: any, supabase: any): Promise<{ subject: string; html: string }> {
  // Try to find a flow definition for this brand first
  if (item.brand_id) {
    const { data: flow } = await supabase
      .from("email_flows")
      .select("steps")
      .eq("brand_id", item.brand_id)
      .eq("is_active", true)
      .ilike("name", `%${item.flow_type.replace(/_/g, " ")}%`)
      .maybeSingle();

    if (flow?.steps?.[0]?.subject) {
      return {
        subject: flow.steps[0].subject,
        html: flow.steps[0].html_template ?? "",
      };
    }
  }

  // Fall back to built-in templates
  const name = item.customer_name?.split(" ")?.[0] || "there";

  if (item.flow_type === "abandoned_cart") {
    return buildAbandonedCartTemplate({ name, payload: item.payload });
  }

  if (item.flow_type === "welcome") {
    return buildWelcomeTemplate({ name });
  }

  if (item.flow_type === "post_purchase") {
    return buildPostPurchaseTemplate({ name });
  }

  return { subject: "", html: "" };
}

// ── Built-in templates ────────────────────────────────────────────────────────

function buildAbandonedCartTemplate({ name, payload }: { name: string; payload: any }) {
  const checkoutUrl = payload?.checkout_url ?? "#";
  const items: any[] = payload?.line_items ?? [];
  const total = payload?.total_price ?? "0.00";

  const itemRows = items
    .slice(0, 3)
    .map(
      (i: any) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px">${i.title ?? "Item"}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;font-size:14px">${i.quantity}× $${i.price}</td>
        </tr>`
    )
    .join("");

  return {
    subject: `${name}, you left something behind 🛒`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
    <div style="background:#111827;padding:32px 40px;text-align:center">
      <p style="color:#9ca3af;font-size:14px;margin:0 0 8px">Your cart is waiting</p>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Don't forget your items!</h1>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#374151;font-size:16px;margin:0 0 20px">Hi ${name},</p>
      <p style="color:#374151;font-size:16px;margin:0 0 20px">You left some items in your cart. They're still available — grab them before they're gone!</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        ${itemRows}
        <tr>
          <td style="padding:12px 0;font-weight:700;color:#111827">Total</td>
          <td style="padding:12px 0;font-weight:700;text-align:right;color:#111827">$${total}</td>
        </tr>
      </table>

      <div style="text-align:center;margin:28px 0">
        <a href="${checkoutUrl}"
          style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600">
          Complete My Order →
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center">
        You're receiving this because you started a checkout.
      </p>
    </div>
  </div>
</body>
</html>`,
  };
}

function buildWelcomeTemplate({ name }: { name: string }) {
  return {
    subject: "Welcome — you're officially in! 🎉",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
    <div style="background:#6366f1;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">You're in! 🎉</h1>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#374151;font-size:16px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:16px;margin:0 0 24px">
        Thanks for subscribing! You'll be the first to know about exclusive deals, new arrivals, and special offers.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin:32px 0 0">
        You're receiving this because you signed up at our store.
      </p>
    </div>
  </div>
</body>
</html>`,
  };
}

function buildPostPurchaseTemplate({ name }: { name: string }) {
  return {
    subject: `${name}, thank you for your order! 🙏`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
    <h2 style="color:#111827;margin:0 0 16px">Thank you, ${name}! 🙏</h2>
    <p style="color:#374151;font-size:16px">Your order is on its way. We hope you love it!</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:32px">Reply to this email if you have any questions.</p>
  </div>
</body>
</html>`,
  };
}
