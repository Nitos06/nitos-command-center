import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await req.json();
    const supabase = createClient();

    // Get credentials from brand_settings
    const { data: settings } = await supabase
      .from("brand_settings")
      .select("meta_ad_account_id, meta_access_token")
      .eq("brand_id", brandId)
      .single();

    if (!settings?.meta_ad_account_id || !settings?.meta_access_token) {
      return NextResponse.json({ ok: false, error: "Meta Ads not configured" }, { status: 400 });
    }

    // Fetch last 30 days of ad spend from Meta Marketing API
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const until = new Date().toISOString().split("T")[0];

    const metaUrl = `https://graph.facebook.com/v19.0/${settings.meta_ad_account_id}/insights?fields=date_start,spend,impressions,clicks&time_range={"since":"${since}","until":"${until}"}&time_increment=1&access_token=${settings.meta_access_token}`;

    const res = await fetch(metaUrl);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ ok: false, error: err }, { status: 400 });
    }

    const json = await res.json();
    const rows = (json.data ?? []).map((d: any) => ({
      date: d.date_start,
      spend: parseFloat(d.spend ?? "0"),
      impressions: parseInt(d.impressions ?? "0"),
      clicks: parseInt(d.clicks ?? "0"),
    }));

    // Upsert into expenses table as marketing expenses
    if (rows.length > 0) {
      const expenses = rows
        .filter((r: any) => r.spend > 0)
        .map((r: any) => ({
          brand_id: brandId,
          vendor: "Meta Ads",
          category: "marketing",
          amount: r.spend,
          date: r.date,
          description: `Meta Ads spend — ${r.impressions.toLocaleString()} impressions, ${r.clicks.toLocaleString()} clicks`,
          source: "meta_auto",
        }));

      if (expenses.length > 0) {
        try { await supabase.from("expenses").upsert(expenses, { onConflict: "brand_id,vendor,date" }); } catch { /* ignore upsert errors */ }
      }
    }

    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    console.error("meta-ads-sync error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
