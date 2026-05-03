import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

function sbService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyShopifyHmac(body: string, hmacHeader: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmacHeader));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shopDomain = req.headers.get("x-shopify-shop-domain") ?? "";

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (secret && hmacHeader) {
    if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
    }
  }

  let customer: any;
  try {
    customer = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: brandSettings } = await supabase
    .from("brand_settings")
    .select("brand_id")
    .eq("shopify_domain", shopDomain)
    .maybeSingle();

  const brandId = brandSettings?.brand_id ?? null;

  if (topic === "customers/create" || topic === "customers/update") {
    await supabase.from("shopify_customers").upsert({
      brand_id: brandId,
      shopify_customer_id: String(customer.id),
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      orders_count: customer.orders_count,
      total_spent: customer.total_spent,
      tags: customer.tags,
      accepts_marketing: customer.accepts_marketing,
      created_at_shopify: customer.created_at,
      updated_at_shopify: customer.updated_at,
    }, { onConflict: "shopify_customer_id" });

    // ── Email Marketing: sync to email_contacts + log event + trigger flows ──
    if (brandId && customer.email) {
      const svc = sbService();
      const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");
      const tags = customer.tags
        ? (typeof customer.tags === "string" ? customer.tags.split(",").map((t: string) => t.trim()) : customer.tags)
        : [];

      const { data: contact } = await svc.from("email_contacts").upsert({
        brand_id: brandId,
        email: customer.email.toLowerCase().trim(),
        name: fullName || null,
        source: "checkout",
        subscribed: customer.accepts_marketing ?? true,
        shopify_customer_id: String(customer.id),
        total_orders: customer.orders_count ?? 0,
        total_spent: customer.total_spent ? Number(customer.total_spent) : 0,
        tags,
        updated_at: new Date().toISOString(),
      }, { onConflict: "brand_id,email" }).select("id").maybeSingle();

      const contactId = contact?.id;

      if (contactId) {
        // Log event
        const eventType = topic === "customers/create" ? "subscribed" : "contact_updated";
        await svc.from("contact_events").insert({
          brand_id: brandId,
          contact_id: contactId,
          email: customer.email,
          event_type: eventType,
          event_data: { shopify_customer_id: customer.id, accepts_marketing: customer.accepts_marketing },
        });

        // Queue welcome flow for new subscribers
        if (topic === "customers/create" && customer.accepts_marketing) {
          const { data: welcomeFlow } = await svc.from("email_flows")
            .select("id")
            .eq("brand_id", brandId)
            .eq("is_active", true)
            .ilike("name", "%welcome%")
            .maybeSingle();

          if (welcomeFlow) {
            const { data: firstStep } = await svc.from("email_flow_steps")
              .select("id")
              .eq("flow_id", welcomeFlow.id)
              .order("position", { ascending: true })
              .limit(1)
              .maybeSingle();

            await svc.from("automation_queue").insert({
              brand_id: brandId,
              flow_type: "welcome",
              flow_id: welcomeFlow.id,
              current_step_id: firstStep?.id ?? null,
              email: customer.email,
              customer_name: customer.first_name ?? fullName,
              contact_id: contactId,
              payload: {},
              trigger_at: new Date().toISOString(),
              sent: false,
              recovered: false,
            });
          }
        }

        // Trigger segment re-evaluation
        import("@/lib/segmentation/evaluate").then(({ evaluateContactForSegments }) => {
          evaluateContactForSegments(brandId, contactId).catch(() => {});
        });
      }
    }
  }

  if (topic === "customers/delete") {
    await supabase.from("shopify_customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("shopify_customer_id", String(customer.id));
  }

  return NextResponse.json({ ok: true });
}
