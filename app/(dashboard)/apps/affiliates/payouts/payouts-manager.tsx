"use client";

import { useState, useMemo } from "react";
import {
  DollarSign, Clock, CheckCircle2, CreditCard, Download, Filter,
  Search, Check, X, AlertTriangle, ArrowUpRight, Banknote, Wallet,
} from "lucide-react";

interface Payout {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  amount: number;
  period_start?: string;
  period_end?: string;
  status: string;
  created_at: string;
  paid_at?: string;
  method?: string;
}

interface Props {
  brandId: string;
  payouts: Payout[];
  summary: { pending: number; approved: number; paidThisMonth: number };
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "paid" ? "bg-green-100 text-green-700" :
    status === "approved" ? "bg-blue-100 text-blue-700" :
    status === "pending" ? "bg-amber-100 text-amber-700" :
    status === "rejected" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

export default function PayoutsManager({ brandId, payouts: initialPayouts, summary }: Props) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "paid">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const filtered = useMemo(() => {
    return payouts.filter(p => {
      if (filter !== "all" && p.status !== filter) return false;
      if (search && !p.affiliate_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [payouts, filter, search]);

  const pendingPayouts = filtered.filter(p => p.status === "pending");
  const allPendingSelected = pendingPayouts.length > 0 && pendingPayouts.every(p => selected.has(p.id));

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingPayouts.map(p => p.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const ids = Array.from(selected);
      await fetch("/api/affiliates/payouts/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, brand_id: brandId }),
      });
      setPayouts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: "approved" } : p));
      setSelected(new Set());
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Affiliate", "Amount", "Status", "Period", "Created", "Paid"];
    const rows = filtered.map(p => [
      p.affiliate_name,
      p.amount,
      p.status,
      p.period_start && p.period_end ? `${p.period_start} - ${p.period_end}` : "",
      p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
      p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate-payouts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filters = [
    { key: "all", label: "All", count: payouts.length },
    { key: "pending", label: "Pending", count: payouts.filter(p => p.status === "pending").length },
    { key: "approved", label: "Approved", count: payouts.filter(p => p.status === "approved").length },
    { key: "paid", label: "Paid", count: payouts.filter(p => p.status === "paid").length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Total Pending</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(summary.pending)}</p>
          <p className="text-xs text-gray-400 mt-1">{payouts.filter(p => p.status === "pending").length} payouts waiting</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Total Approved</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(summary.approved)}</p>
          <p className="text-xs text-gray-400 mt-1">Ready to be paid out</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Paid This Month</span>
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Banknote size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(summary.paidThisMonth)}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${filter === f.key ? "text-indigo-200" : "text-gray-400"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search affiliates..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {processing ? "Approving..." : `Approve ${selected.size}`}
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Wallet className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-sm text-gray-500 font-medium">No payouts found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter !== "all" ? "Try changing the filter" : "Payouts will appear when affiliates earn commissions"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 w-10">
                    {pendingPayouts.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    )}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {p.status === "pending" && (
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                          {p.affiliate_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{p.affiliate_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{money(Number(p.amount) || 0)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.period_start && p.period_end
                        ? `${new Date(p.period_start).toLocaleDateString()} - ${new Date(p.period_end).toLocaleDateString()}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
