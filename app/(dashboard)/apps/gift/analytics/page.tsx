"use client";

import { useState, useMemo } from "react";
import {
  Gift, DollarSign, TrendingUp, BarChart3, ShoppingCart, Package,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─── seed demo data ─── */
function seedDailyGifts(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().slice(0, 10),
      gifts: Math.floor(Math.random() * 30) + 5,
      revenue: Math.floor(Math.random() * 3000) + 500,
    });
  }
  return data;
}

const TOP_PRODUCTS = [
  { title: "Sample Pack", gifts: 342, revenue: 18720, rate: 68 },
  { title: "Mini Tote Bag", gifts: 218, revenue: 12540, rate: 54 },
  { title: "Travel Size Kit", gifts: 176, revenue: 9840, rate: 72 },
  { title: "Sticker Set", gifts: 145, revenue: 6320, rate: 81 },
  { title: "Lip Balm", gifts: 98, revenue: 4210, rate: 63 },
];

export default function GiftAnalyticsPage() {
  const [range] = useState(30);
  const dailyData = useMemo(() => seedDailyGifts(range), [range]);

  const totals = useMemo(() => {
    const totalGifts = dailyData.reduce((s, d) => s + d.gifts, 0);
    const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);
    return {
      totalGifts,
      totalRevenue,
      avgAovWith: 78.5,
      avgAovWithout: 52.3,
      redemptionRate: 64,
    };
  }, [dailyData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          Gift Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track gift performance across the last {range} days
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Gift}
          label="Total Gifts Given"
          value={totals.totalGifts.toLocaleString()}
          color="purple"
        />
        <KpiCard
          icon={DollarSign}
          label="Revenue from Gift Orders"
          value={`$${totals.totalRevenue.toLocaleString()}`}
          color="green"
        />
        <KpiCard
          icon={ShoppingCart}
          label="AOV with Gift vs Without"
          value={`$${totals.avgAovWith} / $${totals.avgAovWithout}`}
          sub={`+${((totals.avgAovWith / totals.avgAovWithout - 1) * 100).toFixed(0)}% uplift`}
          color="blue"
        />
        <KpiCard
          icon={TrendingUp}
          label="Gift Redemption Rate"
          value={`${totals.redemptionRate}%`}
          color="orange"
        />
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Gifts Given Per Day</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="giftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                labelFormatter={(v: string) => `Date: ${v}`}
              />
              <Area
                type="monotone"
                dataKey="gifts"
                stroke="#9333ea"
                fill="url(#giftGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-500" />
            Top Gift Products
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3 text-right">Gifts Given</th>
              <th className="px-5 py-3 text-right">Associated Revenue</th>
              <th className="px-5 py-3 text-right">Redemption Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TOP_PRODUCTS.map((p) => (
              <tr key={p.title} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{p.title}</td>
                <td className="px-5 py-3 text-right text-gray-600">{p.gifts}</td>
                <td className="px-5 py-3 text-right text-gray-600">${p.revenue.toLocaleString()}</td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`font-medium ${
                      p.rate >= 70 ? "text-green-600" : p.rate >= 50 ? "text-yellow-600" : "text-red-500"
                    }`}
                  >
                    {p.rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
    </div>
  );
}
