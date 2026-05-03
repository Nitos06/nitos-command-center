"use client";

import { useState } from "react";
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Users, DollarSign,
  Percent, Clock, CheckCircle2, PauseCircle, X, Search, MoreHorizontal,
  FileText, TrendingUp, Shield,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
  commission_type: string;
  commission_value: number;
  cookie_duration: number;
  auto_approve: boolean;
  status: string;
  description: string;
  affiliate_count: number;
  active_affiliate_count: number;
  total_revenue?: number;
  created_at: string;
}

interface Props {
  brandId: string;
  programs: Program[];
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

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
    status === "paused" ? "bg-amber-100 text-amber-700" :
    "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

const emptyProgram = {
  name: "",
  commission_type: "percentage",
  commission_value: 10,
  cookie_duration: 30,
  auto_approve: false,
  description: "",
};

export default function ProgramsManager({ brandId, programs: initialPrograms }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProgram);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = programs.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyProgram);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (p: Program) => {
    setForm({
      name: p.name,
      commission_type: p.commission_type || "percentage",
      commission_value: p.commission_value,
      cookie_duration: p.cookie_duration || 30,
      auto_approve: p.auto_approve || false,
      description: p.description || "",
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/affiliates/programs", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editId, brand_id: brandId }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (editId) {
          setPrograms(prev => prev.map(p => p.id === editId ? { ...p, ...saved } : p));
        } else {
          setPrograms(prev => [{ ...saved, affiliate_count: 0, active_affiliate_count: 0 }, ...prev]);
        }
        setShowModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p: Program) => {
    const newStatus = p.status === "active" ? "paused" : "active";
    setPrograms(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
    await fetch("/api/affiliates/programs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, status: newStatus, brand_id: brandId }),
    });
  };

  const handleDelete = async (id: string) => {
    setPrograms(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
    await fetch("/api/affiliates/programs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, brand_id: brandId }),
    });
  };

  const totalAffiliates = programs.reduce((s, p) => s + p.affiliate_count, 0);
  const activePrograms = programs.filter(p => p.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <FileText size={16} />
            <span className="text-xs font-medium">Total Programs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-xs font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activePrograms}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Users size={16} />
            <span className="text-xs font-medium">Total Affiliates</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalAffiliates}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <PauseCircle size={16} />
            <span className="text-xs font-medium">Paused</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{programs.length - activePrograms}</p>
        </div>
      </div>

      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Create Program
        </button>
      </div>

      {/* Programs List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-sm text-gray-500 font-medium">No programs found</p>
          <p className="text-xs text-gray-400 mt-1">Create your first affiliate program to get started</p>
          <button onClick={openCreate} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Create Program
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-semibold text-gray-900 truncate">{p.name}</h4>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-1">{p.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        {p.commission_type === "percentage" ? <Percent size={14} className="text-indigo-500" /> : <DollarSign size={14} className="text-indigo-500" />}
                        <span className="font-medium">
                          {p.commission_type === "percentage" ? `${p.commission_value}%` : `$${p.commission_value}`}
                        </span>
                        <span className="text-gray-400">commission</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock size={14} className="text-amber-500" />
                        <span>{p.cookie_duration}d cookie</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users size={14} className="text-green-500" />
                        <span>{p.affiliate_count} affiliates</span>
                        <span className="text-gray-400">({p.active_affiliate_count} active)</span>
                      </div>
                      {p.auto_approve && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <Shield size={14} />
                          <span>Auto-approve</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title={p.status === "active" ? "Pause" : "Activate"}
                    >
                      {p.status === "active" ? <PauseCircle size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editId ? "Edit Program" : "Create Program"} onClose={() => setShowModal(false)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Standard Affiliate Program"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
              <select
                value={form.commission_type}
                onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Value</label>
              <input
                type="number"
                value={form.commission_value}
                onChange={e => setForm(f => ({ ...f, commission_value: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cookie Duration (days)</label>
            <input
              type="number"
              value={form.cookie_duration}
              onChange={e => setForm(f => ({ ...f, cookie_duration: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-approve Affiliates</label>
              <p className="text-xs text-gray-400">Automatically approve new affiliate signups</p>
            </div>
            <Toggle on={form.auto_approve} onChange={v => setForm(f => ({ ...f, auto_approve: v }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the program benefits..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : editId ? "Update Program" : "Create Program"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal title="Delete Program" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this program? Affiliates assigned to this program will be unassigned. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setDeleteConfirm(null)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Delete Program
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
