"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DayPoint { date: string; openRate: number; clickRate: number; bounceRate: number; sent: number }

export function DeliverabilityChart({ data }: { data: DayPoint[] }) {
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-sm text-ink-muted">
      No deliverability data yet — appears once SES starts sending.
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={32} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Line type="monotone" dataKey="openRate" stroke="#6366F1" strokeWidth={2} dot={false} name="Open %" />
        <Line type="monotone" dataKey="clickRate" stroke="#22c55e" strokeWidth={2} dot={false} name="Click %" />
        <Line type="monotone" dataKey="bounceRate" stroke="#f87171" strokeWidth={1.5} dot={false} name="Bounce %" />
      </LineChart>
    </ResponsiveContainer>
  );
}
