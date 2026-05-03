import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const days = Number(searchParams.get("days") ?? 30);

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Aggregate daily metrics
  const { data: daily } = await supabase
    .from("deliverability_daily")
    .select("*")
    .eq("brand_id", brandId)
    .gte("date", since)
    .is("domain", null)
    .order("date", { ascending: true });

  // Per-domain breakdown
  const { data: byDomain } = await supabase
    .from("deliverability_daily")
    .select("domain, sent, delivered, bounced, complaints, opened, clicked")
    .eq("brand_id", brandId)
    .gte("date", since)
    .not("domain", "is", null);

  // Aggregate by domain
  const domainMap: Record<string, any> = {};
  for (const row of byDomain ?? []) {
    if (!row.domain) continue;
    if (!domainMap[row.domain]) {
      domainMap[row.domain] = { domain: row.domain, sent: 0, delivered: 0, bounced: 0, complaints: 0, opened: 0, clicked: 0 };
    }
    domainMap[row.domain].sent += row.sent ?? 0;
    domainMap[row.domain].delivered += row.delivered ?? 0;
    domainMap[row.domain].bounced += row.bounced ?? 0;
    domainMap[row.domain].complaints += row.complaints ?? 0;
    domainMap[row.domain].opened += row.opened ?? 0;
    domainMap[row.domain].clicked += row.clicked ?? 0;
  }

  const domains = Object.values(domainMap);

  // Totals
  const totals = (daily ?? []).reduce(
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

  return NextResponse.json({ daily: daily ?? [], domains, totals, period_days: days });
}
