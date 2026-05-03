"use client";

import { useState, useEffect } from "react";
import { Mail, Clock, GitBranch, Shuffle, Plus, Trash2, Save, ArrowDown, ToggleLeft, ToggleRight } from "lucide-react";

interface FlowStep {
  id: string;
  position: number;
  step_type: "email" | "delay" | "condition" | "split";
  subject?: string;
  preview_text?: string;
  delay_minutes?: number;
  condition_rules?: any;
  split_variants?: any;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
}

interface Flow {
  id: string;
  name: string;
  trigger_event?: string;
  is_active?: boolean;
  description?: string;
}

export function FlowBuilder({ flow, brandId, onClose }: { flow: Flow; brandId: string; onClose: () => void }) {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSteps();
  }, [flow.id]);

  async function fetchSteps() {
    setLoading(true);
    const res = await fetch(`/api/email/flows/${flow.id}/steps`);
    if (res.ok) {
      const data = await res.json();
      setSteps(data.steps ?? []);
    }
    setLoading(false);
  }

  async function addStep(type: FlowStep["step_type"]) {
    const newStep: Partial<FlowStep> = {
      step_type: type,
      position: steps.length,
      ...(type === "email" ? { subject: "New email" } : {}),
      ...(type === "delay" ? { delay_minutes: 1440 } : {}),
      ...(type === "condition" ? { condition_rules: { field: "opened_previous", op: "eq", value: true } } : {}),
      ...(type === "split" ? { split_variants: [{ weight: 50, next_step_id: null }, { weight: 50, next_step_id: null }] } : {}),
    };

    const res = await fetch(`/api/email/flows/${flow.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStep),
    });

    if (res.ok) {
      const data = await res.json();
      setSteps([...steps, data.step]);
    }
  }

  async function updateStep(stepId: string, updates: Partial<FlowStep>) {
    const res = await fetch(`/api/email/flows/${flow.id}/steps`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: stepId, ...updates }),
    });

    if (res.ok) {
      const data = await res.json();
      setSteps(steps.map((s) => (s.id === stepId ? data.step : s)));
    }
  }

  async function deleteStep(stepId: string) {
    const res = await fetch(`/api/email/flows/${flow.id}/steps?stepId=${stepId}`, { method: "DELETE" });
    if (res.ok) {
      setSteps(steps.filter((s) => s.id !== stepId));
    }
  }

  async function toggleActive() {
    const res = await fetch(`/api/email/flows/${flow.id}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !flow.is_active }),
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  const stepIcons: Record<string, any> = {
    email: Mail,
    delay: Clock,
    condition: GitBranch,
    split: Shuffle,
  };

  const stepColors: Record<string, string> = {
    email: "border-indigo-200 bg-indigo-50",
    delay: "border-amber-200 bg-amber-50",
    condition: "border-green-200 bg-green-50",
    split: "border-purple-200 bg-purple-50",
  };

  function formatDelay(minutes: number) {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  }

  if (loading) {
    return <div className="card p-8 text-center text-[var(--text-secondary)]">Loading flow...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Flow header */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{flow.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Trigger: {flow.trigger_event ?? "manual"} · {steps.length} step{steps.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${flow.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {flow.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              {flow.is_active ? "Active" : "Inactive"}
            </button>
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col items-center gap-0">
        {steps.map((step, i) => {
          const Icon = stepIcons[step.step_type] ?? Mail;
          const color = stepColors[step.step_type] ?? "";

          return (
            <div key={step.id} className="w-full max-w-md">
              {/* Step card */}
              <div className={`card p-4 border ${color}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      <Icon className="w-4 h-4 text-[var(--text-primary)]" />
                    </div>
                    <div className="flex-1">
                      {step.step_type === "email" && (
                        <div>
                          <input
                            className="text-sm font-medium text-[var(--text-primary)] bg-transparent border-none outline-none w-full"
                            value={step.subject ?? ""}
                            onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                            placeholder="Email subject..."
                          />
                          {step.sent_count != null && (
                            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                              Sent: {step.sent_count} · Opens: {step.open_count ?? 0} · Clicks: {step.click_count ?? 0}
                            </p>
                          )}
                        </div>
                      )}
                      {step.step_type === "delay" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">Wait</span>
                          <select
                            className="text-sm font-medium bg-transparent border border-[var(--border)] rounded px-2 py-0.5"
                            value={step.delay_minutes ?? 1440}
                            onChange={(e) => updateStep(step.id, { delay_minutes: Number(e.target.value) })}
                          >
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={240}>4 hours</option>
                            <option value={720}>12 hours</option>
                            <option value={1440}>1 day</option>
                            <option value={2880}>2 days</option>
                            <option value={4320}>3 days</option>
                            <option value={10080}>7 days</option>
                          </select>
                        </div>
                      )}
                      {step.step_type === "condition" && (
                        <div>
                          <p className="text-xs font-medium text-[var(--text-primary)]">
                            If: {step.condition_rules?.field ?? "condition"}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            Routes to different paths based on result
                          </p>
                        </div>
                      )}
                      {step.step_type === "split" && (
                        <div>
                          <p className="text-xs font-medium text-[var(--text-primary)]">A/B Split</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            {(step.split_variants ?? []).map((v: any) => `${v.weight}%`).join(" / ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteStep(step.id)} className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add step buttons */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <button onClick={() => addStep("email")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50">
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button onClick={() => addStep("delay")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50">
            <Clock className="w-3.5 h-3.5" /> Delay
          </button>
          <button onClick={() => addStep("condition")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-green-200 text-green-600 rounded-lg hover:bg-green-50">
            <GitBranch className="w-3.5 h-3.5" /> Condition
          </button>
          <button onClick={() => addStep("split")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50">
            <Shuffle className="w-3.5 h-3.5" /> Split
          </button>
        </div>
      </div>
    </div>
  );
}
