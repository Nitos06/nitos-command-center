"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

export function InvoiceUpload({ brandId }: { brandId: string }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setDone(false);

    const form = new FormData();
    form.append("file", file);
    form.append("brandId", brandId);

    try {
      const res = await fetch("/api/taxes/upload-invoice", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label className={`flex items-center gap-2 cursor-pointer btn-outline text-sm px-3 py-1.5 ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}>
      {uploading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : done ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Upload className="w-3.5 h-3.5" />
      )}
      {done ? "Uploaded!" : "Upload invoice"}
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFile} disabled={uploading} />
      {error && <span className="text-red-500 text-xs ml-1">{error}</span>}
    </label>
  );
}
