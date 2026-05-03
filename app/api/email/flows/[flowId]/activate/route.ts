import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  const supabase = sb();
  const body = await req.json();
  const activate = body.active !== false;

  // Validate: flow must have at least one email step to activate
  if (activate) {
    const { data: steps } = await supabase
      .from("email_flow_steps")
      .select("step_type")
      .eq("flow_id", flowId);

    const emailSteps = (steps ?? []).filter((s: any) => s.step_type === "email");
    if (emailSteps.length === 0) {
      return NextResponse.json(
        { error: "Flow must have at least one email step to activate" },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("email_flows")
    .update({ is_active: activate, updated_at: new Date().toISOString() })
    .eq("id", flowId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, active: activate });
}
