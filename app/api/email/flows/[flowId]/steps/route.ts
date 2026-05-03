import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  const supabase = sb();

  const { data, error } = await supabase
    .from("email_flow_steps")
    .select("*")
    .eq("flow_id", flowId)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ steps: data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  const supabase = sb();
  const body = await req.json();

  // Get flow to extract brand_id
  const { data: flow } = await supabase
    .from("email_flows")
    .select("brand_id")
    .eq("id", flowId)
    .single();

  if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });

  // Get max position
  const { data: existing } = await supabase
    .from("email_flow_steps")
    .select("position")
    .eq("flow_id", flowId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = body.position ?? ((existing?.position ?? -1) + 1);

  const { data, error } = await supabase
    .from("email_flow_steps")
    .insert({
      flow_id: flowId,
      brand_id: flow.brand_id,
      position,
      step_type: body.step_type,
      subject: body.subject,
      preview_text: body.preview_text,
      mjml_source: body.mjml_source,
      html_compiled: body.html_compiled,
      delay_minutes: body.delay_minutes,
      condition_rules: body.condition_rules,
      true_next_step_id: body.true_next_step_id,
      false_next_step_id: body.false_next_step_id,
      split_variants: body.split_variants,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ step: data }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  const supabase = sb();
  const body = await req.json();

  if (!body.id) return NextResponse.json({ error: "step id required" }, { status: 400 });

  const updates: Record<string, any> = {};
  const allowedFields = [
    "position", "step_type", "subject", "preview_text",
    "mjml_source", "html_compiled", "delay_minutes",
    "condition_rules", "true_next_step_id", "false_next_step_id", "split_variants",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("email_flow_steps")
    .update(updates)
    .eq("id", body.id)
    .eq("flow_id", flowId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ step: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  const supabase = sb();
  const { searchParams } = new URL(req.url);
  const stepId = searchParams.get("stepId");

  if (!stepId) return NextResponse.json({ error: "stepId required" }, { status: 400 });

  const { error } = await supabase
    .from("email_flow_steps")
    .delete()
    .eq("id", stepId)
    .eq("flow_id", flowId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
