"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("At least 8 characters."); return; }
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("idle");
      setError(error.message);
    } else {
      setStatus("done");
      setTimeout(() => router.push("/war-room"), 1500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg px-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg">N</div>
          <div>
            <div className="font-semibold text-ink text-lg leading-tight">Nitos</div>
            <div className="text-xs text-ink-muted">Set your password</div>
          </div>
        </div>

        {status === "done" ? (
          <div className="text-center py-4">
            <div className="font-medium text-green-600 mb-1">Password set!</div>
            <div className="text-sm text-ink-muted">Taking you to the War Room…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="kpi-label mb-1 block">New password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" />
            </div>
            <div>
              <label className="kpi-label mb-1 block">Confirm password</label>
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="input" />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
              {status === "loading" ? "Saving…" : "Set password & sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
