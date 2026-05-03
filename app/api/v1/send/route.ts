import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, requireScope, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";
import { sendEmail, sendBulkEmail } from "@/lib/ses";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();
  if (!requireScope(auth, "campaigns:write")) return forbiddenResponse();

  const supabase = sb();
  const body = await req.json();
  const { campaign_id } = body;

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
  }

  // Get campaign
  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .eq("brand_id", auth.brandId)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (!campaign.html_compiled && !campaign.mjml_source) {
    return NextResponse.json({ error: "Campaign has no content" }, { status: 400 });
  }

  // Compile MJML if needed
  let html = campaign.html_compiled;
  if (!html && campaign.mjml_source) {
    const mjml = (await import("mjml")).default;
    const result = mjml(campaign.mjml_source, { validationLevel: "soft" });
    html = result.html;
  }

  // Get recipients from segment or all subscribed contacts
  let recipientQuery = supabase
    .from("email_contacts")
    .select("id, email")
    .eq("brand_id", auth.brandId)
    .eq("subscribed", true);

  if (campaign.segment_id) {
    const { data: members } = await supabase
      .from("segment_memberships")
      .select("contact_id")
      .eq("segment_id", campaign.segment_id)
      .is("left_at", null);

    const memberIds = (members ?? []).map((m: any) => m.contact_id);
    if (memberIds.length === 0) {
      return NextResponse.json({ error: "Segment has no members" }, { status: 400 });
    }
    recipientQuery = recipientQuery.in("id", memberIds);
  }

  const { data: recipients } = await recipientQuery;
  if (!recipients?.length) {
    return NextResponse.json({ error: "No recipients found" }, { status: 400 });
  }

  // Send
  const result = await sendBulkEmail(
    recipients.map((r: any) => ({ email: r.email })),
    { subject: campaign.subject, html: html! }
  );

  // Log sends
  const sends = recipients.map((r: any) => ({
    brand_id: auth.brandId,
    campaign_id: campaign.id,
    contact_id: r.id,
    recipient_email: r.email,
    subject: campaign.subject,
    delivered: true,
    sent_at: new Date().toISOString(),
  }));

  await supabase.from("email_sends").insert(sends);

  // Update campaign status
  await supabase
    .from("email_campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", campaign_id);

  // Update calendar entry if linked
  if (campaign.calendar_entry_id) {
    await supabase
      .from("campaign_calendar")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", campaign.calendar_entry_id);
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    total_recipients: recipients.length,
  });
}
