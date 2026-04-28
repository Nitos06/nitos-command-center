"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "signed-up">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("idle");
        setError("Wrong email or password.");
      } else {
        router.push("/war-room");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setStatus("idle");
        setError(error.message);
      } else {
        setStatus("signed-up");
      }
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

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-primary-50 p-1 mb-5 gap-1">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === "signin" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}
          >
            Create account
          </button>
        </div>

        {status === "signed-up" ? (
          <div className="text-center py-4">
            <div className="font-medium text-ink mb-1">Check your email</div>
            <div className="text-sm text-ink-muted">We sent a confirmation link to <b>{email}</b>.<br />Click it to activate your account, then sign in.</div>
            <button onClick={() => { setMode("signin"); setStatus("idle"); }} className="btn-ghost mt-4 text-sm">Back to sign in</button>
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
            <div>
              <label className="kpi-label mb-1 block">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
              {status === "loading" ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
