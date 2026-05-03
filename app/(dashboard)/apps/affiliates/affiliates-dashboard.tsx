"use client";

import { useState } from "react";
import {
  Users, TrendingUp, DollarSign, MousePointerClick, ArrowUpRight,
  Plus, CreditCard, Eye, Activity, UserPlus, FileText, ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface KPIs {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  commissionOwed: number;
}

interface Props {
  brandId: string;
  kpis: KPIs;
  recentConversions: any[];
  programCount: number;
}

function KPICard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub?: string;
}) {
  const bg = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    rose: "bg-rose-50 text-rose-600",
  }[color] ?? "bg-gray-50 text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved" ? "bg-green-100 text-green-700" :
    status === "pending" ? "bg-amber-100 text-amber-700" :
    status === "denied" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

export default function AffiliatesDashboard({ brandId, kpis, recentConversions, programCount }: Props) {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const quickActions = [
    { label: "Invite Affiliate", icon: UserPlus, href: "/apps/affiliates/reach-out", color: "bg-indigo-600 hover:bg-indigo-700" },
    { label: "Create Program", icon: Plus, href: "/apps/affiliates/programs", color: "bg-purple-600 hover:bg-purple-700" },
    { label: "View Payouts", icon: CreditCard, href: "/apps/affiliates/payouts", color: "bg-green-600 hover:bg-green-700" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Affiliates" value={fmt(kpis.totalAffiliates)} icon={Users} color="indigo" sub={`${programCount} program${programCount !== 1 ? "s" : ""}`} />
        <KPICard label="Active Affiliates" value={fmt(kpis.activeAffiliates)} icon={Activity} color="green" sub={`${kpis.totalAffiliates > 0 ? Math.round(kpis.activeAffiliates / kpis.totalAffiliates * 100) : 0}% of total`} />
        <KPICard label="30d Clicks" value={fmt(kpis.totalClicks)} icon={MousePointerClick} color="blue" />
        <KPICard label="30d Conversions" value={fmt(kpis.totalConversions)} icon={TrendingUp} color="amber" sub={kpis.totalClicks > 0 ? `${(kpis.totalConversions / kpis.totalClicks * 100).toFixed(1)}% rate` : ""} />
        <KPICard label="30d Revenue" value={money(kpis.totalRevenue)} icon={DollarSign} color="purple" />
        <KPICard label="Commission Owed" value={money(kpis.commissionOwed)} icon={CreditCard} color="rose" sub="Pending payouts" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(a => (
            <Link key={a.label} href={a.href}>
              <button className={`${a.color} text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2`}>
                <a.icon size={16} />
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Recent Conversions</h3>
          <Link href="/apps/affiliates/analytics" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View Analytics <ChevronRight size={14} />
          </Link>
        </div>
        {recentConversions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Activity className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-sm text-gray-500">No conversions yet</p>
            <p className="text-xs text-gray-400 mt-1">Conversions will appear here as affiliates drive sales</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentConversions.map((c: any, i: number) => (
              <div key={c.id || i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight size={14} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.customer_name || c.customer_email || "Customer"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.affiliate_name || "Affiliate"} &middot; {c.converted_at ? new Date(c.converted_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{money(Number(c.revenue) || 0)}</p>
                    <p className="text-xs text-gray-400">{money(Number(c.commission) || 0)} comm.</p>
                  </div>
                  <StatusBadge status={c.status || "pending"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/apps/affiliates/programs" className="block">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <FileText size={24} className="mb-3 opacity-80" />
            <h4 className="font-semibold mb-1">Programs</h4>
            <p className="text-sm text-indigo-100">Manage {programCount} affiliate programs, commission rates, and cookie settings</p>
          </div>
        </Link>
        <Link href="/apps/affiliates/motivation" className="block">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <Activity size={24} className="mb-3 opacity-80" />
            <h4 className="font-semibold mb-1">Motivation</h4>
            <p className="text-sm text-amber-100">Leaderboards, tiers, achievement badges, and gamification tools</p>
          </div>
        </Link>
        <Link href="/apps/affiliates/reach-out" className="block">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <UserPlus size={24} className="mb-3 opacity-80" />
            <h4 className="font-semibold mb-1">Reach Out</h4>
            <p className="text-sm text-green-100">Recruit new affiliates with templates, bulk invites, and social sharing</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
