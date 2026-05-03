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

  const { data, error } = await supabase
    .from("segments")
    .select("id, name, description, type, subscriber_count, rules, auto_evaluate, last_evaluated_at, created_at")
    .eq("brand_id", auth.brandId)
    .order("subscriber_count", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ segments: data });
}
