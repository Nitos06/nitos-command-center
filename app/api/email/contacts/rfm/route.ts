import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateRFM } from "@/lib/segmentation/rfm";

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
  return runRFM();
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runRFM();
}

async function runRFM() {
  const supabase = sb();

  const { data: brands } = await supabase
    .from("brands")
    .select("id")
    .eq("status", "active");

  if (!brands?.length) return NextResponse.json({ ok: true, updated: 0 });

  let totalUpdated = 0;

  for (const brand of brands) {
    const result = await calculateRFM(brand.id);
    totalUpdated += result.updated;
  }

  return NextResponse.json({ ok: true, updated: totalUpdated });
}
