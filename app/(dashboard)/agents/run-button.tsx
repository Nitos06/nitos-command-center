"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function RunButton({ routine }: { routine: string }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");

  async function run() {
    setState("running");
    try {
      const res = await fetch(`/api/routines/${routine}`, { method: "POST" });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 3000);
  }

  if (state === "running")
    return (
      <span className="flex items-center gap-1 text-xs text-primary-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…
      </span>
    );
  if (state === "done")
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> Started
      </span>
    );
  if (state === "error")
    return (
      <span className="flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="w-3.5 h-3.5" /> Error
      </span>
    );

  return (
    <button
      onClick={run}
      className="flex items-center gap-1 text-xs text-ink-muted hover:text-primary-600 transition-colors"
      title={`Run ${routine} now`}
    >
      <Play className="w-3 h-3" /> Run
    </button>
  );
}
