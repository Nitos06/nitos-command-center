"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, DollarSign, ShoppingCart, Package, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

/* ─── sample data ─── */
const REVENUE_BY_TYPE = [
  { type: "Fixed", revenue: 12480, color: "#3b82f6" },
  { type: "FBT", revenue: 18920, color: "#8b5cf6" },
  { type: "Volume", revenue: 15340, color: "#f59e0b" },
  { type: "BOGO", revenue: 7260, color: "#22c55e" },
];

const AOV_IMPACT = [
  { label: "Before Bundles", aov: 42.5, color: "#94a3b8" },
  { label: "After Bundles", aov: 67.8, color: "#4f46e5" },
];

const TOP_BUNDLES = [
  { name: "Skincare Routine", type: "FBT", typeColor: "bg-purple-100 text-purple-700", orders: 167, revenue: 8340 },
  { name: "Protein Powder Volume", type: "Volume", typeColor: "bg-amber-100 text-amber-700", orders: 102, revenue: 6120 },
  { name: "Summer Essentials Pack", type: "Fixed", typeColor: "bg-blue-100 text-blue-700", orders: 89, revenue: 4520 },
  { name: "Buy 2 Get 1 Socks", type: "BOGO", typeColor: "bg-green-100 text-green-700", orders: 145, revenue: 2180 },
  { name: "Home Office Bundle", type: "Fixed", typeColor: "bg-blue-100 text-blue-700", orders: 56, revenue: 3920 },
];

const TOTAL_REVENUE = REVENUE_BY_TYPE.reduce((s, r) => s + r.revenue, 0);
const TOTAL_ORDERS = TOP_BUNDLES.reduce((s, b) => s + b.orders, 0);
const AOV_LIFT = ((AOV_IMPACT[1].aov - AOV_IMPACT[0].aov) / AOV_IMPACT[0].aov * 100).toFixed(1);

function StatCard({ label, value, change, positive, icon: Icon }: {
  label: string; value: string; change: string; positive: boolean; icon: any;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
        {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {change} vs last 30d
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-gray-700">{label || payload[0]?.payload?.type || payload[0]?.payload?.label}</div>
      <div className="text-gray-500 mt-0.5">
        ${payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

export default function BundleAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Bundle Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performance overview for the last 30 days</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Bundle Revenue"
          value={`$${TOTAL_REVENUE.toLocaleString()}`}
          change="+18.3%"
          positive
          icon={DollarSign}
        />
        <StatCard
          label="Bundle Orders"
          value={TOTAL_ORDERS.toLocaleString()}
          change="+12.7%"
          positive
          icon={ShoppingCart}
        />
        <StatCard
          label="AOV Lift"
          value={`+${AOV_LIFT}%`}
          change="+5.2pp"
          positive
          icon={TrendingUp}
        />
        <StatCard
          label="Active Bundles"
          value="4"
          change="+1"
          positive
          icon={Package}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by bundle type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Bundle Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_BY_TYPE} barSize={48}>
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {REVENUE_BY_TYPE.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AOV impact */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">AOV Impact (Before vs After Bundles)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AOV_IMPACT} barSize={64}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                  domain={[0, 80]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="aov" radius={[6, 6, 0, 0]}>
                  {AOV_IMPACT.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              +{AOV_LIFT}% AOV increase with bundles
            </span>
          </div>
        </div>
      </div>

      {/* Top bundles table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Top 5 Bundles (30 Days)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">#</th>
              <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Bundle Name</th>
              <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Orders</th>
              <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {TOP_BUNDLES.map((b, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-xs font-bold text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-800">{b.name}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.typeColor}`}>
                    {b.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-gray-700 text-right">{b.orders}</td>
                <td className="px-5 py-3 text-sm font-semibold text-gray-700 text-right">${b.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
