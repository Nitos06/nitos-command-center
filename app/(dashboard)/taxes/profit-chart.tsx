"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ProfitPoint { month: string; revenue: number; expenses: number; profit: number }

export function ProfitChart({ data }: { data: ProfitPoint[] }) {
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-sm text-ink-muted">
      No data yet — profit data will appear here once the finance agent runs.
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
        <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
        <Area type="monotone" dataKey="revenue" stroke="#6366F1" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
        <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
