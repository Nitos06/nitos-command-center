import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  return runSync();
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runSync();
}

async function runSync() {
  const supabase = sb();

  // Get all brands that have Shopify customers
  const { data: brands } = await supabase
    .from("brand_settings")
    .select("brand_id, shopify_domain")
    .not("shopify_domain", "is", null);

  if (!brands?.length) return NextResponse.json({ ok: true, synced: 0 });

  let totalSynced = 0;

  for (const brand of brands) {
    // Get Shopify customers not yet in email_contacts
    const { data: customers } = await supabase
      .from("shopify_customers")
      .select("shopify_customer_id, email, first_name, last_name, accepts_marketing, tags, orders_count, total_spent")
      .eq("brand_id", brand.brand_id)
      .is("deleted_at", null)
      .not("email", "is", null);

    if (!customers?.length) continue;

    for (const customer of customers) {
      if (!customer.email) continue;

      const { error } = await supabase
        .from("email_contacts")
        .upsert(
          {
            brand_id: brand.brand_id,
            email: customer.email.toLowerCase().trim(),
            name: [customer.first_name, customer.last_name].filter(Boolean).join(" ") || null,
            source: "checkout",
            subscribed: customer.accepts_marketing ?? true,
            shopify_customer_id: customer.shopify_customer_id,
            total_orders: customer.orders_count ?? 0,
            total_spent: customer.total_spent ?? 0,
            tags: customer.tags ? (Array.isArray(customer.tags) ? customer.tags : customer.tags.split(",").map((t: string) => t.trim())) : [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "brand_id,email" }
        );

      if (!error) totalSynced++;
    }
  }

  return NextResponse.json({ ok: true, synced: totalSynced });
}
