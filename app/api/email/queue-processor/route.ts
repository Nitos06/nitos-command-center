/**
 * Email Automation Queue Processor (v2 — Multi-Step Flows)
 *
 * Runs every 15 minutes via Vercel cron (GET) or manual trigger (POST).
 * Picks up rows from automation_queue where trigger_at <= now() and sends via SES.
 * Supports multi-step flows: after sending, queues the next step (delay, condition, split).
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

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runProcessor();
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runProcessor();
}

async function runProcessor() {
  const supabase = sb();
  const now = new Date().toISOString();

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
      // Multi-step flow: if item has a current_step_id, use step-based processing
      if (item.current_step_id) {
        await processFlowStep(item, supabase);
      } else {
        // Legacy single-step processing
        await processLegacyItem(item, supabase);
      }
      processed++;
    } catch (err: any) {
      errors.push(`${item.email}: ${err.message}`);
      console.error(`[queue-processor] failed for ${item.email}:`, err.message);
    }
  }

  return NextResponse.json({ ok: true, processed, errors: errors.length ? errors : undefined });
}

// ── Multi-step flow processing ───────────────────────────────────────────────

async function processFlowStep(item: any, supabase: any) {
  const now = new Date().toISOString();

  const { data: step } = await supabase
    .from("email_flow_steps")
    .select("*")
    .eq("id", item.current_step_id)
    .single();

  if (!step) {
    await markSent(item.id, supabase);
    return;
  }

  if (step.step_type === "email") {
    const html = step.html_compiled || step.mjml_source || "";
    const subject = step.subject || "Update from us";

    if (html && subject) {
      const messageId = await sendEmail({ to: item.email, subject, html });

      await supabase.from("email_sends").insert({
        brand_id: item.brand_id,
        recipient_email: item.email,
        subject,
        flow_type: item.flow_type,
        flow_id: item.flow_id,
        flow_step_id: step.id,
        contact_id: item.contact_id,
        message_id: messageId,
        delivered: true,
        sent_at: now,
      });

      // Update step stats
      await supabase
        .from("email_flow_steps")
        .update({ sent_count: (step.sent_count ?? 0) + 1 })
        .eq("id", step.id);

      // Log contact event
      if (item.contact_id) {
        await supabase.from("contact_events").insert({
          brand_id: item.brand_id,
          contact_id: item.contact_id,
          email: item.email,
          event_type: "email_sent",
          event_data: { flow_id: item.flow_id, step_id: step.id, subject },
        });
      }
    }

    await markSent(item.id, supabase);
    await queueNextStep(item, step, supabase);

  } else if (step.step_type === "delay") {
    // Delay step: just queue the next step with appropriate trigger_at
    await markSent(item.id, supabase);
    await queueNextStep(item, step, supabase);

  } else if (step.step_type === "condition") {
    // Evaluate condition and route to true/false branch
    const conditionMet = await evaluateStepCondition(item, step, supabase);
    const nextStepId = conditionMet ? step.true_next_step_id : step.false_next_step_id;

    await markSent(item.id, supabase);

    if (nextStepId) {
      await supabase.from("automation_queue").insert({
        brand_id: item.brand_id,
        flow_type: item.flow_type,
        flow_id: item.flow_id,
        email: item.email,
        customer_name: item.customer_name,
        contact_id: item.contact_id,
        current_step_id: nextStepId,
        step_index: (item.step_index ?? 0) + 1,
        payload: item.payload,
        trigger_at: now,
        sent: false,
        recovered: false,
      });
    }

  } else if (step.step_type === "split") {
    // A/B split: randomly assign to variant
    const variants = step.split_variants as Array<{ weight: number; next_step_id: string }> | null;
    if (variants?.length) {
      const rand = Math.random() * 100;
      let cumulative = 0;
      let chosenNextId: string | null = null;

      for (const variant of variants) {
        cumulative += variant.weight;
        if (rand <= cumulative) {
          chosenNextId = variant.next_step_id;
          break;
        }
      }

      await markSent(item.id, supabase);

      if (chosenNextId) {
        await supabase.from("automation_queue").insert({
          brand_id: item.brand_id,
          flow_type: item.flow_type,
          flow_id: item.flow_id,
          email: item.email,
          customer_name: item.customer_name,
          contact_id: item.contact_id,
          current_step_id: chosenNextId,
          step_index: (item.step_index ?? 0) + 1,
          payload: item.payload,
          trigger_at: now,
          sent: false,
          recovered: false,
        });
      }
    } else {
      await markSent(item.id, supabase);
    }
  }
}

async function queueNextStep(item: any, currentStep: any, supabase: any) {
  // Find the next step by position
  const { data: nextStep } = await supabase
    .from("email_flow_steps")
    .select("id, step_type, delay_minutes")
    .eq("flow_id", item.flow_id)
    .gt("position", currentStep.position)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextStep) return; // Flow complete

  const delayMs = nextStep.step_type === "delay"
    ? (nextStep.delay_minutes ?? 60) * 60 * 1000
    : 0;

  const triggerAt = new Date(Date.now() + delayMs).toISOString();

  // If next step is a delay, skip it and queue the step AFTER the delay
  if (nextStep.step_type === "delay") {
    const { data: afterDelay } = await supabase
      .from("email_flow_steps")
      .select("id")
      .eq("flow_id", item.flow_id)
      .gt("position", nextStep.position ?? currentStep.position + 1)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (afterDelay) {
      await supabase.from("automation_queue").insert({
        brand_id: item.brand_id,
        flow_type: item.flow_type,
        flow_id: item.flow_id,
        email: item.email,
        customer_name: item.customer_name,
        contact_id: item.contact_id,
        current_step_id: afterDelay.id,
        step_index: (item.step_index ?? 0) + 1,
        payload: item.payload,
        trigger_at: triggerAt,
        sent: false,
        recovered: false,
      });
    }
  } else {
    await supabase.from("automation_queue").insert({
      brand_id: item.brand_id,
      flow_type: item.flow_type,
      flow_id: item.flow_id,
      email: item.email,
      customer_name: item.customer_name,
      contact_id: item.contact_id,
      current_step_id: nextStep.id,
      step_index: (item.step_index ?? 0) + 1,
      payload: item.payload,
      trigger_at: new Date().toISOString(),
      sent: false,
      recovered: false,
    });
  }
}

async function evaluateStepCondition(item: any, step: any, supabase: any): Promise<boolean> {
  const rules = step.condition_rules;
  if (!rules) return true;

  // Common condition: "opened_previous" — check if previous email was opened
  if (rules.field === "opened_previous") {
    const { data: prevSend } = await supabase
      .from("email_sends")
      .select("opened")
      .eq("flow_id", item.flow_id)
      .eq("recipient_email", item.email)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return prevSend?.opened === true;
  }

  // Condition: "clicked_previous"
  if (rules.field === "clicked_previous") {
    const { data: prevSend } = await supabase
      .from("email_sends")
      .select("clicked")
      .eq("flow_id", item.flow_id)
      .eq("recipient_email", item.email)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return prevSend?.clicked === true;
  }

  // Condition: "has_tag"
  if (rules.field === "has_tag" && item.contact_id) {
    const { data: contact } = await supabase
      .from("email_contacts")
      .select("tags")
      .eq("id", item.contact_id)
      .single();

    return contact?.tags?.includes(rules.value) ?? false;
  }

  // Condition: "total_orders_gte"
  if (rules.field === "total_orders_gte" && item.contact_id) {
    const { data: contact } = await supabase
      .from("email_contacts")
      .select("total_orders")
      .eq("id", item.contact_id)
      .single();

    return (contact?.total_orders ?? 0) >= Number(rules.value);
  }

  return true;
}

// ── Legacy single-step processing ────────────────────────────────────────────

async function processLegacyItem(item: any, supabase: any) {
  const now = new Date().toISOString();
  const { subject, html } = await buildEmail(item, supabase);

  if (!subject || !html) {
    await markSent(item.id, supabase);
    return;
  }

  const messageId = await sendEmail({ to: item.email, subject, html });

  await supabase.from("email_sends").insert({
    brand_id: item.brand_id,
    recipient_email: item.email,
    subject,
    flow_type: item.flow_type,
    message_id: messageId,
    contact_id: item.contact_id,
    delivered: true,
    sent_at: now,
  });

  // Log contact event if we have contact_id
  if (item.contact_id) {
    await supabase.from("contact_events").insert({
      brand_id: item.brand_id,
      contact_id: item.contact_id,
      email: item.email,
      event_type: "email_sent",
      event_data: { flow_type: item.flow_type, subject },
    });
  }

  await markSent(item.id, supabase);

  // Check if there's a multi-step flow for this flow_type and queue step 1
  if (item.flow_id) {
    const { data: firstStep } = await supabase
      .from("email_flow_steps")
      .select("id, step_type, delay_minutes")
      .eq("flow_id", item.flow_id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstStep && firstStep.step_type !== "email") {
      // The legacy path already sent the first email; queue the next step
      await queueNextStep(
        { ...item, step_index: 0 },
        { position: -1, flow_id: item.flow_id },
        supabase
      );
    }
  }
}

async function markSent(id: string, supabase: any) {
  await supabase
    .from("automation_queue")
    .update({ sent: true, sent_at: new Date().toISOString() })
    .eq("id", id);
}

// ── Email template builder (legacy) ─────────────────────────────────────────

async function buildEmail(item: any, supabase: any): Promise<{ subject: string; html: string }> {
  if (item.brand_id) {
    const { data: flow } = await supabase
      .from("email_flows")
      .select("id, steps")
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

  const name = item.customer_name?.split(" ")?.[0] || "there";

  if (item.flow_type === "abandoned_cart") return buildAbandonedCartTemplate({ name, payload: item.payload });
  if (item.flow_type === "welcome") return buildWelcomeTemplate({ name });
  if (item.flow_type === "post_purchase") return buildPostPurchaseTemplate({ name });
  if (item.flow_type === "win_back") return buildWinBackTemplate({ name });

  return { subject: "", html: "" };
}

// ── Built-in templates ───────────────────────────────────────────────────────

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
        <a href="${checkoutUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600">Complete My Order →</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center">You're receiving this because you started a checkout.</p>
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
      <p style="color:#374151;font-size:16px;margin:0 0 24px">Thanks for subscribing! You'll be the first to know about exclusive deals, new arrivals, and special offers.</p>
      <p style="color:#9ca3af;font-size:12px;margin:32px 0 0">You're receiving this because you signed up at our store.</p>
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

function buildWinBackTemplate({ name }: { name: string }) {
  return {
    subject: `${name}, we miss you! Come back for 15% off 💫`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
    <div style="background:#111827;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">We miss you! 💫</h1>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#374151;font-size:16px;margin:0 0 16px">Hi ${name},</p>
      <p style="color:#374151;font-size:16px;margin:0 0 24px">It's been a while since your last visit. We've got new products we think you'll love — and here's 15% off to welcome you back.</p>
      <div style="text-align:center;margin:28px 0">
        <div style="display:inline-block;background:#f3f4f6;padding:16px 32px;border-radius:10px;font-size:20px;font-weight:700;color:#111827;letter-spacing:2px">COMEBACK15</div>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center">Use code at checkout. Valid for 7 days.</p>
    </div>
  </div>
</body>
</html>`,
  };
}
