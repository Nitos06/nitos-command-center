import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import crypto from "crypto";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const { ids, brandId } = await req.json();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the UGC assets by IDs
    const { data: assets, error: assetsError } = await supabase
      .from("ugc_assets")
      .select("id, review_id, type, url, quality_score")
      .in("id", ids);

    if (assetsError) throw assetsError;

    // Get associated review emails (reviews table has email column)
    const reviewIds = assets?.map((a: any) => a.review_id).filter(Boolean) ?? [];

    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, email, reviewer_name, rating")
      .in("id", reviewIds);

    // Build hashed email list for Meta Custom Audiences
    // Meta requires SHA-256 lowercase trimmed emails
    const emails = (reviews ?? [])
      .map((r: any) => r.email?.toLowerCase().trim())
      .filter(Boolean);

    const hashedEmails = emails.map((email: string) =>
      crypto.createHash("sha256").update(email).digest("hex")
    );

    // Mark assets as exported
    if (assets && assets.length > 0) {
      await supabase
        .from("ugc_assets")
        .update({ used_in_ads: true })
        .in("id", ids);
    }

    // Try Meta API if credentials exist
    const metaToken = process.env.META_ACCESS_TOKEN;
    const metaAccountId = process.env.META_AD_ACCOUNT_ID;

    let metaResult: any = null;
    let metaError: string | null = null;

    if (metaToken && metaAccountId && hashedEmails.length > 0) {
      try {
        // Create or update a Custom Audience
        // First, try to find an existing "UGC Reviewers" audience for this brand
        const audienceName = `UGC 5-Star Reviewers ${brandId ? `(${brandId.slice(0, 8)})` : ""}`;

        const createRes = await fetch(
          `https://graph.facebook.com/v19.0/act_${metaAccountId}/customaudiences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: audienceName,
              subtype: "CUSTOM",
              description: "Customers who left 5-star reviews with photo/video — for lookalike audiences",
              customer_file_source: "USER_PROVIDED_ONLY",
              access_token: metaToken,
            }),
          }
        );

        const audience = await createRes.json();

        if (audience.id) {
          // Add users to the audience
          const usersRes = await fetch(
            `https://graph.facebook.com/v19.0/${audience.id}/users`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payload: {
                  schema: ["EMAIL"],
                  data: hashedEmails.map((h: string) => [h]),
                },
                access_token: metaToken,
              }),
            }
          );

          const usersResult = await usersRes.json();
          metaResult = {
            audience_id: audience.id,
            audience_name: audienceName,
            users_added: usersResult.num_received ?? hashedEmails.length,
          };
        } else {
          metaError = audience.error?.message ?? "Failed to create audience";
        }
      } catch (e) {
        metaError = String(e);
      }
    }

    return NextResponse.json({
      ok: true,
      exported: ids.length,
      emails_hashed: hashedEmails.length,
      meta_connected: !!(metaToken && metaAccountId),
      meta_result: metaResult,
      meta_error: metaError,
      message: metaToken
        ? metaResult
          ? `Successfully exported ${hashedEmails.length} emails to Meta Custom Audience "${metaResult.audience_name}"`
          : `Meta error: ${metaError}`
        : `Exported ${hashedEmails.length} emails (hashed). Connect Meta in Settings → Connections to push to Custom Audiences automatically.`,
    }, { headers: CORS });

  } catch (err) {
    console.error("UGC Meta export error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500, headers: CORS });
  }
}
