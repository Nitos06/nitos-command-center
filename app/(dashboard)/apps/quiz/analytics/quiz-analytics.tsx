"use client";

import { useState, useMemo } from "react";
import {
  BarChart3, Users, CheckCircle2, Mail, DollarSign, TrendingUp,
  ChevronDown, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  brandId: string;
  quizzes: { id: string; name: string }[];
  responses: any[];
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Funnel Step                                                        */
/* ------------------------------------------------------------------ */

function FunnelStep({
  label,
  count,
  total,
  color,
  isLast,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  isLast?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600 truncate">{label}</span>
          <span className="text-xs font-bold text-gray-900 tabular-nums">{count.toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">{pct}% of starts</p>
      </div>
      {!isLast && <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function QuizAnalytics({ brandId, quizzes, responses }: Props) {
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedQuiz === "all") return responses;
    return responses.filter(r => r.quiz_id === selectedQuiz);
  }, [responses, selectedQuiz]);

  /* KPIs */
  const starts = filtered.length;
  const completed = filtered.filter(r => r.status === "completed" || r.completed_at).length;
  const completionRate = starts > 0 ? Math.round((completed / starts) * 100) : 0;
  const emailCaptured = filtered.filter(r => r.email).length;
  const emailPct = starts > 0 ? Math.round((emailCaptured / starts) * 100) : 0;
  const revenue = filtered.reduce((sum: number, r: any) => sum + (r.revenue ?? 0), 0);

  /* Funnel steps */
  const reachedQ2 = filtered.filter(r => (r.answers_count ?? r.answers?.length ?? 0) >= 2).length;
  const reachedQ3 = filtered.filter(r => (r.answers_count ?? r.answers?.length ?? 0) >= 3).length;
  const purchased = filtered.filter(r => r.purchased).length;

  const funnelSteps = [
    { label: "Started", count: starts, color: "bg-indigo-500" },
    { label: "Reached Q2", count: reachedQ2, color: "bg-indigo-400" },
    { label: "Reached Q3", count: reachedQ3, color: "bg-violet-400" },
    { label: "Completed", count: completed, color: "bg-purple-500" },
    { label: "Email Captured", count: emailCaptured, color: "bg-fuchsia-500" },
    { label: "Purchased", count: purchased, color: "bg-pink-500" },
  ];

  /* Daily chart data (last 14 days) */
  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; starts: number; completed: number }> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key, starts: 0, completed: 0 };
    }
    filtered.forEach((r: any) => {
      const key = (r.created_at ?? "").slice(0, 10);
      if (days[key]) {
        days[key].starts++;
        if (r.status === "completed" || r.completed_at) days[key].completed++;
      }
    });
    return Object.values(days).map(d => ({
      ...d,
      label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Quiz selector */}
      {quizzes.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Quiz:</span>
          <div className="relative">
            <select
              value={selectedQuiz}
              onChange={e => setSelectedQuiz(e.target.value)}
              className="appearance-none bg-white border rounded-lg pl-3 pr-8 py-1.5 text-sm font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Quizzes</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Quiz Starts" value={starts.toLocaleString()} sub="Last 30 days" icon={Users} color="bg-indigo-500" />
        <KpiCard label="Completion Rate" value={`${completionRate}%`} sub={`${completed} completed`} icon={CheckCircle2} color="bg-purple-500" />
        <KpiCard label="Email Opt-In" value={`${emailPct}%`} sub={`${emailCaptured} emails captured`} icon={Mail} color="bg-fuchsia-500" />
        <KpiCard label="Quiz Revenue" value={`$${revenue.toLocaleString()}`} sub="Attributed to quiz" icon={DollarSign} color="bg-emerald-500" />
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" /> Quiz Funnel
        </h3>
        <div className="flex items-end gap-3">
          {funnelSteps.map((s, i) => (
            <FunnelStep
              key={s.label}
              label={s.label}
              count={s.count}
              total={starts}
              color={s.color}
              isLast={i === funnelSteps.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> Daily Starts (14 days)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} barGap={2}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="starts" name="Starts" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {dailyData.map((_, i) => (
                  <Cell key={i} fill="#6366f1" />
                ))}
              </Bar>
              <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {dailyData.map((_, i) => (
                  <Cell key={i} fill="#a78bfa" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {starts === 0 && (
        <div className="text-center py-16">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-600">No quiz data yet</h3>
          <p className="text-xs text-gray-400 mt-1">Publish your quiz and start collecting responses to see analytics here.</p>
        </div>
      )}
    </div>
  );
}
