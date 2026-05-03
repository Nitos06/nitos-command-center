import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch unprocessed events
  const { data: events, error: fetchErr } = await supabase
    .from("app_events")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(200);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!events?.length) return NextResponse.json({ ok: true, processed: 0 });

  let processed = 0;

  for (const event of events) {
    try {
      switch (event.event_type) {
        case "five_star_media_review": {
          const p = event.payload as any;
          if (p?.customer_email) {
            await supabase.from("email_contacts").upsert(
              {
                brand_id: event.brand_id,
                email:    p.customer_email,
                tags:     ["5-star-reviewer", "ugc-contributor"],
                updated_at: new Date().toISOString(),
              },
              { onConflict: "brand_id,email" }
            );
          }
          // ugc_assets already inserted by sync-segment; skip duplicate
          break;
        }

        case "review_reward": {
          // TODO: integrate with Shopify discount code creation
          console.log(`[events/process] review_reward for review ${event.ref_id} — discount code generation pending`);
          break;
        }

        case "quiz_completed": {
          const p = event.payload as any;
          if (p?.email) {
            const tags = Array.isArray(p.tags) ? p.tags : ["quiz-completed"];
            await supabase.from("email_contacts").upsert(
              {
                brand_id: event.brand_id,
                email:    p.email,
                tags,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "brand_id,email" }
            );
          }
          break;
        }

        case "affiliate_conversion": {
          const p = event.payload as any;
          if (p?.email) {
            await supabase.from("email_contacts").upsert(
              {
                brand_id: event.brand_id,
                email:    p.email,
                tags:     [`referral-${p.affiliate_code ?? "unknown"}`],
                updated_at: new Date().toISOString(),
              },
              { onConflict: "brand_id,email" }
            );
          }
          break;
        }

        default:
          console.log(`[events/process] Unknown event type: ${event.event_type}`);
          break;
      }

      // Mark processed
      await supabase
        .from("app_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", event.id);

      processed++;
    } catch (err) {
      console.error(`[events/process] Error processing event ${event.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed, total: events.length });
}
