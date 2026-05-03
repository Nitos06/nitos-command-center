"use client";

import { useState } from "react";
import {
  Trophy, Medal, Star, Crown, Gem, Target, Zap, Flame, Award,
  TrendingUp, Gift, DollarSign, Users, ChevronUp, ChevronDown,
  Edit2, Save, X, Sparkles, Shield, Heart, Rocket, BadgeCheck,
} from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  revenue: number;
  conversions: number;
  commission: number;
  points: number;
}

interface Props {
  brandId: string;
  leaderboard: LeaderboardEntry[];
  motivation: any[];
  totalAffiliates: number;
}

const TIERS = [
  { name: "Bronze", color: "from-amber-600 to-amber-800", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", icon: Shield, threshold: 0 },
  { name: "Silver", color: "from-gray-400 to-gray-600", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", icon: Medal, threshold: 1000 },
  { name: "Gold", color: "from-yellow-400 to-yellow-600", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-400", icon: Crown, threshold: 5000 },
  { name: "Diamond", color: "from-cyan-400 to-blue-600", bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-400", icon: Gem, threshold: 15000 },
];

const ACHIEVEMENTS = [
  { id: "first_sale", name: "First Sale", description: "Made your first conversion", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50", condition: (e: LeaderboardEntry) => e.conversions >= 1 },
  { id: "ten_sales", name: "10 Sales Club", description: "Reached 10 total conversions", icon: Target, color: "text-blue-500", bg: "bg-blue-50", condition: (e: LeaderboardEntry) => e.conversions >= 10 },
  { id: "fifty_sales", name: "50 Sales Milestone", description: "Reached 50 total conversions", icon: Flame, color: "text-orange-500", bg: "bg-orange-50", condition: (e: LeaderboardEntry) => e.conversions >= 50 },
  { id: "hundred_sales", name: "Century Mark", description: "Reached 100 total conversions", icon: Rocket, color: "text-purple-500", bg: "bg-purple-50", condition: (e: LeaderboardEntry) => e.conversions >= 100 },
  { id: "1k_revenue", name: "$1K Revenue", description: "Generated $1,000+ in revenue", icon: DollarSign, color: "text-green-500", bg: "bg-green-50", condition: (e: LeaderboardEntry) => e.revenue >= 1000 },
  { id: "5k_revenue", name: "$5K Revenue", description: "Generated $5,000+ in revenue", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", condition: (e: LeaderboardEntry) => e.revenue >= 5000 },
  { id: "10k_revenue", name: "$10K Revenue", description: "Generated $10,000+ in revenue", icon: Crown, color: "text-amber-500", bg: "bg-amber-50", condition: (e: LeaderboardEntry) => e.revenue >= 10000 },
  { id: "top_performer", name: "Top Performer", description: "Ranked #1 on the leaderboard", icon: Trophy, color: "text-indigo-500", bg: "bg-indigo-50", condition: (_: LeaderboardEntry, rank: number) => rank === 0 },
  { id: "consistent", name: "Consistent Closer", description: "Earned $500+ in commission", icon: BadgeCheck, color: "text-teal-500", bg: "bg-teal-50", condition: (e: LeaderboardEntry) => e.commission >= 500 },
  { id: "super_affiliate", name: "Super Affiliate", description: "25K+ points earned", icon: Sparkles, color: "text-pink-500", bg: "bg-pink-50", condition: (e: LeaderboardEntry) => e.points >= 25000 },
  { id: "high_roller", name: "High Roller", description: "Generated $25,000+ in revenue", icon: Gem, color: "text-cyan-500", bg: "bg-cyan-50", condition: (e: LeaderboardEntry) => e.revenue >= 25000 },
  { id: "community_builder", name: "Community Builder", description: "Part of a program with 10+ affiliates", icon: Heart, color: "text-rose-500", bg: "bg-rose-50", condition: () => false },
];

function getTier(revenue: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (revenue >= TIERS[i].threshold) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(revenue: number) {
  for (const tier of TIERS) {
    if (revenue < tier.threshold) return tier;
  }
  return null;
}

export default function MotivationHub({ brandId, leaderboard, motivation, totalAffiliates }: Props) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "tiers" | "achievements" | "points">("leaderboard");
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const [editingTiers, setEditingTiers] = useState(false);
  const [tierThresholds, setTierThresholds] = useState(TIERS.map(t => t.threshold));

  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const tabs = [
    { key: "leaderboard", label: "Leaderboard", icon: Trophy },
    { key: "tiers", label: "Tiers", icon: Crown },
    { key: "achievements", label: "Achievements", icon: Award },
    { key: "points", label: "Points", icon: Star },
  ] as const;

  const topThree = leaderboard.slice(0, 3);

  // Selected affiliate for achievement view
  const selectedEntry = leaderboard.find(e => e.id === selectedAffiliate) || leaderboard[0];
  const selectedRank = selectedEntry ? leaderboard.indexOf(selectedEntry) : -1;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Motivation Hub</h2>
              <p className="text-sm text-white/70">Gamify your affiliate program to drive performance</p>
            </div>
          </div>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{totalAffiliates}</p>
              <p className="text-xs text-white/60">Active Affiliates</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{money(leaderboard.reduce((s, e) => s + e.revenue, 0))}</p>
              <p className="text-xs text-white/60">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{leaderboard.reduce((s, e) => s + e.points, 0).toLocaleString()}</p>
              <p className="text-xs text-white/60">Points Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-1.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === t.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Podium - Top 3 */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map(idx => {
                const entry = topThree[idx];
                if (!entry) return <div key={idx} />;
                const tier = getTier(entry.revenue);
                const isFirst = idx === 0;
                return (
                  <div
                    key={entry.id}
                    className={`relative bg-white rounded-2xl border-2 ${isFirst ? "border-yellow-400 shadow-lg shadow-yellow-100" : "border-gray-200"} p-5 text-center ${isFirst ? "scale-105 -mt-2" : ""} transition-transform`}
                  >
                    {isFirst && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-0.5 rounded-full">
                          #1
                        </div>
                      </div>
                    )}
                    <div className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-lg font-bold mb-3 shadow-lg`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>
                        {tier.name}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{money(entry.revenue)}</p>
                    <p className="text-xs text-gray-400">{entry.conversions} conversions</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-yellow-500">
                      <Star size={12} className="fill-yellow-400" />
                      <span className="text-xs font-medium">{entry.points.toLocaleString()} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Full Rankings</h3>
            </div>
            {leaderboard.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Trophy className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm text-gray-500">No affiliates with conversions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry, i) => {
                  const tier = getTier(entry.revenue);
                  const TierIcon = tier.icon;
                  return (
                    <div key={entry.id} className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-8 text-center flex-shrink-0">
                        {i < 3 ? (
                          <span className={`text-sm font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"}`}>
                            {i === 0 ? <Crown size={18} className="inline" /> : i === 1 ? <Medal size={18} className="inline" /> : <Award size={18} className="inline" />}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">#{i + 1}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 ml-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
                          <p className="text-xs text-gray-400 truncate">{entry.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.text} flex-shrink-0 mx-3`}>
                        <TierIcon size={10} className="inline mr-0.5" />
                        {tier.name}
                      </span>
                      <div className="text-right flex-shrink-0 w-24">
                        <p className="text-sm font-semibold text-gray-900">{money(entry.revenue)}</p>
                        <p className="text-xs text-gray-400">{entry.conversions} conv.</p>
                      </div>
                      <div className="text-right flex-shrink-0 w-20 ml-4">
                        <div className="flex items-center justify-end gap-1 text-yellow-500">
                          <Star size={12} className="fill-yellow-400" />
                          <span className="text-xs font-medium">{entry.points.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Tier Thresholds</h3>
              <p className="text-sm text-gray-500 mt-0.5">Configure revenue thresholds for each affiliate tier</p>
            </div>
            {!editingTiers ? (
              <button
                onClick={() => setEditingTiers(true)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Edit2 size={14} /> Edit Thresholds
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingTiers(false); setTierThresholds(TIERS.map(t => t.threshold)); }}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setEditingTiers(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier, i) => {
              const TierIcon = tier.icon;
              const affiliatesInTier = leaderboard.filter(e => {
                const t = getTier(e.revenue);
                return t.name === tier.name;
              }).length;
              return (
                <div
                  key={tier.name}
                  className={`relative overflow-hidden bg-white rounded-2xl border-2 ${tier.border} p-5 shadow-sm`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tier.color}`} />
                  <div className="flex items-center gap-3 mb-4 mt-1">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                      <TierIcon size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{tier.name}</h4>
                      <p className="text-xs text-gray-400">{affiliatesInTier} affiliate{affiliatesInTier !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Revenue Threshold</label>
                      {editingTiers ? (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm text-gray-400">$</span>
                          <input
                            type="number"
                            value={tierThresholds[i]}
                            onChange={e => {
                              const updated = [...tierThresholds];
                              updated[i] = Number(e.target.value);
                              setTierThresholds(updated);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                          {i === 0 ? "Starting tier" : `${money(tier.threshold)}+`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-full h-2 rounded-full bg-gray-100 overflow-hidden`}>
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
                          style={{ width: `${totalAffiliates > 0 ? Math.max(5, (affiliatesInTier / totalAffiliates) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {totalAffiliates > 0 ? Math.round((affiliatesInTier / totalAffiliates) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tier Progression Visual */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Tier Progression Path</h4>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
              {TIERS.map((tier, i) => {
                const TierIcon = tier.icon;
                return (
                  <div key={tier.name} className="relative z-10 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg mb-2`}>
                      <TierIcon size={20} />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{tier.name}</span>
                    <span className="text-[10px] text-gray-400">{i === 0 ? "$0" : money(tier.threshold)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="space-y-6">
          {/* Affiliate Selector */}
          {leaderboard.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-700 mb-2 block">View achievements for:</label>
              <select
                value={selectedAffiliate || leaderboard[0]?.id || ""}
                onChange={e => setSelectedAffiliate(e.target.value)}
                className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {leaderboard.map(e => (
                  <option key={e.id} value={e.id}>{e.name} - {money(e.revenue)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map(ach => {
              const AchIcon = ach.icon;
              const unlocked = selectedEntry ? ach.condition(selectedEntry, selectedRank) : false;
              return (
                <div
                  key={ach.id}
                  className={`relative rounded-xl border-2 p-4 transition-all ${
                    unlocked
                      ? `${ach.bg} border-current shadow-sm`
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${unlocked ? ach.bg : "bg-gray-100"} flex-shrink-0`}>
                      <AchIcon size={22} className={unlocked ? ach.color : "text-gray-400"} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${unlocked ? "text-gray-900" : "text-gray-500"}`}>{ach.name}</h4>
                        {unlocked && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">UNLOCKED</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                  {unlocked && (
                    <div className="absolute top-2 right-2">
                      <Sparkles size={16} className="text-yellow-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {leaderboard.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Award className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-sm text-gray-500 font-medium">No affiliate data yet</p>
              <p className="text-xs text-gray-400 mt-1">Achievements unlock as affiliates drive conversions</p>
            </div>
          )}
        </div>
      )}

      {/* Points Tab */}
      {activeTab === "points" && (
        <div className="space-y-6">
          {/* Points Explainer */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-5">
            <div className="flex items-start gap-3">
              <Star size={24} className="text-yellow-500 fill-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">How Points Work</h3>
                <p className="text-sm text-gray-600 mt-1">Affiliates earn 10 points for every $1 of approved revenue they generate. Points determine tier advancement and unlock achievement badges.</p>
                <div className="flex gap-6 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">$1 Revenue</p>
                    <p className="text-sm font-bold text-yellow-600">= 10 pts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">$100 Revenue</p>
                    <p className="text-sm font-bold text-yellow-600">= 1,000 pts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">$1,000 Revenue</p>
                    <p className="text-sm font-bold text-yellow-600">= 10,000 pts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Points Leaderboard */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Points Leaderboard</h3>
            </div>
            {leaderboard.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Star className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm text-gray-500">No points earned yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard
                  .sort((a, b) => b.points - a.points)
                  .map((entry, i) => {
                    const tier = getTier(entry.revenue);
                    const nextTier = getNextTier(entry.revenue);
                    const progress = nextTier
                      ? ((entry.revenue - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100
                      : 100;
                    return (
                      <div key={entry.id} className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-8 text-center flex-shrink-0">
                          <span className={`text-sm font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-400"}`}>
                            #{i + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0 ml-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[120px]">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                              {nextTier && (
                                <span className="text-[10px] text-gray-400">{money(entry.revenue)} / {money(nextTier.threshold)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                          <Star size={16} className="fill-yellow-400" />
                          <span className="text-sm font-bold">{entry.points.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
