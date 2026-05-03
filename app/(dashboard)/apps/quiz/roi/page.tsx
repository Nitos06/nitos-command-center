"use client";

import { useState, useMemo } from "react";
import { Calculator, TrendingUp, DollarSign, Users, ShoppingCart, BarChart3 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Slider                                                             */
/* ------------------------------------------------------------------ */

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white tabular-nums">
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${pct}%, #334155 ${pct}%, #334155 100%)`,
        }}
      />
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  large,
}: {
  label: string;
  value: string;
  icon: any;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? "bg-indigo-50 border-2 border-indigo-200" : "bg-white border border-gray-200"} ${large ? "col-span-full" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-indigo-100" : "bg-gray-100"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-indigo-600" : "text-gray-500"}`} />
        </div>
        <span className={`text-xs font-medium ${accent ? "text-indigo-600" : "text-gray-500"}`}>{label}</span>
      </div>
      <p className={`font-extrabold tabular-nums ${large ? "text-4xl" : "text-2xl"} ${accent ? "text-indigo-700" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function ROICalculatorPage() {
  const [aov, setAov] = useState(85);
  const [sessions, setSessions] = useState(25000);
  const [engagementRate, setEngagementRate] = useState(12);
  const [conversionRate, setConversionRate] = useState(16);
  const [aovLift, setAovLift] = useState(20);

  const calc = useMemo(() => {
    const quizTakers = Math.round(sessions * (engagementRate / 100));
    const ordersFromQuiz = Math.round(quizTakers * (conversionRate / 100));
    const newAov = aov * (1 + aovLift / 100);
    const monthlyRevenue = ordersFromQuiz * newAov;
    const annualRevenue = monthlyRevenue * 12;
    return { quizTakers, ordersFromQuiz, newAov, monthlyRevenue, annualRevenue };
  }, [aov, sessions, engagementRate, conversionRate, aovLift]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="grid lg:grid-cols-2 gap-0 min-h-[calc(100vh-220px)] rounded-2xl overflow-hidden shadow-lg border">
      {/* Left: dark inputs */}
      <div className="bg-slate-900 p-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">ROI Calculator</h2>
          </div>
          <p className="text-sm text-gray-400">Estimate the revenue impact of adding a product recommendation quiz to your store.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Current Average Order Value</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={aov}
                onChange={e => setAov(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-4 py-3 text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Monthly Website Sessions</label>
            <input
              type="number"
              value={sessions}
              onChange={e => setSessions(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <Slider label="Quiz Engagement Rate" value={engagementRate} onChange={setEngagementRate} min={1} max={40} step={1} suffix="%" />
          <Slider label="Quiz Conversion Rate" value={conversionRate} onChange={setConversionRate} min={1} max={50} step={1} suffix="%" />
          <Slider label="AOV Lift from Personalization" value={aovLift} onChange={setAovLift} min={0} max={60} step={1} suffix="%" />
        </div>

        <p className="text-[11px] text-gray-500">
          Industry benchmarks: 8-15% engagement, 12-20% quiz conversion, 15-30% AOV lift. Adjust sliders to match your store.
        </p>
      </div>

      {/* Right: light results */}
      <div className="bg-gray-50 p-8 flex flex-col justify-center">
        <div className="space-y-3 mb-8">
          <h3 className="text-lg font-bold text-gray-900">Projected Results</h3>
          <p className="text-sm text-gray-500">Based on your inputs, here&apos;s the estimated impact.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Quiz Takers / Month" value={calc.quizTakers.toLocaleString()} icon={Users} />
          <StatCard label="Orders from Quiz / Month" value={calc.ordersFromQuiz.toLocaleString()} icon={ShoppingCart} />
          <StatCard label="New AOV" value={fmt(calc.newAov)} icon={TrendingUp} />
          <StatCard label="Monthly Quiz Revenue" value={fmt(calc.monthlyRevenue)} icon={BarChart3} />
          <StatCard label="Annual Quiz Revenue" value={fmt(calc.annualRevenue)} icon={DollarSign} accent large />
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Calculation Breakdown</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>{sessions.toLocaleString()} sessions x {engagementRate}% engagement</span>
              <span className="font-medium text-gray-900">{calc.quizTakers.toLocaleString()} quiz takers</span>
            </div>
            <div className="flex justify-between">
              <span>{calc.quizTakers.toLocaleString()} takers x {conversionRate}% conversion</span>
              <span className="font-medium text-gray-900">{calc.ordersFromQuiz.toLocaleString()} orders</span>
            </div>
            <div className="flex justify-between">
              <span>${aov} AOV + {aovLift}% lift</span>
              <span className="font-medium text-gray-900">{fmt(calc.newAov)} new AOV</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-gray-900">
              <span>{calc.ordersFromQuiz.toLocaleString()} orders x {fmt(calc.newAov)} x 12 months</span>
              <span className="text-indigo-600">{fmt(calc.annualRevenue)} / year</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
