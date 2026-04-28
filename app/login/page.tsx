"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "login" | "reset-sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("idle");
      setError("Wrong email or password.");
    } else {
      router.push("/war-room");
      router.refresh();
    }
  }

  async function handleForgot() {
    if (!email) { setError("Enter your email first."); return; }
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setStatus("idle");
    setMode("reset-sent");
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

        {mode === "reset-sent" ? (
          <div className="text-center py-4">
            <div className="font-medium text-ink mb-1">Check your email</div>
            <div className="text-sm text-ink-muted">We sent a password reset link to <b>{email}</b>.<br />Click it to set your password, then come back and sign in.</div>
            <button onClick={() => setMode("login")} className="btn-ghost mt-4 text-sm">Back to sign in</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
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
            <div>
              <label className="kpi-label mb-1 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" onClick={handleForgot} disabled={status === "loading"} className="w-full text-xs text-ink-muted hover:text-ink text-center pt-1">
              First time? Forgot password? → Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
