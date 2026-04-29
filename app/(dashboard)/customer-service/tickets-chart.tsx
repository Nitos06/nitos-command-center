"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface DayData { day: string; opened: number; resolved: number }

export function TicketsChart({ data }: { data: DayData[] }) {
  if (!data.length) return (
    <div className="h-36 flex items-center justify-center text-sm text-ink-muted">
      No ticket history yet.
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={28} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="opened" fill="#6366F1" name="Opened" radius={[2, 2, 0, 0]} />
        <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
