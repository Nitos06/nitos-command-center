import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// VPS can optionally call GET with Authorization: Bearer $CRON_SECRET
// to record that a run started (VPS executes via Claude Code CLI, not here)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routine: string }> }
) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const { routine } = await params;
  await serviceClient().from("routine_runs").insert({
    routine_name: routine,
    started_at: new Date().toISOString(),
    status: "queued",
  });
  return NextResponse.json({ ok: true, message: `${routine} queued — VPS executes via Claude Code` });
}

// Dashboard "Run now" button — queues the routine, VPS dashboard-bridge picks it up
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ routine: string }> }
) {
  const { routine } = await params;
  await serviceClient().from("routine_runs").insert({
    routine_name: routine,
    started_at: new Date().toISOString(),
    status: "queued",
  });
  return NextResponse.json({ ok: true, message: `${routine} queued — VPS will execute within 5 min` });
}
