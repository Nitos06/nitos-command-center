import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RFMScores {
  recency: number;
  frequency: number;
  monetary: number;
  score: string;
  label: string;
}

const RFM_LABELS: Record<string, string> = {
  "555": "champion",
  "554": "champion",
  "544": "champion",
  "545": "champion",
  "454": "loyal",
  "455": "loyal",
  "445": "loyal",
  "444": "loyal",
  "435": "loyal",
  "355": "potential_loyalist",
  "354": "potential_loyalist",
  "345": "potential_loyalist",
  "344": "potential_loyalist",
  "335": "potential_loyalist",
  "535": "new_customer",
  "534": "new_customer",
  "443": "promising",
  "434": "promising",
  "343": "promising",
  "334": "promising",
  "325": "need_attention",
  "324": "need_attention",
  "234": "need_attention",
  "244": "need_attention",
  "245": "need_attention",
  "225": "about_to_sleep",
  "224": "about_to_sleep",
  "223": "about_to_sleep",
  "214": "about_to_sleep",
  "215": "about_to_sleep",
  "155": "cant_lose",
  "154": "cant_lose",
  "145": "cant_lose",
  "144": "cant_lose",
  "133": "at_risk",
  "134": "at_risk",
  "143": "at_risk",
  "124": "at_risk",
  "125": "at_risk",
  "123": "hibernating",
  "122": "hibernating",
  "113": "hibernating",
  "114": "hibernating",
  "112": "lost",
  "111": "lost",
};

function getLabel(r: number, f: number, m: number): string {
  const key = `${r}${f}${m}`;
  if (RFM_LABELS[key]) return RFM_LABELS[key];
  // Fallback: find closest match
  if (r >= 4 && f >= 4) return "champion";
  if (r >= 3 && f >= 3) return "loyal";
  if (r >= 4 && f <= 2) return "new_customer";
  if (r <= 2 && f >= 4) return "cant_lose";
  if (r <= 2 && f >= 2) return "at_risk";
  if (r <= 2 && f <= 2) return "lost";
  return "need_attention";
}

function assignQuintile(values: number[], value: number): number {
  if (values.length === 0) return 3;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.indexOf(value);
  const pct = idx / sorted.length;
  if (pct >= 0.8) return 5;
  if (pct >= 0.6) return 4;
  if (pct >= 0.4) return 3;
  if (pct >= 0.2) return 2;
  return 1;
}

export async function calculateRFM(brandId: string) {
  const supabase = sb();
  const now = Date.now();
  const twelveMonthsAgo = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Get all contacts with orders
  const { data: contacts } = await supabase
    .from("email_contacts")
    .select("id, email")
    .eq("brand_id", brandId)
    .eq("subscribed", true);

  if (!contacts?.length) return { updated: 0 };

  // Get orders for brand in last 12 months
  const { data: orders } = await supabase
    .from("shopify_orders")
    .select("customer_email, total_price, created_at")
    .eq("brand_id", brandId)
    .gte("created_at", twelveMonthsAgo);

  if (!orders?.length) return { updated: 0 };

  // Group orders by email
  const ordersByEmail: Record<string, { dates: Date[]; total: number; count: number }> = {};
  for (const order of orders) {
    const email = order.customer_email?.toLowerCase();
    if (!email) continue;
    if (!ordersByEmail[email]) ordersByEmail[email] = { dates: [], total: 0, count: 0 };
    ordersByEmail[email].dates.push(new Date(order.created_at));
    ordersByEmail[email].total += Number(order.total_price ?? 0);
    ordersByEmail[email].count++;
  }

  // Calculate raw RFM values
  const rfmRaw: Array<{ contactId: string; recencyDays: number; frequency: number; monetary: number }> = [];

  for (const contact of contacts) {
    const emailData = ordersByEmail[contact.email?.toLowerCase()];
    if (!emailData) continue;

    const lastOrderDate = Math.max(...emailData.dates.map((d) => d.getTime()));
    const recencyDays = Math.round((now - lastOrderDate) / (1000 * 60 * 60 * 24));

    rfmRaw.push({
      contactId: contact.id,
      recencyDays,
      frequency: emailData.count,
      monetary: emailData.total,
    });
  }

  if (!rfmRaw.length) return { updated: 0 };

  // Calculate quintiles (recency is inverted — lower days = higher score)
  const recencyValues = rfmRaw.map((r) => r.recencyDays);
  const frequencyValues = rfmRaw.map((r) => r.frequency);
  const monetaryValues = rfmRaw.map((r) => r.monetary);

  let updated = 0;

  for (const entry of rfmRaw) {
    // Invert recency quintile (lower recency days = higher score)
    const rScore = 6 - assignQuintile(recencyValues, entry.recencyDays);
    const fScore = assignQuintile(frequencyValues, entry.frequency);
    const mScore = assignQuintile(monetaryValues, entry.monetary);
    const label = getLabel(rScore, fScore, mScore);

    await supabase
      .from("email_contacts")
      .update({
        rfm_recency: entry.recencyDays,
        rfm_frequency: entry.frequency,
        rfm_monetary: entry.monetary,
        rfm_score: `${rScore}-${fScore}-${mScore}`,
        rfm_updated_at: new Date().toISOString(),
        last_order_at: new Date(Date.now() - entry.recencyDays * 24 * 60 * 60 * 1000).toISOString(),
        total_orders: entry.frequency,
        total_spent: entry.monetary,
        avg_order_value: entry.frequency > 0 ? Math.round((entry.monetary / entry.frequency) * 100) / 100 : 0,
      })
      .eq("id", entry.contactId);

    updated++;
  }

  return { updated, label: "rfm_complete" };
}
