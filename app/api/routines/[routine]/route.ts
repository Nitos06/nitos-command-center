import { NextRequest, NextResponse } from "next/server";
import { runRoutine } from "@/lib/routines/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron calls this as GET with Authorization: Bearer $CRON_SECRET
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
  const result = await runRoutine(routine);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

// Dashboard "Run now" button calls this as POST (requires Supabase session)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ routine: string }> }
) {
  const { routine } = await params;
  // Fire and forget — return immediately, routine runs in background
  runRoutine(routine).catch(console.error);
  return NextResponse.json({ ok: true, message: `Routine '${routine}' started` });
}
