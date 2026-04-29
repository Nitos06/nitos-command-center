import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles SNS notifications from SES for bounces, complaints, deliveries.
// Configure SNS topic subscription in AWS pointing to this URL.
export async function POST(req: NextRequest) {
  const body = await req.json();

  // SNS subscription confirmation
  if (body.Type === "SubscriptionConfirmation") {
    await fetch(body.SubscribeURL);
    return NextResponse.json({ ok: true });
  }

  if (body.Type !== "Notification") {
    return NextResponse.json({ ok: true });
  }

  let message: any;
  try {
    message = JSON.parse(body.Message);
  } catch {
    return NextResponse.json({ error: "invalid message" }, { status: 400 });
  }

  const supabase = await createClient();
  const eventType: string = message.eventType ?? message.notificationType ?? "";

  if (eventType === "Bounce") {
    const bounce = message.bounce;
    for (const recipient of bounce?.bouncedRecipients ?? []) {
      await supabase.from("email_sends")
        .update({ bounced: true })
        .eq("to_email", recipient.emailAddress);
    }
    await incrementDeliverabilityCounter("bounced", bounce?.bouncedRecipients?.length ?? 1);
  }

  if (eventType === "Complaint") {
    const complaint = message.complaint;
    for (const recipient of complaint?.complainedRecipients ?? []) {
      await supabase.from("email_sends")
        .update({ complained: true })
        .eq("to_email", recipient.emailAddress);
    }
    await incrementDeliverabilityCounter("complaints", complaint?.complainedRecipients?.length ?? 1);
  }

  if (eventType === "Delivery") {
    const delivery = message.delivery;
    for (const addr of delivery?.recipients ?? []) {
      await supabase.from("email_sends")
        .update({ delivered: true })
        .eq("to_email", addr);
    }
    await incrementDeliverabilityCounter("delivered", delivery?.recipients?.length ?? 1);
  }

  if (eventType === "Open") {
    const mail = message.mail;
    const dest = mail?.destination?.[0];
    if (dest) {
      await supabase.from("email_sends")
        .update({ opened: true })
        .eq("to_email", dest)
        .eq("opened", false);
    }
  }

  if (eventType === "Click") {
    const mail = message.mail;
    const dest = mail?.destination?.[0];
    if (dest) {
      await supabase.from("email_sends")
        .update({ clicked: true })
        .eq("to_email", dest)
        .eq("clicked", false);
    }
  }

  return NextResponse.json({ ok: true });
}

async function incrementDeliverabilityCounter(field: string, count: number) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  // Upsert today's row — brand_id null for global tracking (brand-level via campaign lookup is a future enhancement)
  await supabase.rpc("increment_deliverability", { p_date: today, p_field: field, p_count: count });
}
