import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const brandId = form.get("brandId") as string | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!brandId) return NextResponse.json({ error: "No brandId" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `invoices/${brandId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadErr } = await supabase.storage
    .from("uploads")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);

  const { error: dbErr } = await supabase.from("invoice_uploads").insert({
    brand_id: brandId,
    file_url: urlData.publicUrl,
    status: "pending",
  });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, url: urlData.publicUrl });
}
