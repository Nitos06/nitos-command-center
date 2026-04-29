import { createClient } from "@/lib/supabase/server";
import { AGENTS, readSkillMeta, cronToHuman } from "@/lib/skills";
import { RunButton } from "./run-button";
import { Bot, Clock, Cpu, Link2, BookOpen, Layers, Activity, CheckCircle2, XCircle, AlertCircle, Circle } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Finance:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Reviews:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  SEO:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Email:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Ads:       "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Analytics: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Social:    "bg-pink-500/10 text-pink-400 border-pink-500/20",
  CX:        "bg-teal-500/10 text-teal-400 border-teal-500/20",
  System:    "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function StatusDot({ status }: { status: string | null }) {
  if (status === "success") return <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />;
  if (status === "failed")  return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />;
  if (status === "queued")  return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />;
  return <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />;
}

function McpBadge({ name, required }: { name: string; required: boolean }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border ${
      required
        ? "bg-primary-500/10 text-primary-400 border-primary-500/20"
        : "bg-surface-tint text-ink-muted border-surface-border"
    }`}>
      {required && <span className="w-1 h-1 rounded-full bg-primary-400 mr-1 shrink-0" />}
      {name}
    </span>
  );
}

function Chip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-surface-tint text-ink-muted border border-surface-border font-mono">
      {name}
    </span>
  );
}

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const LIB_HOOKS = ["logging-protocol", "chain-contract", "self-heal"];

export default async function AgentsPage() {
  const supabase = await createClient();

  const [{ data: recentRuns }, { data: activityLogs }] = await Promise.all([
    supabase
      .from("routine_runs")
      .select("routine_name, status, started_at, finished_at, artifacts, error_summary")
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("agent_logs")
      .select("id, brand_id, agent_name, type, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const lastRunMap: Record<string, any> = {};
  for (const run of recentRuns ?? []) {
    if (!lastRunMap[run.routine_name]) lastRunMap[run.routine_name] = run;
  }

  const ok     = AGENTS.filter(a => lastRunMap[a.id]?.status === "success").length;
  const failed = AGENTS.filter(a => lastRunMap[a.id]?.status === "failed").length;
  const never  = AGENTS.filter(a => !lastRunMap[a.id]).length;

  const skillCache: Record<string, ReturnType<typeof readSkillMeta>> = {};
  for (const agent of AGENTS) {
    if (!skillCache[agent.skillDir]) {
      skillCache[agent.skillDir] = readSkillMeta(agent.skillDir);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-400" />
            Agents
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            26 autonomous agents · Claude Code CLI on VPS · 24/7
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />{ok} ok
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <XCircle className="w-3.5 h-3.5" />{failed} failed
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <Circle className="w-3.5 h-3.5" />{never} never run
          </span>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-ink text-sm">Live Activity</span>
          <span className="text-[10px] text-ink-muted ml-auto">agent_logs · last 50</span>
        </div>
        {(activityLogs?.length ?? 0) === 0 ? (
          <p className="text-xs text-ink-muted py-6 text-center">
            No activity yet — agents will log here once the VPS is running
          </p>
        ) : (
          <div className="max-h-52 overflow-y-auto font-mono">
            {activityLogs!.map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 py-1.5 border-b border-surface-border last:border-0">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  log.type === "error" ? "bg-red-400" : log.type === "warn" ? "bg-amber-400" : "bg-green-400"
                }`} />
                <span className="text-[10px] text-ink-subtle w-20 shrink-0">{timeAgo(log.created_at)}</span>
                <span className="text-[10px] text-primary-400 w-36 shrink-0 truncate">{log.agent_name}</span>
                <span className="text-[10px] text-ink flex-1 min-w-0 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Cards */}
      <div className="space-y-1.5">
        {AGENTS.map(agent => {
          const meta = skillCache[agent.skillDir];
          const lastRun = lastRunMap[agent.id];
          const catColor = CATEGORY_COLORS[agent.category] ?? CATEGORY_COLORS.System;
          const schedule = meta?.schedule || agent.schedule;
          const agentRuns = (recentRuns ?? []).filter(r => r.routine_name === agent.id).slice(0, 5);

          return (
            <details key={agent.id} className="group card p-0 overflow-hidden">

              {/* ── Summary row (always visible) ── */}
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none hover:bg-surface-tint/40 transition-colors">
                <StatusDot status={lastRun?.status ?? null} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-ink">{agent.label}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${catColor}`}>
                      {agent.category}
                    </span>
                  </div>
                  {meta?.description && (
                    <p className="text-[11px] text-ink-muted mt-0.5 truncate max-w-2xl">{meta.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[10px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {cronToHuman(schedule)}
                  </span>
                  {meta && (meta.mcpsRequired.length + meta.mcpsOptional.length) > 0 && (
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {meta.mcpsRequired.length + meta.mcpsOptional.length} MCPs
                    </span>
                  )}
                  <span>{timeAgo(lastRun?.started_at ?? null)}</span>
                  <RunButton routine={agent.id} />
                  <svg className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              {/* ── Expanded detail ── */}
              <div className="border-t border-surface-border px-4 py-4 bg-surface-tint/20 grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Left: MCPs, refs, hooks */}
                <div className="space-y-3">

                  {meta && meta.mcpsRequired.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Cpu className="w-3 h-3 text-primary-400" />
                        <span className="text-[10px] font-bold text-ink uppercase tracking-wider">MCPs — Required</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {meta.mcpsRequired.map(m => <McpBadge key={m} name={m} required />)}
                      </div>
                    </div>
                  )}

                  {meta && meta.mcpsOptional.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Cpu className="w-3 h-3 text-ink-muted" />
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">MCPs — Optional</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {meta.mcpsOptional.map(m => <McpBadge key={m} name={m} required={false} />)}
                      </div>
                    </div>
                  )}

                  {meta && meta.references.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Link2 className="w-3 h-3 text-ink-muted" />
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">References</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {meta.references.map(r => <Chip key={r} name={r} />)}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="w-3 h-3 text-ink-muted" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Hooks (_lib)</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {LIB_HOOKS.map(h => <Chip key={h} name={h} />)}
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] font-mono text-ink-subtle">
                    skills/{agent.skillDir}/SKILL.md · cron: {schedule}
                  </div>
                </div>

                {/* Right: state files + run history */}
                <div className="space-y-3">

                  {meta && meta.inputs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Layers className="w-3 h-3 text-ink-muted" />
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Reads</span>
                      </div>
                      <div className="space-y-0.5 font-mono">
                        {meta.inputs.map(i => (
                          <div key={i} className="text-[10px] text-ink-muted">{i}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {meta && meta.outputs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Layers className="w-3 h-3 text-primary-400" />
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Writes</span>
                      </div>
                      <div className="space-y-0.5 font-mono">
                        {meta.outputs.slice(0, 7).map(o => (
                          <div key={o} className="text-[10px] text-ink-muted">{o}</div>
                        ))}
                        {meta.outputs.length > 7 && (
                          <div className="text-[10px] text-ink-subtle">+{meta.outputs.length - 7} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity className="w-3 h-3 text-ink-muted" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Recent runs</span>
                    </div>
                    {agentRuns.length === 0 ? (
                      <p className="text-[10px] text-ink-subtle">No runs recorded yet</p>
                    ) : (
                      <div className="space-y-1.5">
                        {agentRuns.map((run: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            {run.status === "success"
                              ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                              : run.status === "failed"
                              ? <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                              : <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="text-[10px] text-ink-muted shrink-0 w-16">{timeAgo(run.started_at)}</span>
                            <span className="text-[10px] text-ink flex-1 truncate">
                              {run.artifacts?.headline ?? run.error_summary ?? run.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
