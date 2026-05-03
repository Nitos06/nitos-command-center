import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth) return unauthorizedResponse();

  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 30);
  const domain = searchParams.get("domain");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let query = supabase
    .from("deliverability_daily")
    .select("*")
    .eq("brand_id", auth.brandId)
    .gte("date", since)
    .order("date", { ascending: true });

  if (domain) query = query.eq("domain", domain);
  else query = query.is("domain", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calculate aggregates
  const totals = (data ?? []).reduce(
    (acc, d) => ({
      sent: acc.sent + (d.sent ?? 0),
      delivered: acc.delivered + (d.delivered ?? 0),
      bounced: acc.bounced + (d.bounced ?? 0),
      complaints: acc.complaints + (d.complaints ?? 0),
      opened: acc.opened + (d.opened ?? 0),
      clicked: acc.clicked + (d.clicked ?? 0),
      unsubscribed: acc.unsubscribed + (d.unsubscribed ?? 0),
    }),
    { sent: 0, delivered: 0, bounced: 0, complaints: 0, opened: 0, clicked: 0, unsubscribed: 0 }
  );

  const rates = {
    delivery_rate: totals.sent ? ((totals.delivered / totals.sent) * 100).toFixed(1) : "0",
    open_rate: totals.delivered ? ((totals.opened / totals.delivered) * 100).toFixed(1) : "0",
    click_rate: totals.delivered ? ((totals.clicked / totals.delivered) * 100).toFixed(1) : "0",
    bounce_rate: totals.sent ? ((totals.bounced / totals.sent) * 100).toFixed(1) : "0",
    complaint_rate: totals.sent ? ((totals.complaints / totals.sent) * 100).toFixed(2) : "0",
    unsubscribe_rate: totals.delivered ? ((totals.unsubscribed / totals.delivered) * 100).toFixed(2) : "0",
  };

  return NextResponse.json({ daily: data, totals, rates, period_days: days });
}
