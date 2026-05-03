import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { evaluateAllSegments } from "@/lib/segmentation/evaluate";

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
  return runEvaluate();
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runEvaluate();
}

async function runEvaluate() {
  const supabase = sb();

  const { data: brands } = await supabase
    .from("brands")
    .select("id")
    .eq("status", "active");

  if (!brands?.length) return NextResponse.json({ ok: true, evaluated: 0 });

  let totalEvaluated = 0;
  let totalChanges = 0;

  for (const brand of brands) {
    const result = await evaluateAllSegments(brand.id);
    totalEvaluated += result.evaluated;
    totalChanges += result.changes ?? 0;
  }

  return NextResponse.json({ ok: true, evaluated: totalEvaluated, changes: totalChanges });
}
