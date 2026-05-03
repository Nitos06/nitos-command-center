"use client";

import { useState } from "react";
import {
  BarChart2, TrendingUp, DollarSign, MousePointerClick, Target,
  Calculator, PieChart as PieChartIcon, ArrowUpRight, Percent,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Area, AreaChart,
} from "recharts";

interface ChartDay {
  date: string;
  label: string;
  clicks: number;
  conversions: number;
  revenue: number;
  rate: number;
}

interface TopAffiliate {
  name: string;
  revenue: number;
  commission: number;
  conversions: number;
}

interface Props {
  brandId: string;
  chartData: ChartDay[];
  topAffiliates: TopAffiliate[];
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
}

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#d8b4fe", "#818cf8", "#6ee7b7", "#34d399", "#fbbf24", "#f87171"];

export default function AnalyticsDashboard({
  brandId, chartData, topAffiliates, totalClicks, totalConversions, totalRevenue, totalCommission,
}: Props) {
  const [roiAdSpend, setRoiAdSpend] = useState(1000);
  const [roiAdConversions, setRoiAdConversions] = useState(10);

  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00";

  // ROI calculations
  const adCPA = roiAdConversions > 0 ? roiAdSpend / roiAdConversions : 0;
  const affCPA = totalConversions > 0 ? totalCommission / totalConversions : 0;
  const adROAS = roiAdConversions > 0 && roiAdSpend > 0 ? (totalRevenue / totalConversions * roiAdConversions) / roiAdSpend : 0;
  const affROAS = totalCommission > 0 ? totalRevenue / totalCommission : 0;

  // Pie chart data for commission vs revenue
  const pieData = [
    { name: "Net Revenue", value: Math.max(0, totalRevenue - totalCommission) },
    { name: "Commission Paid", value: totalCommission },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <MousePointerClick size={16} />
            <span className="text-xs font-medium">30d Clicks</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-medium">30d Conversions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalConversions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-medium">30d Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Target size={16} />
            <span className="text-xs font-medium">Conv. Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{convRate}%</p>
        </div>
      </div>

      {/* Clicks vs Conversions Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Clicks vs Conversions (Last 30 Days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} interval={4} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                formatter={(value: number, name: string) =>
                  name === "Revenue" ? [money(value), name] : [value, name]
                }
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} dot={false} name="Clicks" />
              <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue per Affiliate Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue per Affiliate (Top 10)</h3>
          {topAffiliates.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAffiliates} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={75}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    formatter={(value: number) => [money(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Conversion Rate Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Conversion Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  formatter={(value: number) => [`${value}%`, "Conv. Rate"]}
                />
                <Area type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} fill="url(#rateGrad)" name="Conv. Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI Calculator */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">ROI Calculator: Ads vs Affiliates</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Compare your ad spend ROI with affiliate commission ROI</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ad Spend ($)</label>
              <input
                type="number"
                value={roiAdSpend}
                onChange={e => setRoiAdSpend(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ad Conversions</label>
              <input
                type="number"
                value={roiAdConversions}
                onChange={e => setRoiAdConversions(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-orange-600 font-medium mb-2">Paid Ads</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">CPA</span>
                  <span className="font-semibold text-gray-900">{money(adCPA)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">ROAS</span>
                  <span className="font-semibold text-gray-900">{adROAS.toFixed(2)}x</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-2">Affiliates</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">CPA</span>
                  <span className="font-semibold text-gray-900">{money(affCPA)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">ROAS</span>
                  <span className="font-semibold text-gray-900">{affROAS.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>

          {affCPA > 0 && adCPA > 0 && (
            <div className={`mt-3 p-3 rounded-lg text-xs font-medium ${
              affCPA < adCPA
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {affCPA < adCPA
                ? `Affiliates are ${((1 - affCPA / adCPA) * 100).toFixed(0)}% cheaper per conversion than ads`
                : `Ads are ${((1 - adCPA / affCPA) * 100).toFixed(0)}% cheaper per conversion than affiliates`
              }
            </div>
          )}
        </div>

        {/* Commission vs Revenue Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={18} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Commission vs Revenue</h3>
          </div>
          {totalRevenue === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No revenue data yet</div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(value: number) => [money(value)]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Total Revenue</p>
                  <p className="text-sm font-bold text-gray-900">{money(totalRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Commission</p>
                  <p className="text-sm font-bold text-amber-600">{money(totalCommission)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Margin</p>
                  <p className="text-sm font-bold text-indigo-600">
                    {totalRevenue > 0 ? `${((1 - totalCommission / totalRevenue) * 100).toFixed(1)}%` : "0%"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
