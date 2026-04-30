import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Shopify order actions triggered from CS inbox
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId, action, orderId, ticketId, amount, reason, discountPct } = await req.json();
  if (!brandId || !action) return NextResponse.json({ error: "brandId and action required" }, { status: 400 });

  // Get Shopify credentials for brand
  const { data: conn } = await supabase
    .from("connections")
    .select("shop_domain, access_token")
    .eq("brand_id", brandId)
    .eq("platform", "shopify")
    .maybeSingle();

  if (!conn?.shop_domain || !conn?.access_token) {
    return NextResponse.json({ error: "Shopify not connected for this brand" }, { status: 400 });
  }

  const { shop_domain, access_token } = conn;
  const headers = {
    "X-Shopify-Access-Token": access_token,
    "Content-Type": "application/json",
  };
  const base = `https://${shop_domain}/admin/api/2024-01`;

  let result: any = {};

  try {
    if (action === "refund" && orderId) {
      // Create refund
      const txRes = await fetch(`${base}/orders/${orderId}/transactions.json`, { headers });
      const { transactions } = await txRes.json();
      const parentId = transactions?.[0]?.id;

      const refundRes = await fetch(`${base}/orders/${orderId}/refunds.json`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          refund: {
            notify: true,
            note: reason ?? "Issued via CS dashboard",
            transactions: [{
              parent_id: parentId,
              amount: amount,
              kind: "refund",
              gateway: transactions?.[0]?.gateway,
            }],
          },
        }),
      });
      result = await refundRes.json();

    } else if (action === "cancel" && orderId) {
      const res = await fetch(`${base}/orders/${orderId}/cancel.json`, {
        method: "POST", headers,
        body: JSON.stringify({ reason: reason ?? "customer", email: true }),
      });
      result = await res.json();

    } else if (action === "discount_code") {
      const pct = discountPct ?? 10;
      const code = "CS" + Math.random().toString(36).toUpperCase().slice(2, 8);
      const priceRuleRes = await fetch(`${base}/price_rules.json`, {
        method: "POST", headers,
        body: JSON.stringify({
          price_rule: {
            title: `CS Discount ${code}`,
            target_type: "line_item",
            target_selection: "all",
            allocation_method: "across",
            value_type: "percentage",
            value: `-${pct}`,
            customer_selection: "all",
            starts_at: new Date().toISOString(),
            usage_limit: 1,
          },
        }),
      });
      const { price_rule } = await priceRuleRes.json();
      if (price_rule?.id) {
        const couponRes = await fetch(`${base}/price_rules/${price_rule.id}/discount_codes.json`, {
          method: "POST", headers,
          body: JSON.stringify({ discount_code: { code } }),
        });
        const { discount_code } = await couponRes.json();
        result = { code: discount_code?.code ?? code, price_rule_id: price_rule.id };
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Log the action on the ticket
  if (ticketId) {
    await supabase.from("cs_messages").insert({
      ticket_id: ticketId,
      from_role: "agent",
      body: `[Shopify action: ${action}] ${JSON.stringify(result)}`,
      sent_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, result });
}
