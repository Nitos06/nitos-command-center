"use client";

import { useState } from "react";
import { MessageSquare, BookOpen, Bot } from "lucide-react";
import { TicketsChart } from "./tickets-chart";

const TABS = [
  { id: "tickets",  label: "Tickets",      icon: MessageSquare },
  { id: "faq",      label: "FAQ Library",  icon: BookOpen      },
  { id: "activity", label: "Agent Log",    icon: Bot           },
] as const;

type TabId = typeof TABS[number]["id"];

interface Props {
  brandId: string | null;
  open: any[];
  faq: any[];
  recentLogs: any[];
  chartData: any[];
  chatbotTickets: any[];
  appUrl: string;
}

export function CSTabNav({ brandId, open, faq, recentLogs, chartData, chatbotTickets, appUrl }: Props) {
  const [tab, setTab] = useState<TabId>("tickets");

  return (
    <>
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? "bg-primary-500/15 text-primary-400 border border-primary-500/20" : "text-ink-muted hover:text-ink border border-transparent hover:border-surface-border"}`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TICKETS ── */}
      {tab === "tickets" && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-ink mb-3">Tickets — last 14 days</h2>
            <TicketsChart data={chartData} />
          </div>

          <div className="card">
            <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Open tickets ({open.length})
            </h2>
            {open.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">No open tickets. Connect Gmail/IG from Settings to pull tickets automatically.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-ink-muted text-xs">
                  <tr><th className="py-1.5">Customer</th><th>Channel</th><th>Subject</th><th>Priority</th><th>Opened</th></tr>
                </thead>
                <tbody>
                  {open.map((t: any) => (
                    <tr key={t.id} className="border-t border-surface-border">
                      <td className="py-1.5">
                        <div className="font-medium text-ink text-xs">{t.customer_name || t.customer_email || "—"}</div>
                      </td>
                      <td className="text-ink-muted text-xs">{t.channel}</td>
                      <td className="text-xs text-ink truncate max-w-[200px]">{t.subject ?? "(no subject)"}</td>
                      <td><span className={t.priority === "urgent" ? "badge-crit" : t.priority === "high" ? "badge-warn" : "badge-primary"}>{t.priority ?? "normal"}</span></td>
                      <td className="text-ink-muted text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      {tab === "faq" && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              FAQ library ({faq.length} entries)
            </h2>
          </div>
          {faq.length === 0 ? (
            <p className="text-sm text-ink-muted py-6 text-center">No FAQ entries yet. The CS agent will populate these. You can also add them directly via Supabase → cs_faq.</p>
          ) : (
            <ul className="space-y-2 max-h-[600px] overflow-y-auto">
              {faq.map((f: any) => (
                <li key={f.id} className="px-3 py-2.5 rounded-xl bg-surface-tint border border-surface-border">
                  <div className="font-medium text-ink text-xs leading-snug">{f.question}</div>
                  <div className="text-ink-muted text-xs mt-1 leading-relaxed">{f.answer}</div>
                  <div className="text-ink-subtle text-[10px] mt-1.5 flex gap-3">
                    <span>Used {f.times_used ?? 0}×</span>
                    {f.channel && <span>{f.channel}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── AGENT LOG ── */}
      {tab === "activity" && (
        <div className="card">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary-500" />
            Agent activity log ({recentLogs.length} entries)
          </h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-ink-muted">No activity yet. Agent runs every 30 min between 09:00–22:00.</p>
          ) : (
            <ul className="space-y-2 max-h-[500px] overflow-y-auto">
              {recentLogs.map((log: any) => (
                <li key={log.id} className="text-xs border-l-2 border-primary-200 pl-2 py-0.5">
                  <div className="text-ink-muted">
                    {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    <span className={log.type === "error" ? "text-red-500" : log.type === "action" ? "text-green-600" : "text-ink-muted"}>
                      {log.type}
                    </span>
                  </div>
                  <div className="text-ink leading-snug mt-0.5">{log.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
