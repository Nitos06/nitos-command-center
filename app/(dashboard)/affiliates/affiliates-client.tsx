"use client";

import { useState, useMemo } from "react";
import {
  Users, TrendingUp, DollarSign, Gift, MessageSquare, BarChart2,
  Tag, Image, Trophy, Mail, Store, FileText, Plus, Download, Upload,
  Send, Copy, Star, Target, Globe, Edit2, Trash2, Check, Ban, Eye,
  EyeOff, ArrowUpRight, ChevronRight, ChevronDown, X, Search, Filter,
  Calendar, MoreHorizontal, Package, RefreshCw, AlertTriangle, Shield,
  ExternalLink, Palette, Info, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  brandId: string;
  affiliates: any[];
  clicks: any[];
  conversions: any[];
  programs: any[];
  payouts: any[];
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active" ? "bg-green-100 text-green-700" :
    status === "pending" ? "bg-amber-100 text-amber-700" :
    status === "banned" ? "bg-red-100 text-red-700" :
    status === "paused" ? "bg-gray-100 text-gray-600" :
    status === "approved" ? "bg-green-100 text-green-700" :
    status === "denied" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function SlideOver({ title, onClose, children, width = "w-[480px]" }: { title: string; onClose: () => void; children: React.ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 z-[100] ${width} bg-white shadow-2xl border-l border-gray-200 flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}>{children}</div>;
}

function PrimaryBtn({ onClick, children, className = "" }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={`bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ${className}`}>
      {children}
    </button>
  );
}

function OutlineBtn({ onClick, children, className = "" }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={`border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${className}`}>
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text", className = "" }: { value?: string | number; onChange?: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    />
  );
}

function Select({ value, onChange, options, className = "" }: { value?: string; onChange?: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange?.(e.target.value)}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${className}`}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, className = "" }: { value?: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; className?: string }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${className}`}
    />
  );
}

function InnerTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-4 border-b border-gray-200 px-5">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${active === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockPrograms = [
  { id: "1", name: "Default Program", commission: 10, cookie: 30, affiliateCount: 12, status: "active" },
  { id: "2", name: "VIP Affiliates", commission: 15, cookie: 60, affiliateCount: 4, status: "active" },
  { id: "3", name: "Influencer Tier", commission: 20, cookie: 90, affiliateCount: 2, status: "paused" },
];

const mockAffiliates = [
  { id: "1", name: "Jennifer Sheldon", email: "jennifer@example.com", program: "Default Program", status: "active", clicks: 342, referrals: 18, revenue: 2840, commission: 284, lastActive: "2h ago" },
  { id: "2", name: "Marcus Reid", email: "marcus@example.com", program: "VIP Affiliates", status: "active", clicks: 215, referrals: 11, revenue: 1720, commission: 258, lastActive: "1d ago" },
  { id: "3", name: "Sarah Kim", email: "sarah@example.com", program: "Default Program", status: "pending", clicks: 87, referrals: 3, revenue: 420, commission: 42, lastActive: "3d ago" },
  { id: "4", name: "David Torres", email: "david@example.com", program: "Influencer Tier", status: "active", clicks: 512, referrals: 28, revenue: 4200, commission: 840, lastActive: "5h ago" },
  { id: "5", name: "Emma Wilson", email: "emma@example.com", program: "Default Program", status: "banned", clicks: 12, referrals: 0, revenue: 0, commission: 0, lastActive: "2w ago" },
];

const mockReferrals = [
  { id: "R001", customer: "Alice Brown", affiliate: "Jennifer Sheldon", date: "2026-04-29", value: 189, commission: 18.9, status: "approved" },
  { id: "R002", customer: "Bob Chen", affiliate: "Marcus Reid", date: "2026-04-28", value: 245, commission: 36.75, status: "pending" },
  { id: "R003", customer: "Carol Davis", affiliate: "David Torres", date: "2026-04-27", value: 312, commission: 62.4, status: "pending" },
  { id: "R004", customer: "Derek Evans", affiliate: "Jennifer Sheldon", date: "2026-04-26", value: 98, commission: 9.8, status: "denied" },
  { id: "R005", customer: "Fiona Green", affiliate: "Marcus Reid", date: "2026-04-25", value: 421, commission: 63.15, status: "approved" },
];

const mockPayouts = [
  { id: "P001", affiliate: "Jennifer Sheldon", amount: 284, referrals: 18, method: "PayPal", status: "paid", date: "2026-04-01" },
  { id: "P002", affiliate: "David Torres", amount: 840, referrals: 28, method: "Bank Transfer", status: "paid", date: "2026-04-01" },
  { id: "P003", affiliate: "Marcus Reid", amount: 258, referrals: 11, method: "PayPal", status: "paid", date: "2026-04-01" },
];

const mockUnpaid = [
  { affiliate: "Jennifer Sheldon", amount: 92, referrals: 5 },
  { affiliate: "David Torres", amount: 210, referrals: 8 },
  { affiliate: "Marcus Reid", amount: 64, referrals: 3 },
];

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  revenue: Math.floor(Math.random() * 500 + 100),
  clicks: Math.floor(Math.random() * 80 + 20),
}));

// ─── TAB 1: Programs ──────────────────────────────────────────────────────────

function ProgramsTab({ brandId }: { brandId: string }) {
  const [programs, setPrograms] = useState(mockPrograms);
  const [showNew, setShowNew] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [newProgram, setNewProgram] = useState({ name: "", description: "", commission: "10", cookie: "30", approval: "auto" });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Programs</h2>
        <PrimaryBtn onClick={() => setShowNew(true)}><Plus size={14} className="inline mr-1" />New Program</PrimaryBtn>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["Program name", "Commission", "Cookie", "# Affiliates", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programs.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 pr-4 text-gray-600">{p.commission}%</td>
                <td className="py-3 pr-4 text-gray-600">{p.cookie} days</td>
                <td className="py-3 pr-4 text-gray-600">{p.affiliateCount}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Toggle on={p.status === "active"} onChange={v => setPrograms(prev => prev.map(x => x.id === p.id ? { ...x, status: v ? "active" : "paused" } : x))} />
                    <span className="text-xs text-gray-500">{p.status}</span>
                  </div>
                </td>
                <td className="py-3">
                  <button onClick={() => setSelectedProgram(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showNew && (
        <Modal title="New Program" onClose={() => setShowNew(false)}>
          <div><Label>Name</Label><Input value={newProgram.name} onChange={v => setNewProgram(p => ({ ...p, name: v }))} placeholder="Program name" /></div>
          <div><Label>Description</Label><Textarea value={newProgram.description} onChange={v => setNewProgram(p => ({ ...p, description: v }))} placeholder="Optional description" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Commission %</Label><Input type="number" value={newProgram.commission} onChange={v => setNewProgram(p => ({ ...p, commission: v }))} /></div>
            <div><Label>Cookie days</Label><Input type="number" value={newProgram.cookie} onChange={v => setNewProgram(p => ({ ...p, cookie: v }))} /></div>
          </div>
          <div><Label>Approval</Label>
            <Select value={newProgram.approval} onChange={v => setNewProgram(p => ({ ...p, approval: v }))} options={[{ value: "auto", label: "Auto" }, { value: "manual", label: "Manual" }]} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <OutlineBtn onClick={() => setShowNew(false)}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={() => { setPrograms(prev => [...prev, { id: Date.now().toString(), ...newProgram, commission: +newProgram.commission, cookie: +newProgram.cookie, affiliateCount: 0, status: "active" }]); setShowNew(false); }}>Create Program</PrimaryBtn>
          </div>
        </Modal>
      )}

      {selectedProgram && <ProgramSlideOver program={selectedProgram} onClose={() => setSelectedProgram(null)} />}

    </div>
  );
}

function ProgramSlideOver({ program, onClose }: { program: any; onClose: () => void }) {
  const [tab, setTab] = useState("Commission");
  const [commissionRule, setCommissionRule] = useState("simple");
  const [commissionType, setCommissionType] = useState("percent");
  const [amount, setAmount] = useState("10");
  const [newCustomer, setNewCustomer] = useState(false);
  const [lifetime, setLifetime] = useState(false);
  const [excludeTax, setExcludeTax] = useState(true);
  const [excludeShipping, setExcludeShipping] = useState(true);
  const [excludeShippingTax, setExcludeShippingTax] = useState(true);
  const [excludeTip, setExcludeTip] = useState(true);
  const [excludeSelf, setExcludeSelf] = useState(false);
  const [applyTo, setApplyTo] = useState("none");
  const [status, setStatus] = useState(program.status === "active");

  return (
    <SlideOver title={program.name} onClose={onClose} width="w-[560px]">
      <InnerTabs tabs={["Commission", "Display", "Affiliates", "Email Templates"]} active={tab} onChange={setTab} />
      <div className="p-5 space-y-5">
        {tab === "Commission" && (
          <>
            {/* General info */}
            <Card className="space-y-4">
              <p className="font-semibold text-gray-900 text-sm">General information</p>
              <div className="flex items-center gap-4">
                <div className="flex-1"><Input value={program.name} placeholder="Program name" /></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Status</span>
                  <Toggle on={status} onChange={setStatus} />
                </div>
              </div>
              <div>
                <Textarea placeholder="Description (optional)" rows={2} />
                <p className="text-xs text-gray-400 italic mt-1">This is displayed on the affiliate account and registration page.</p>
              </div>
            </Card>

            {/* Commission rules */}
            <Card className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Commission rules</p>
                <p className="text-xs text-gray-500">Set a base commission rate that affiliates earn for every referral.</p>
              </div>
              <div><Label>Default commission rule</Label>
                <Select value={commissionRule} onChange={setCommissionRule} options={[{ value: "simple", label: "Simple (Fixed Commission)" }, { value: "tiered", label: "Tiered" }, { value: "product", label: "Product-based" }]} />
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1"><Label>Type</Label>
                  <Select value={commissionType} onChange={setCommissionType} options={[{ value: "percent", label: "Percent of sale" }, { value: "fixed", label: "Fixed amount" }]} />
                </div>
                <div className="flex-1"><Label>Amount</Label>
                  <div className="relative"><Input type="number" value={amount} onChange={setAmount} /><span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span></div>
                </div>
              </div>
            </Card>

            {/* Standalone toggles */}
            <div className="space-y-3">
              {[["New customer commission", newCustomer, setNewCustomer], ["Lifetime commissions", lifetime, setLifetime]].map(([label, val, setter]: any) => (
                <div key={label as string} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-700">{label as string}</span>
                    <Info size={13} className="text-gray-400" />
                  </div>
                  <Toggle on={val as boolean} onChange={setter as any} />
                </div>
              ))}
            </div>

            {/* Customer incentives */}
            <Card className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Customer incentives</p>
                <p className="text-xs text-gray-500">Reward customers when they shop through affiliate links.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Auto-discount for customers</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically apply discounts via affiliate links to drive sales and boost conversions.</p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5">Inactive</span>
                <OutlineBtn className="text-xs px-3 py-1.5 mt-0.5">Set up</OutlineBtn>
              </div>
            </Card>

            {/* Commission calculation */}
            <Card className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Commission calculation</p>
                <p className="text-xs text-gray-500">Customize how products, shipping, and taxes impact commission calculations.</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Excluded products/collections</p>
                <p className="text-xs text-gray-500">Select products or collections to exclude from commission calculation.</p>
                <Select value={applyTo} onChange={setApplyTo} options={[{ value: "none", label: "None" }, { value: "products", label: "Products" }, { value: "collections", label: "Collections" }]} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Shipping, taxes and other fees</p>
                {[["Exclude product tax", excludeTax, setExcludeTax], ["Exclude shipping", excludeShipping, setExcludeShipping], ["Exclude shipping tax", excludeShippingTax, setExcludeShippingTax], ["Exclude tip", excludeTip, setExcludeTip]].map(([label, val, setter]: any) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label as string}</span>
                    <Toggle on={val as boolean} onChange={setter as any} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-700">Exclude self-referrals</span>
                  <Info size={13} className="text-gray-400" />
                </div>
                <Toggle on={excludeSelf} onChange={setExcludeSelf} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Payment methods</p>
                <Textarea placeholder="Set up specific payment methods for each program." rows={2} />
                <p className="text-xs text-gray-400">Set up specific payment methods for each program.</p>
                <Select value="" onChange={() => {}} options={[{ value: "", label: "None (Default payment method)" }]} />
                <p className="text-xs text-gray-400">The system will automatically choose this method as default for new registered affiliates.</p>
              </div>
            </Card>

            <PrimaryBtn className="w-full">Save changes</PrimaryBtn>
          </>
        )}

        {tab === "Display" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Configure how this program appears on the registration page.</p>
            <div><Label>Banner image URL</Label><Input placeholder="https://..." /></div>
            <div><Label>Welcome message</Label><Textarea placeholder="Welcome message for affiliates..." /></div>
            <PrimaryBtn>Save display settings</PrimaryBtn>
          </div>
        )}

        {tab === "Affiliates" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-3">Affiliates enrolled in this program:</p>
            {mockAffiliates.filter(a => a.program === program.name).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}

        {tab === "Email Templates" && (
          <div className="space-y-3">
            {["Approval Email", "Welcome Email", "New Coupon", "Monthly Report"].map(t => (
              <div key={t} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-800">{t}</span>
                <div className="flex gap-2">
                  <OutlineBtn className="text-xs px-3 py-1.5">Edit</OutlineBtn>
                  <OutlineBtn className="text-xs px-3 py-1.5">Send Test</OutlineBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SlideOver>
  );
}

// ─── TAB 2: Affiliates ────────────────────────────────────────────────────────

function AffiliatesTab({ affiliates, clicks, conversions }: { affiliates: any[]; clicks: any[]; conversions: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [newAffiliate, setNewAffiliate] = useState({ firstName: "", lastName: "", email: "", program: "Default Program", commission: "", status: "active", sendInvite: true });

  // Build click counts and conversion totals per affiliate
  const clicksByAffiliate = clicks.reduce((acc: any, c: any) => {
    acc[c.affiliate_id] = (acc[c.affiliate_id] || 0) + 1;
    return acc;
  }, {});
  const convsByAffiliate = conversions.reduce((acc: any, c: any) => {
    if (!acc[c.affiliate_id]) acc[c.affiliate_id] = { count: 0, revenue: 0, commission: 0 };
    acc[c.affiliate_id].count++;
    acc[c.affiliate_id].revenue += Number(c.order_value || 0);
    acc[c.affiliate_id].commission += Number(c.commission_amount || 0);
    return acc;
  }, {});

  const enriched = affiliates.map(a => ({
    ...a,
    displayName: a.name || a.email,
    computedStatus: a.status || "pending",
    computedClicks: clicksByAffiliate[a.id] || 0,
    computedReferrals: convsByAffiliate[a.id]?.count || 0,
    computedRevenue: convsByAffiliate[a.id]?.revenue || 0,
    computedCommission: convsByAffiliate[a.id]?.commission || 0,
    lastActive: a.created_at ? new Date(a.created_at).toLocaleDateString() : "—",
  }));

  const statuses = ["All", "Active", "Pending", "Paused", "Banned"];
  const filtered = enriched.filter(a => {
    if (statusFilter !== "All" && a.computedStatus !== statusFilter.toLowerCase()) return false;
    if (search && !a.displayName.toLowerCase().includes(search.toLowerCase()) && !a.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
        <OutlineBtn onClick={() => setShowImport(true)}><Upload size={13} className="inline mr-1" />Import</OutlineBtn>
        <PrimaryBtn onClick={() => setShowAdd(true)}><Plus size={13} className="inline mr-1" />Add Affiliate</PrimaryBtn>
        <OutlineBtn onClick={() => setShowProducts(true)}>Connect Products</OutlineBtn>
        <OutlineBtn onClick={() => setShowCustomers(true)}>Connect Customers</OutlineBtn>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["", "Name", "Program", "Status", "Clicks", "Referrals", "Revenue", "Commission", "Last active", ""].map((h, i) => (
                <th key={i} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedAffiliate(a)}>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" /></td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{a.displayName}</div>
                  <div className="text-xs text-gray-500">{a.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{a.program || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={a.computedStatus} /></td>
                <td className="px-4 py-3 text-gray-700">{a.computedClicks}</td>
                <td className="px-4 py-3 text-gray-700">{a.computedReferrals}</td>
                <td className="px-4 py-3 text-gray-700">${a.computedRevenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-700">${a.computedCommission.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.lastActive}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === a.id ? null : a.id)} className="p-1 rounded hover:bg-gray-100">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                    {openMenu === a.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                        {["View Profile", "Send email", "Change status", "Remove"].map(item => (
                          <button key={item} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { if (item === "View Profile") setSelectedAffiliate(a); setOpenMenu(null); }}>{item}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <Modal title="Add Affiliate" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First name</Label><Input value={newAffiliate.firstName} onChange={v => setNewAffiliate(p => ({ ...p, firstName: v }))} /></div>
            <div><Label>Last name</Label><Input value={newAffiliate.lastName} onChange={v => setNewAffiliate(p => ({ ...p, lastName: v }))} /></div>
          </div>
          <div><Label>Email</Label><Input value={newAffiliate.email} onChange={v => setNewAffiliate(p => ({ ...p, email: v }))} type="email" /></div>
          <div><Label>Program</Label>
            <Select value={newAffiliate.program} onChange={v => setNewAffiliate(p => ({ ...p, program: v }))} options={mockPrograms.map(p => ({ value: p.name, label: p.name }))} />
          </div>
          <div><Label>Commission % override</Label><Input type="number" value={newAffiliate.commission} onChange={v => setNewAffiliate(p => ({ ...p, commission: v }))} placeholder="Leave blank to use program default" /></div>
          <div><Label>Status</Label>
            <Select value={newAffiliate.status} onChange={v => setNewAffiliate(p => ({ ...p, status: v }))} options={[{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }]} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Send invite email</span>
            <Toggle on={newAffiliate.sendInvite} onChange={v => setNewAffiliate(p => ({ ...p, sendInvite: v }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <OutlineBtn onClick={() => setShowAdd(false)}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={() => setShowAdd(false)}>Add Affiliate</PrimaryBtn>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal title="Import Affiliates" onClose={() => setShowImport(false)}>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Upload size={28} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Drop CSV file here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Supports .csv format</p>
          </div>
          <button className="text-sm text-indigo-600 hover:underline flex items-center gap-1"><Download size={13} />Download template</button>
          <div><Label>Field mapping</Label>
            <div className="space-y-2">
              {["Email", "First name", "Last name", "Program"].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">{f}</span>
                  <Select value="" onChange={() => {}} options={[{ value: "", label: "Select column..." }]} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <OutlineBtn onClick={() => setShowImport(false)}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={() => setShowImport(false)}>Import</PrimaryBtn>
          </div>
        </Modal>
      )}

      {showProducts && (
        <Modal title="Connect Products" onClose={() => setShowProducts(false)}>
          <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-gray-400" /><input placeholder="Search products..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg" /></div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {["Summer Collection T-Shirt", "Classic Hoodie", "Slim Fit Jeans", "Sneakers Pro", "Canvas Bag"].map(p => (
              <label key={p} className="flex items-center gap-3 py-2 border-b border-gray-100 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" /><span className="text-sm text-gray-700">{p}</span>
              </label>
            ))}
          </div>
          <div><Label>Commission %</Label><Input type="number" placeholder="Override commission for selected products" /></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowProducts(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowProducts(false)}>Save</PrimaryBtn></div>
        </Modal>
      )}

      {showCustomers && (
        <Modal title="Connect Customers" onClose={() => setShowCustomers(false)}>
          <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-gray-400" /><input placeholder="Search by email..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg" /></div>
          <div className="space-y-2">
            {["alice@example.com", "bob@example.com", "carol@example.com"].map(e => (
              <div key={e} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">{e}</span>
                <OutlineBtn className="text-xs px-2 py-1">Link as affiliate</OutlineBtn>
              </div>
            ))}
          </div>
          <div className="flex justify-end"><OutlineBtn onClick={() => setShowCustomers(false)}>Close</OutlineBtn></div>
        </Modal>
      )}

      {selectedAffiliate && <AffiliateSlideOver affiliate={selectedAffiliate} onClose={() => setSelectedAffiliate(null)} />}
    </div>
  );
}

function AffiliateSlideOver({ affiliate, onClose }: { affiliate: any; onClose: () => void }) {
  const [tab, setTab] = useState("Stats");
  const displayName = affiliate.displayName || affiliate.name || affiliate.email || "Affiliate";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <SlideOver title="" onClose={onClose}>
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">{initials}</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">{displayName}</p>
            <p className="text-sm text-gray-500">{affiliate.email}</p>
            <div className="flex items-center gap-2 mt-1"><StatusBadge status={affiliate.computedStatus || affiliate.status || "pending"} /><span className="text-xs text-gray-400">{affiliate.program}</span></div>
          </div>
        </div>
      </div>
      <InnerTabs tabs={["Stats", "Links & Coupons", "Commissions", "Network"]} active={tab} onChange={setTab} />
      <div className="p-5">
        {tab === "Stats" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[["Clicks", affiliate.computedClicks ?? affiliate.clicks ?? 0], ["Referrals", affiliate.computedReferrals ?? affiliate.referrals ?? 0], ["Revenue", `$${(affiliate.computedRevenue ?? affiliate.revenue ?? 0).toLocaleString()}`], ["Commission", `$${(affiliate.computedCommission ?? affiliate.commission ?? 0).toFixed(2)}`]].map(([label, val]) => (
                <div key={label as string} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{label as string}</p>
                  <p className="text-lg font-bold text-gray-900">{val as string}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Revenue last 30 days</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData.slice(0, 14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {tab === "Links & Coupons" && (
          <div className="space-y-4">
            <div>
              <Label>Affiliate link</Label>
              <div className="flex items-center gap-2">
                <input readOnly value={`https://store.com?ref=${affiliate.id}`} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Copy size={14} /></button>
              </div>
            </div>
            <div>
              <Label>Coupon code</Label>
              <div className="flex items-center gap-2">
                <input readOnly value={`AFF${affiliate.id}SAVE10`} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Copy size={14} /></button>
              </div>
            </div>
          </div>
        )}
        {tab === "Commissions" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Pending commissions</p>
            {[{ order: "R001", amount: 18.9 }, { order: "R003", amount: 62.4 }].map(c => (
              <div key={c.order} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div><p className="text-sm font-medium text-gray-900">Order #{c.order}</p><p className="text-xs text-gray-500">${c.amount}</p></div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-medium hover:bg-green-200">Approve</button>
                  <button className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-medium hover:bg-red-200">Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "Network" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Sub-affiliates</p>
            {["Level 2: John Doe (john@ex.com)", "Level 2: Jane Smith (jane@ex.com)", "  Level 3: Mike Johnson (mike@ex.com)"].map((item, i) => (
              <div key={i} className={`text-sm text-gray-700 py-1.5 border-b border-gray-100 ${item.startsWith(" ") ? "pl-6" : ""}`}>{item.trim()}</div>
            ))}
          </div>
        )}
      </div>
    </SlideOver>
  );
}

// ─── TAB 3: Referrals ─────────────────────────────────────────────────────────

function ReferralsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);

  const statuses = ["All", "Pending", "Approved", "Denied"];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <span className="text-gray-400 text-sm">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <PrimaryBtn onClick={() => setShowAdd(true)}><Plus size={13} className="inline mr-1" />Add Referral</PrimaryBtn>
        <OutlineBtn onClick={() => setShowImport(true)}><Upload size={13} className="inline mr-1" />Import</OutlineBtn>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Order #", "Customer", "Affiliate", "Date", "Order value", "Commission", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockReferrals.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedReferral(r)}>
                <td className="px-4 py-3 font-medium text-indigo-600">#{r.id}</td>
                <td className="px-4 py-3 text-gray-700">{r.customer}</td>
                <td className="px-4 py-3 text-gray-700">{r.affiliate}</td>
                <td className="px-4 py-3 text-gray-500">{r.date}</td>
                <td className="px-4 py-3 text-gray-700">${r.value}</td>
                <td className="px-4 py-3 text-gray-700">${r.commission}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-medium hover:bg-green-200">Approve</button>
                      <button className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-medium hover:bg-red-200">Deny</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <Modal title="Add Referral" onClose={() => setShowAdd(false)}>
          <div><Label>Affiliate</Label><Select value="" onChange={() => {}} options={mockAffiliates.map(a => ({ value: a.id, label: a.name }))} /></div>
          <div><Label>Order ID</Label><Input placeholder="e.g. #1234" /></div>
          <div><Label>Commission ($)</Label><Input type="number" placeholder="0.00" /></div>
          <div><Label>Date</Label><Input type="date" /></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowAdd(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowAdd(false)}>Add Referral</PrimaryBtn></div>
        </Modal>
      )}

      {showImport && (
        <Modal title="Import Referrals" onClose={() => setShowImport(false)}>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center"><Upload size={28} className="mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-600">Drop CSV file here</p></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowImport(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowImport(false)}>Import</PrimaryBtn></div>
        </Modal>
      )}

      {selectedReferral && (
        <Modal title={`Referral #${selectedReferral.id}`} onClose={() => setSelectedReferral(null)} wide>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-500">Order ID</p><p className="font-medium">#{selectedReferral.id}</p></div>
            <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{selectedReferral.date}</p></div>
            <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium">{selectedReferral.customer}</p></div>
            <div><p className="text-xs text-gray-500">Affiliate</p><p className="font-medium">{selectedReferral.affiliate}</p></div>
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Commission breakdown</p>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Base rate (10%)</span><span>${(selectedReferral.value * 0.1).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping excluded</span><span>-$0.00</span></div>
            <div className="flex justify-between text-sm font-semibold"><span>Final commission</span><span>${selectedReferral.commission}</span></div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Customer journey</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full"><ArrowUpRight size={11} />Clicked link</div>
              <ChevronRight size={12} className="text-gray-400" />
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full"><Package size={11} />Added to cart</div>
              <ChevronRight size={12} className="text-gray-400" />
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 size={11} />Purchased</div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {selectedReferral.status === "pending" && <>
              <button className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium hover:bg-green-200">Approve</button>
              <button className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg font-medium hover:bg-red-200">Deny</button>
            </>}
            <OutlineBtn>Edit commission</OutlineBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 4: Payments ─────────────────────────────────────────────────────────

function PaymentsTab({ affiliates, payouts, conversions }: { affiliates: any[]; payouts: any[]; conversions: any[] }) {
  const [showPay, setShowPay] = useState<any>(null);
  const [payMethod, setPayMethod] = useState("paypal");
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(false);
  const [schedule, setSchedule] = useState("approval");
  const [threshold, setThreshold] = useState("50");

  // Build affiliate name lookup
  const affiliateById: Record<string, string> = affiliates.reduce((acc: any, a: any) => {
    acc[a.id] = a.name || a.email || a.id;
    return acc;
  }, {});

  // Compute unpaid commissions per affiliate (conversions not yet paid)
  const paidAffiliateIds = new Set(payouts.filter(p => p.status === "paid").map((p: any) => p.affiliate_id));
  const unpaidByAffiliate: Record<string, { name: string; amount: number; referrals: number }> = {};
  conversions.forEach((c: any) => {
    if (c.status === "paid") return;
    const name = affiliateById[c.affiliate_id] || c.affiliate_id || "Unknown";
    if (!unpaidByAffiliate[c.affiliate_id]) unpaidByAffiliate[c.affiliate_id] = { name, amount: 0, referrals: 0 };
    unpaidByAffiliate[c.affiliate_id].amount += Number(c.commission_amount || 0);
    unpaidByAffiliate[c.affiliate_id].referrals++;
  });
  const unpaidList = Object.entries(unpaidByAffiliate).map(([id, data]) => ({ affiliateId: id, ...data }));
  const totalUnpaid = unpaidList.reduce((s, u) => s + u.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unpaid commissions */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Unpaid commissions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalUnpaid.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <OutlineBtn><Download size={13} className="inline mr-1" />Download Invoices</OutlineBtn>
              <PrimaryBtn>Pay All</PrimaryBtn>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {unpaidList.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No unpaid commissions</p>
            ) : unpaidList.map(u => (
              <div key={u.affiliateId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.referrals} referrals</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">${u.amount.toFixed(2)}</span>
                  <PrimaryBtn onClick={() => setShowPay(u)} className="px-3 py-1.5 text-xs">Pay</PrimaryBtn>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment history */}
        <Card className="space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Payment history</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Date", "Affiliate", "Amount", "Method", "Status", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-sm text-gray-400">No payouts yet</td></tr>
              ) : payouts.map(p => (
                <tr key={p.id}>
                  <td className="py-2 pr-2 text-xs text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-2 pr-2 text-gray-700 text-xs">{affiliateById[p.affiliate_id] || p.affiliate_id || "—"}</td>
                  <td className="py-2 pr-2 font-medium">${Number(p.amount || 0).toFixed(2)}</td>
                  <td className="py-2 pr-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{p.method || "PayPal"}</span></td>
                  <td className="py-2 pr-2"><StatusBadge status={p.status} /></td>
                  <td className="py-2"><button className="text-gray-400 hover:text-gray-600"><Download size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Auto-payout settings */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Auto-payout settings</p>
            <p className="text-sm text-gray-500">Automatically pay affiliates based on a schedule.</p>
          </div>
          <div className="flex items-center gap-2">
            <Toggle on={autoPayoutEnabled} onChange={setAutoPayoutEnabled} />
            {!autoPayoutEnabled && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Connect PayPal to enable</span>}
          </div>
        </div>
        <div>
          <Label>Payment schedule</Label>
          <div className="space-y-2 mt-2">
            {[["approval", "Immediately on approval"], ["specific", "Specific date"], ["cycle", "Payment cycle (1st, 15th)"]].map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={val} checked={schedule === val} onChange={() => setSchedule(val)} className="text-indigo-600" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="max-w-xs"><Label>Minimum threshold ($)</Label><Input type="number" value={threshold} onChange={setThreshold} /></div>
      </Card>

      {showPay && (
        <Modal title={`Pay ${showPay.name || showPay.affiliate || "Affiliate"}`} onClose={() => setShowPay(null)}>
          <div><Label>Payment method</Label>
            <Select value={payMethod} onChange={setPayMethod} options={[{ value: "paypal", label: "PayPal" }, { value: "bank", label: "Bank Transfer" }, { value: "credit", label: "Store Credit" }, { value: "manual", label: "Manual" }]} />
          </div>
          <div><Label>Amount</Label>
            <div className="relative"><span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span><Input type="number" value={(showPay.amount || 0).toFixed(2)} className="pl-7" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <OutlineBtn onClick={() => setShowPay(null)}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={() => setShowPay(null)}>Confirm Payment</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 5: Display ───────────────────────────────────────────────────────────

function DisplayTab() {
  const [subTab, setSubTab] = useState("Registration Page");
  const [template, setTemplate] = useState("Fashion");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [fields, setFields] = useState([
    { name: "First name", show: true, required: true },
    { name: "Last name", show: true, required: false },
    { name: "Email", show: true, required: true },
    { name: "Password", show: true, required: true },
    { name: "Phone", show: false, required: false },
    { name: "Website", show: false, required: false },
    { name: "Social handle", show: false, required: false },
    { name: "Promotion method", show: false, required: false },
  ]);
  const [headline, setHeadline] = useState("Become an Affiliate");
  const [subheadline, setSubheadline] = useState("Join our affiliate program and start earning today.");
  const [thankYouStyle, setThankYouStyle] = useState("Style");
  const [thankYouSection, setThankYouSection] = useState<string | null>(null);
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [platforms, setPlatforms] = useState({ facebook: true, twitter: true, instagram: false, pinterest: false, whatsapp: true });
  const [shareMessage, setShareMessage] = useState("Check out this amazing store! {{affiliate_link}}");
  const [showForgotPw, setShowForgotPw] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loginHeadline, setLoginHeadline] = useState("AFFILIATE LOGIN");
  const [selectedProgram, setSelectedProgram] = useState("Default Program");

  const templates = ["Fashion", "Minimal", "Bold", "Classic"];

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {["Registration Page", "Thank You Page", "Social Sharing", "Login Page"].map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
        ))}
      </div>

      {subTab === "Registration Page" && (
        <div className="flex gap-6">
          {/* Editor */}
          <div className="w-[340px] flex-shrink-0 space-y-5">
            <Card className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Template</p>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                  <button key={t} onClick={() => setTemplate(t)} className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${template === t ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{t}</button>
                ))}
              </div>
            </Card>

            <Card className="space-y-2">
              <p className="text-sm font-semibold text-gray-800 mb-2">Form fields</p>
              {fields.map((f, i) => (
                <div key={f.name} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.required ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>{f.required ? "Required" : "Optional"}</span>
                    <button onClick={() => setFields(prev => prev.map((x, j) => j === i ? { ...x, show: !x.show } : x))}>
                      {f.show ? <Eye size={14} className="text-gray-500" /> : <EyeOff size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </Card>

            <Card className="space-y-3">
              <div><Label>Headline</Label><Input value={headline} onChange={setHeadline} /></div>
              <div><Label>Subheadline</Label><Input value={subheadline} onChange={setSubheadline} /></div>
              <div>
                <Label>Primary color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-9 w-14 rounded border border-gray-300 cursor-pointer" />
                  <span className="text-sm text-gray-600">{primaryColor}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <OutlineBtn className="flex-1">Add to Shopify store</OutlineBtn>
              <PrimaryBtn className="flex-1">Save</PrimaryBtn>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
              <div className="w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: primaryColor }} />
              <h2 className="text-xl font-bold text-gray-900 mb-1">{headline}</h2>
              <p className="text-sm text-gray-500 mb-6">{subheadline}</p>
              <div className="space-y-3">
                {fields.filter(f => f.show).map(f => (
                  <div key={f.name}>
                    <div className="block text-xs font-medium text-gray-600 mb-1">{f.name}{f.required && <span className="text-red-500 ml-0.5">*</span>}</div>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">{f.name}...</div>
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>Register</button>
              <p className="text-center text-xs text-gray-500 mt-3">Already have an account? <span className="text-indigo-600 cursor-pointer">Log in</span></p>
            </div>
          </div>
        </div>
      )}

      {subTab === "Thank You Page" && (
        <div className="flex gap-0">
          {/* Editor */}
          <div className="w-[320px] flex-shrink-0 border-r border-gray-200 pr-5 space-y-4">
            <p className="font-semibold text-gray-900">Edit thank you page</p>
            <div>
              <Label>Ring to program:</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedProgram} onChange={setSelectedProgram} options={mockPrograms.map(p => ({ value: p.name, label: p.name }))} className="flex-1" />
                <button className="p-2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            </div>
            <div className="flex gap-1 border-b border-gray-200">
              {["Style", "Content"].map(t => (
                <button key={t} onClick={() => setThankYouStyle(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${thankYouStyle === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
              ))}
            </div>
            <div className="space-y-2">
              {[["General", "Basic page settings"], ["Content", "Page text and elements"], ["Custom CSS", "Advanced styling"]].map(([section, desc]) => (
                <div key={section} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setThankYouSection(thankYouSection === section ? null : section as string)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50">
                    {section}
                    {thankYouSection === section ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {thankYouSection === section && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mt-2 mb-2">{desc}</p>
                      {section === "Custom CSS" ? (
                        <textarea placeholder="Enter CSS code" className="w-full h-[120px] border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                      ) : (
                        <Input placeholder={`Edit ${section?.toLowerCase()} settings...`} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
              <div className="bg-red-500 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ArrowUpRight size={28} className="text-white" />
              </div>
              <h2 className="font-semibold text-gray-900 text-lg mb-3">Verify your email address</h2>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                {"We've sent a verification link to your email. Just click on the link in that email to complete your signup. If you don't see it, you may need to check your Spam, Updates or Promotion folder. Still can't find the email?"}
              </p>
              <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium">Resend email</button>
            </div>
          </div>
        </div>
      )}

      {subTab === "Social Sharing" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Enable social sharing</p>
                <Toggle on={socialEnabled} onChange={setSocialEnabled} />
              </div>
              <div className="space-y-3">
                {Object.entries(platforms).map(([platform, enabled]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{platform === "twitter" ? "Twitter/X" : platform}</span>
                    <Toggle on={enabled} onChange={v => setPlatforms(p => ({ ...p, [platform]: v }))} />
                  </div>
                ))}
              </div>
              <div>
                <Label>Share message</Label>
                <Textarea value={shareMessage} onChange={setShareMessage} rows={3} />
                <p className="text-xs text-gray-400 mt-1">Use {"{{affiliate_link}}"} as placeholder</p>
              </div>
              <div>
                <Label>Share image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <Image size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">Preview</p>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-sm font-bold">JS</div>
                <div><p className="text-sm font-medium text-gray-900">Jennifer Sheldon</p><p className="text-xs text-gray-500">About 2 hours ago</p></div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded mb-2 flex items-center justify-center"><ArrowUpRight size={14} className="text-white" /></div>
                <p className="text-xs text-gray-600">{shareMessage}</p>
              </div>
              <div className="flex gap-2">
                {Object.entries(platforms).filter(([, v]) => v).map(([p]) => (
                  <span key={p} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "Login Page" && (
        <div className="flex gap-6">
          {/* Editor */}
          <div className="w-[300px] flex-shrink-0 space-y-4">
            <Card className="space-y-3">
              <div><Label>Page headline</Label><Input value={loginHeadline} onChange={setLoginHeadline} /></div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show "Forgot password?"</span>
                <Toggle on={showForgotPw} onChange={setShowForgotPw} />
              </div>
              <div>
                <Label>Logo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                  <Upload size={18} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Upload logo</p>
                </div>
              </div>
              <div>
                <Label>Background color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#f9fafb" className="h-9 w-14 rounded border border-gray-300 cursor-pointer" />
                </div>
              </div>
            </Card>
            <PrimaryBtn className="w-full">Save</PrimaryBtn>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
              <p className="text-center font-bold text-gray-900 text-lg uppercase tracking-wide mb-6">{loginHeadline}</p>
              <div className="space-y-3 mb-4">
                <div><div className="text-xs font-medium text-gray-600 mb-1">Email</div><div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">email@example.com</div></div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Password</div>
                  <div className="relative">
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">••••••••</div>
                    <button className="absolute right-3 top-2 text-gray-400" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-3 mb-4 bg-gray-50">
                <div className="w-4 h-4 border border-gray-400 rounded" />
                <span className="text-xs text-gray-600">I&apos;m not a robot</span>
                <div className="ml-auto"><div className="w-8 h-8 bg-gray-300 rounded" /></div>
              </div>
              <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium mb-3">Login</button>
              {showForgotPw && <p className="text-center text-xs text-indigo-600 cursor-pointer mb-3">Forgot password?</p>}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Do you have an account?</p>
                <button className="w-full py-2 rounded-lg border border-indigo-600 text-indigo-600 text-sm font-medium hover:bg-indigo-50">Create an account</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Motivation Card ──────────────────────────────────────────────────────────

function MotivationCard({ icon, title, desc, btnText, onClick }: { icon: React.ReactNode; title: string; desc: string; btnText: string; onClick: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1">{title}</div>
        <div className="text-sm text-gray-500 mb-3">{desc}</div>
        <button onClick={onClick} className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors">{btnText}</button>
      </div>
    </div>
  );
}

// ─── TAB 6: Motivation ────────────────────────────────────────────────────────

function MotivationTab({ affiliates, conversions }: { affiliates: any[]; conversions: any[] }) {
  const [showCoupon, setShowCoupon] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [welcomeGift, setWelcomeGift] = useState(false);
  const [milestoneGift, setMilestoneGift] = useState(false);

  // Compute top 5 affiliates by total commission
  const affiliateRevenue = conversions.reduce((acc: any, c: any) => {
    acc[c.affiliate_id] = (acc[c.affiliate_id] || 0) + Number(c.commission_amount || 0);
    return acc;
  }, {});
  const top5Affiliates = affiliates
    .map(a => ({ ...a, totalCommission: affiliateRevenue[a.id] || 0, displayName: a.name || a.email || "—" }))
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 5);

  // Compute top 5 products from conversions
  const productRevenue: Record<string, { title: string; revenue: number; count: number }> = {};
  conversions.forEach((c: any) => {
    const key = c.product_title || c.product_id || "Unknown";
    if (!productRevenue[key]) productRevenue[key] = { title: key, revenue: 0, count: 0 };
    productRevenue[key].revenue += Number(c.order_value || 0);
    productRevenue[key].count++;
  });
  const top5Products = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const medals = ["🥇", "🥈", "🥉"];
  const hasData = affiliates.length > 0 || conversions.length > 0;

  return (
    <div className="space-y-8">

      {/* Top Affiliates Leaderboard */}
      <div>
        <p className="font-bold text-gray-900 mb-4">Top 5 Affiliates</p>
        {!hasData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">No affiliate data yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Rank", "Affiliate", "Commission Earned", "Referrals"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {top5Affiliates.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-lg">{medals[i] || `#${i + 1}`}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.displayName}</td>
                    <td className="px-4 py-3 text-gray-700">${a.totalCommission.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{conversions.filter(c => c.affiliate_id === a.id).length}</td>
                  </tr>
                ))}
                {top5Affiliates.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No affiliates yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div>
        <p className="font-bold text-gray-900 mb-4">Top 5 Products (via Affiliates)</p>
        {top5Products.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">No product data yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Product", "Revenue (Affiliate)", "# Orders"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {top5Products.map((p, i) => (
                  <tr key={p.title} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                    <td className="px-4 py-3 text-gray-700">${p.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <p className="font-bold text-gray-900 mb-4">Promotional resources</p>
        <div className="grid grid-cols-2 gap-4">
          <MotivationCard icon={<Tag size={22} className="text-blue-600" />} title="Coupons" desc="Let affiliates promote your brand by coupons" btnText="Manage coupons" onClick={() => setShowCoupon(true)} />
          <MotivationCard icon={<Image size={22} className="text-blue-600" />} title="Media gallery" desc="Share marketing materials with affiliates" btnText="Add media" onClick={() => setShowMedia(true)} />
        </div>
      </div>

      <div>
        <p className="font-bold text-gray-900 mb-4">Incentives</p>
        <div className="grid grid-cols-2 gap-4">
          <MotivationCard icon={<Gift size={22} className="text-blue-600" />} title="Gifts" desc="Send sample products or gift packages to affiliates" btnText="Set up" onClick={() => setShowGift(true)} />
          <MotivationCard icon={<Trophy size={22} className="text-blue-600" />} title="Bonuses" desc="Give affiliates bonuses for motivation" btnText="Set up" onClick={() => setShowBonus(true)} />
        </div>
      </div>

      {showCoupon && (
        <Modal title="Manage Coupons" onClose={() => setShowCoupon(false)}>
          <div><Label>Coupon code</Label><Input placeholder="e.g. SUMMER20" /></div>
          <div><Label>Discount %</Label><Input type="number" placeholder="20" /></div>
          <div><Label>Expires</Label><Input type="date" /></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowCoupon(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowCoupon(false)}>Create coupon</PrimaryBtn></div>
        </Modal>
      )}

      {showMedia && (
        <Modal title="Media Gallery" onClose={() => setShowMedia(false)}>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center"><Upload size={28} className="mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-600">Drop files here or click to upload</p></div>
          <div className="space-y-2">
            {["banner-summer.jpg", "logo-dark.png", "promo-video.mp4"].map(f => (
              <div key={f} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">{f}</span>
                <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Copy size={11} />Copy link</button>
              </div>
            ))}
          </div>
          <div className="flex justify-end"><OutlineBtn onClick={() => setShowMedia(false)}>Close</OutlineBtn></div>
        </Modal>
      )}

      {showGift && (
        <Modal title="Gift Setup" onClose={() => setShowGift(false)}>
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">Welcome gift</span><Toggle on={welcomeGift} onChange={setWelcomeGift} /></div>
          {welcomeGift && <div><Label>Product</Label><Input placeholder="Search products..." /></div>}
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">Milestone gift</span><Toggle on={milestoneGift} onChange={setMilestoneGift} /></div>
          {milestoneGift && <>
            <div><Label>Milestone amount ($)</Label><Input type="number" placeholder="500" /></div>
            <div><Label>Gift product</Label><Input placeholder="Search products..." /></div>
          </>}
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowGift(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowGift(false)}>Save</PrimaryBtn></div>
        </Modal>
      )}

      {showBonus && (
        <Modal title="Bonus Setup" onClose={() => setShowBonus(false)}>
          <div><Label>Bonus name</Label><Input placeholder="e.g. Summer bonus" /></div>
          <div><Label>Trigger type</Label>
            <Select value="sales" onChange={() => {}} options={[{ value: "sales", label: "Reach $X in sales" }, { value: "referrals", label: "Reach N referrals" }]} />
          </div>
          <div><Label>Threshold</Label><Input type="number" placeholder="1000" /></div>
          <div><Label>Bonus amount ($)</Label><Input type="number" placeholder="50" /></div>
          <div><Label>Frequency</Label>
            <Select value="one-time" onChange={() => {}} options={[{ value: "one-time", label: "One-time" }, { value: "recurring", label: "Recurring" }]} />
          </div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowBonus(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowBonus(false)}>Save bonus</PrimaryBtn></div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 7: Reach Out ─────────────────────────────────────────────────────────

function ReachOutTab() {
  const [showReferral, setShowReferral] = useState(false);
  const [showMLM, setShowMLM] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mlmEnabled, setMlmEnabled] = useState(false);
  const [showPostPurchase, setShowPostPurchase] = useState(true);
  const [showCommission, setShowCommission] = useState(true);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Outreach</h2>

      <div>
        <p className="font-bold text-gray-900 mb-4">Affiliate recruitment</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MotivationCard icon={<FileText size={22} className="text-blue-600" />} title="Customer referral" desc="Rewards customers for referring their friends" btnText="Set up" onClick={() => setShowReferral(true)} />
          <MotivationCard icon={<Users size={22} className="text-blue-600" />} title="Multi-level marketing" desc="Grow your affiliate team with network marketing" btnText="Set up" onClick={() => setShowMLM(true)} />
        </div>
        <div className="max-w-sm">
          <MotivationCard icon={<Store size={22} className="text-blue-600" />} title="Marketplace listing" desc="Post your offer on UpPromote marketplace" btnText="Edit offer" onClick={() => setShowMarketplace(true)} />
        </div>
      </div>

      <div>
        <p className="font-bold text-gray-900 mb-4">Affiliate communication</p>
        <div className="grid grid-cols-2 gap-4">
          <MotivationCard icon={<Mail size={22} className="text-blue-600" />} title="Emails" desc="Edit email templates and send bulk emails" btnText="Manage emails" onClick={() => setShowEmail(true)} />
          <MotivationCard icon={<MessageSquare size={22} className="text-blue-600" />} title="Chat with affiliates" desc="Send direct messages to affiliates via app" btnText="Open chat" onClick={() => setShowChat(true)} />
        </div>
      </div>

      {showReferral && (
        <Modal title="Customer Referral Setup" onClose={() => setShowReferral(false)}>
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">Show post-purchase popup</span><Toggle on={showPostPurchase} onChange={setShowPostPurchase} /></div>
          <div><Label>Popup position</Label><Select value="bottom-right" onChange={() => {}} options={[{ value: "bottom-right", label: "Bottom right" }, { value: "bottom-left", label: "Bottom left" }, { value: "center", label: "Center" }]} /></div>
          <div><Label>Button text</Label><Input placeholder="Share & earn" /></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowReferral(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowReferral(false)}>Save</PrimaryBtn></div>
        </Modal>
      )}

      {showMLM && (
        <Modal title="Multi-Level Marketing" onClose={() => setShowMLM(false)}>
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">Enable MLM</span><Toggle on={mlmEnabled} onChange={setMlmEnabled} /></div>
          <div><Label>Max levels (1–5)</Label><Select value="2" onChange={() => {}} options={[1, 2, 3, 4, 5].map(n => ({ value: String(n), label: `${n} level${n > 1 ? "s" : ""}` }))} /></div>
          <div><Label>Level 2 commission %</Label><Input type="number" placeholder="5" /></div>
          <div><Label>Level 3 commission %</Label><Input type="number" placeholder="2" /></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowMLM(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowMLM(false)}>Save</PrimaryBtn></div>
        </Modal>
      )}

      {showMarketplace && (
        <Modal title="Marketplace Listing" onClose={() => setShowMarketplace(false)}>
          <div><Label>Description</Label><Textarea placeholder="Describe your affiliate program offer..." rows={4} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">Show commission rate</span><Toggle on={showCommission} onChange={setShowCommission} /></div>
          <div className="flex justify-end gap-3"><OutlineBtn onClick={() => setShowMarketplace(false)}>Cancel</OutlineBtn><PrimaryBtn onClick={() => setShowMarketplace(false)}>Save</PrimaryBtn></div>
        </Modal>
      )}

      {showEmail && (
        <Modal title="Email Templates" onClose={() => setShowEmail(false)} wide>
          <div className="space-y-2">
            {["Approval", "Welcome", "New coupon", "Referral confirmed", "Monthly report"].map(t => (
              <div key={t} className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-800">{t}</span>
                <div className="flex gap-2">
                  <OutlineBtn className="text-xs px-3 py-1.5">Edit</OutlineBtn>
                  <OutlineBtn className="text-xs px-3 py-1.5">Send</OutlineBtn>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end"><OutlineBtn onClick={() => setShowEmail(false)}>Close</OutlineBtn></div>
        </Modal>
      )}

      {showChat && (
        <Modal title="Chat with Affiliates" onClose={() => setShowChat(false)} wide>
          <div className="flex gap-4 h-64">
            <div className="w-40 border-r border-gray-200 overflow-y-auto">
              {mockAffiliates.map(a => (
                <div key={a.id} className="px-2 py-2 hover:bg-gray-50 cursor-pointer rounded text-sm text-gray-700 truncate">{a.name}</div>
              ))}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-sm text-gray-400 italic">Select an affiliate to start chatting...</div>
              <div className="flex gap-2 mt-2">
                <input placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <PrimaryBtn><Send size={14} /></PrimaryBtn>
              </div>
            </div>
          </div>
          <div className="flex justify-end"><OutlineBtn onClick={() => setShowChat(false)}>Close</OutlineBtn></div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 8: Analytics ─────────────────────────────────────────────────────────

function AnalyticsTab({ clicks, conversions }: { clicks: any[]; conversions: any[] }) {
  const [period, setPeriod] = useState("30d");

  const kpis = [
    { label: "Total Revenue", value: "$14,820", formula: "Sum of all referred orders" },
    { label: "CR (Conversion Rate)", value: "8.4%", formula: "Conversions / Clicks × 100" },
    { label: "AOV", value: "$212", formula: "Total Revenue / Orders" },
    { label: "CPC", value: "$0.43", formula: "Commission / Clicks" },
    { label: "ROI", value: "340%", formula: "(Revenue - Cost) / Cost × 100" },
    { label: "CAC", value: "$18.2", formula: "Total Commission / New Customers" },
  ];

  const topAffiliates = [
    { rank: 1, name: "David Torres", revenue: 4200, referrals: 28, cr: "12.4%", commission: 840 },
    { rank: 2, name: "Jennifer Sheldon", revenue: 2840, referrals: 18, cr: "9.1%", commission: 284 },
    { rank: 3, name: "Marcus Reid", revenue: 1720, referrals: 11, cr: "8.7%", commission: 258 },
    { rank: 4, name: "Sarah Kim", revenue: 420, referrals: 3, cr: "5.2%", commission: 42 },
    { rank: 5, name: "Emma Wilson", revenue: 0, referrals: 0, cr: "0%", commission: 0 },
  ];

  const topProducts = [
    { product: "Classic Hoodie", revenue: 3200, referrals: 14, topAffiliate: "David Torres" },
    { product: "Summer Collection T-Shirt", revenue: 2100, referrals: 21, topAffiliate: "Jennifer Sheldon" },
    { product: "Slim Fit Jeans", revenue: 1850, referrals: 9, topAffiliate: "Marcus Reid" },
    { product: "Sneakers Pro", revenue: 1200, referrals: 6, topAffiliate: "David Torres" },
    { product: "Canvas Bag", revenue: 890, referrals: 12, topAffiliate: "Jennifer Sheldon" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <div className="flex gap-1">
          {["7d", "30d", "90d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${period === p ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400">{k.formula}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <p className="text-sm font-semibold text-gray-800 mb-4">Revenue over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-800 mb-4">Clicks over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <p className="text-sm font-semibold text-gray-800 mb-4">Top 5 Affiliates</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Rank", "Name", "Revenue", "Refs", "CR%", "Commission"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topAffiliates.map(a => (
                <tr key={a.rank}>
                  <td className="py-2 pr-2 text-gray-500">#{a.rank}</td>
                  <td className="py-2 pr-2 font-medium text-gray-900 text-xs">{a.name}</td>
                  <td className="py-2 pr-2 text-gray-700">${a.revenue.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-gray-700">{a.referrals}</td>
                  <td className="py-2 pr-2 text-gray-700">{a.cr}</td>
                  <td className="py-2 text-gray-700">${a.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-800 mb-4">Top 5 Products</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Product", "Revenue", "Refs", "Top affiliate"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map(p => (
                <tr key={p.product}>
                  <td className="py-2 pr-2 font-medium text-gray-900 text-xs">{p.product}</td>
                  <td className="py-2 pr-2 text-gray-700">${p.revenue.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-gray-700">{p.referrals}</td>
                  <td className="py-2 text-gray-500 text-xs">{p.topAffiliate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ─── ROI Calculator Tab ───────────────────────────────────────────────────────

function AffiliateROICalculator() {
  const [monthlyOrders, setMonthlyOrders] = useState(200);
  const [aov, setAov] = useState(75);
  const [trafficShare, setTrafficShare] = useState(5);
  const [commissionRate, setCommissionRate] = useState(20);
  const [grossMargin, setGrossMargin] = useState(50);

  const affiliateSales = Math.round(monthlyOrders * (trafficShare / 100));
  const affiliateRevenue = affiliateSales * aov;
  const commissionPaid = affiliateRevenue * (commissionRate / 100);
  const grossProfit = affiliateRevenue * (grossMargin / 100);
  const netMonthlyProfit = grossProfit - commissionPaid;
  const annualProfit = netMonthlyProfit * 12;
  const roiMultiple = commissionPaid > 0 ? (affiliateRevenue / commissionPaid) : 0;

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column — inputs */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">Your Program Numbers</p>

        <div className="space-y-5">
          {/* Monthly Orders */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Orders</label>
            <p className="text-xs text-gray-500 mb-2">Average monthly store orders</p>
            <input
              type="number"
              value={monthlyOrders}
              onChange={e => setMonthlyOrders(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          {/* AOV */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Average Order Value ($)</label>
            <p className="text-xs text-gray-500 mb-2">Your average order value</p>
            <input
              type="number"
              value={aov}
              onChange={e => setAov(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          {/* Traffic Share */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Affiliate Traffic Share (%)</label>
            <p className="text-xs text-gray-500 mb-1">% of sales you expect from affiliates</p>
            <p className="text-xs text-indigo-400 mb-2">Industry avg: 5-10%</p>
            <input
              type="number"
              value={trafficShare}
              onChange={e => setTrafficShare(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Commission Rate (%)</label>
            <p className="text-xs text-gray-500 mb-1">Commission paid to affiliates</p>
            <p className="text-xs text-indigo-400 mb-2">30-50% of net margin is standard</p>
            <input
              type="number"
              value={commissionRate}
              onChange={e => setCommissionRate(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          {/* Gross Margin */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Product Gross Margin (%)</label>
            <p className="text-xs text-gray-500 mb-2">Your gross margin after COGS</p>
            <input
              type="number"
              value={grossMargin}
              onChange={e => setGrossMargin(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Right column — results */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Hero annual profit */}
        <div className="text-center pb-6">
          <p className="text-5xl font-bold text-green-600">
            {annualProfit.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </p>
          <p className="text-gray-500 text-sm mt-2">/year net profit from affiliates</p>
        </div>

        <hr className="border-gray-200 mb-2" />

        {/* Breakdown rows */}
        <div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Affiliate orders / month</span>
            <span className="text-sm font-semibold text-gray-900">{affiliateSales}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Monthly affiliate revenue</span>
            <span className="text-sm font-semibold text-gray-900">${affiliateRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Monthly commission cost</span>
            <span className="text-sm font-semibold text-red-500">-${Math.round(commissionPaid).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Monthly net profit</span>
            <span className="text-sm font-semibold text-green-600">${Math.round(netMonthlyProfit).toLocaleString()}</span>
          </div>
        </div>

        {/* Dark callout card */}
        <div className="bg-gray-900 rounded-xl p-4 mt-4">
          {roiMultiple >= 1 && (
            <>
              <p className="text-3xl font-bold text-white">{roiMultiple.toFixed(1)}x ROI</p>
              <p className="text-gray-400 text-sm mt-1">You earn ${roiMultiple.toFixed(1)} for every $1 paid in commission</p>
              <p className="text-gray-500 text-xs mt-1">UpPromote benchmark: $12 return per $1 spent</p>
            </>
          )}
          <p className="text-gray-500 text-xs mt-2">Industry targets: 3-8% of total revenue, 20-30% active affiliate ratio</p>
        </div>

        <p className="text-gray-400 text-xs mt-4">
          Estimates based on industry benchmarks. Actual results depend on affiliate quality and offer strength.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ["Programs", "Affiliates", "Referrals", "Payments", "Motivation", "Reach Out", "Analytics", "ROI Calculator"] as const;
type Tab = typeof TABS[number];

export default function AffiliatesClient({
  brandId,
  affiliates = [],
  clicks = [],
  conversions = [],
  programs = [],
  payouts = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Programs");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {activeTab === "Programs" && <ProgramsTab brandId={brandId} />}
        {activeTab === "Affiliates" && <AffiliatesTab affiliates={affiliates} clicks={clicks} conversions={conversions} />}
        {activeTab === "Referrals" && <ReferralsTab />}
        {activeTab === "Payments" && <PaymentsTab affiliates={affiliates} payouts={payouts} conversions={conversions} />}
        {activeTab === "Motivation" && <MotivationTab affiliates={affiliates} conversions={conversions} />}
        {activeTab === "Reach Out" && <ReachOutTab />}
        {activeTab === "Analytics" && <AnalyticsTab clicks={clicks} conversions={conversions} />}
        {activeTab === "ROI Calculator" && <AffiliateROICalculator />}
      </div>
    </div>
  );
}
