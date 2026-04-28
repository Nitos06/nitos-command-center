"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg px-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg">N</div>
          <div>
            <div className="font-semibold text-ink text-lg leading-tight">Nitos</div>
            <div className="text-xs text-ink-muted">Command center</div>
          </div>
        </div>

        {status === "sent" ? (
          <div className="card-warm text-center">
            <div className="text-accent-600 font-medium mb-1">Check your email</div>
            <div className="text-sm text-ink-muted">We sent a magic link to <b>{email}</b>. Click it to sign in.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="kpi-label mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>
            {error && <div className="text-sm text-status-crit">{error}</div>}
            <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            <p className="text-xs text-ink-muted text-center">No password. We'll email you a one-time link.</p>
          </form>
        )}
      </div>
    </div>
  );
}
