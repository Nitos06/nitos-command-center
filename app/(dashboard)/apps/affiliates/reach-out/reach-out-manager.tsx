"use client";

import { useState } from "react";
import {
  Mail, Send, Users, Plus, Edit2, Trash2, Copy, CheckCircle2, UserPlus,
  Globe, Link2, Share2, X, Search, FileText, BarChart2, TrendingUp,
  ArrowUpRight, Eye, ExternalLink, Inbox, MailOpen, Activity,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  sent_count: number;
  created_at: string;
}

interface Stats {
  totalInvitesSent: number;
  signedUp: number;
  activeFromInvite: number;
  signupRate: number;
  activeRate: number;
}

interface Props {
  brandId: string;
  templates: Template[];
  stats: Stats;
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

const VARIABLES = [
  { tag: "{{affiliate_name}}", desc: "Recipient's name" },
  { tag: "{{commission_rate}}", desc: "Program commission rate" },
  { tag: "{{signup_link}}", desc: "Unique signup URL" },
  { tag: "{{brand_name}}", desc: "Your brand name" },
];

const emptyTemplate = {
  name: "",
  subject: "",
  body: "",
};

export default function ReachOutManager({ brandId, templates: initialTemplates, stats }: Props) {
  const [activeTab, setActiveTab] = useState<"templates" | "bulk" | "analytics" | "share">("templates");
  const [templates, setTemplates] = useState(initialTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTemplate);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkTemplateId, setBulkTemplateId] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSent, setBulkSent] = useState(false);

  // Share link state
  const [copied, setCopied] = useState(false);
  const signupUrl = typeof window !== "undefined"
    ? `${window.location.origin}/affiliate/signup?brand=${brandId}`
    : `/affiliate/signup?brand=${brandId}`;

  const tabs = [
    { key: "templates", label: "Templates", icon: FileText },
    { key: "bulk", label: "Bulk Invite", icon: Send },
    { key: "analytics", label: "Analytics", icon: BarChart2 },
    { key: "share", label: "Share Links", icon: Share2 },
  ] as const;

  const openCreate = () => {
    setForm(emptyTemplate);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setForm({ name: t.name, subject: t.subject, body: t.body });
    setEditId(t.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/affiliates/outreach", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editId, type: "template", brand_id: brandId }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (editId) {
          setTemplates(prev => prev.map(t => t.id === editId ? { ...t, ...saved } : t));
        } else {
          setTemplates(prev => [{ ...saved, sent_count: 0 }, ...prev]);
        }
        setShowModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    await fetch("/api/affiliates/outreach", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, brand_id: brandId }),
    });
  };

  const handleBulkSend = async () => {
    setBulkSending(true);
    try {
      const emails = bulkEmails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
      await fetch("/api/affiliates/outreach/bulk-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, template_id: bulkTemplateId, brand_id: brandId }),
      });
      setBulkSent(true);
      setTimeout(() => setBulkSent(false), 3000);
      setBulkEmails("");
    } finally {
      setBulkSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertVariable = (tag: string) => {
    setForm(f => ({ ...f, body: f.body + tag }));
  };

  const emailCount = bulkEmails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Send size={16} />
            <span className="text-xs font-medium">Invites Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalInvitesSent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <UserPlus size={16} />
            <span className="text-xs font-medium">Signups</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.signedUp}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-medium">Signup Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.signupRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Activity size={16} />
            <span className="text-xs font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeFromInvite}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-xs font-medium">Active Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeRate}%</p>
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

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Email Templates</h3>
            <button
              onClick={openCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Create Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Mail className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-sm text-gray-500 font-medium">No templates yet</p>
              <p className="text-xs text-gray-400 mt-1">Create email templates to streamline affiliate outreach</p>
              <button onClick={openCreate} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Create Template
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={16} className="text-indigo-500 flex-shrink-0" />
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="text-gray-400">Subject:</span> {t.subject}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">{t.body}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Send size={12} /> Sent {t.sent_count || 0} times
                          </span>
                          <span className="text-xs text-gray-400">
                            Created {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEdit(t)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {/* Preview expanded */}
                    {previewId === t.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2">PREVIEW</p>
                        <p className="text-sm font-semibold text-gray-900 mb-1">Subject: {t.subject}</p>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap">{t.body}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk Invite Tab */}
      {activeTab === "bulk" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Bulk Invite Affiliates</h3>
            <p className="text-sm text-gray-500 mb-4">Send invitations to multiple potential affiliates at once</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Addresses</label>
                <textarea
                  value={bulkEmails}
                  onChange={e => setBulkEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas, semicolons, or new lines..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">{emailCount} email{emailCount !== 1 ? "s" : ""} detected</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
                <select
                  value={bulkTemplateId}
                  onChange={e => setBulkTemplateId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No templates available. Create one in the Templates tab first.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Inbox size={16} />
                  <span>Emails will be sent via your configured email provider</span>
                </div>
                <button
                  onClick={handleBulkSend}
                  disabled={bulkSending || !bulkEmails.trim() || !bulkTemplateId}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {bulkSending ? (
                    <>Sending...</>
                  ) : bulkSent ? (
                    <><CheckCircle2 size={16} /> Sent!</>
                  ) : (
                    <><Send size={16} /> Send Invites</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Invite Tips */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Recruitment Tips</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>Personalize emails by using template variables like {"{{affiliate_name}}"}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>Highlight your commission rate and cookie duration in the subject line</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>Target influencers and bloggers in your niche for the highest ROI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>Follow up with unresponsive leads after 3-5 days</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Send size={18} className="text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Outreach Pipeline</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Invites Sent</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalInvitesSent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Signed Up</span>
                  <span className="text-sm font-semibold text-green-600">{stats.signedUp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="text-sm font-semibold text-blue-600">{stats.activeFromInvite}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Conversion Funnel</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Invite to Signup</span>
                    <span className="text-xs font-semibold text-gray-900">{stats.signupRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, stats.signupRate)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Signup to Active</span>
                    <span className="text-xs font-semibold text-gray-900">{stats.activeRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, stats.activeRate)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">End-to-End</span>
                    <span className="text-xs font-semibold text-gray-900">{stats.totalInvitesSent > 0 ? Math.round((stats.activeFromInvite / stats.totalInvitesSent) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${stats.totalInvitesSent > 0 ? Math.min(100, (stats.activeFromInvite / stats.totalInvitesSent) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText size={18} className="text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Template Performance</span>
              </div>
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-400">No templates to analyze</p>
                ) : (
                  templates.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate flex-1 mr-2">{t.name}</span>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{t.sent_count || 0} sent</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Links Tab */}
      {activeTab === "share" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Affiliate Signup Page</h3>
            <p className="text-sm text-gray-500 mb-4">Share this link so potential affiliates can sign up for your program</p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
                {signupUrl}
              </div>
              <button
                onClick={() => copyToClipboard(signupUrl)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Social Share */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Share on Social Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join%20our%20affiliate%20program!&url=${encodeURIComponent(signupUrl)}`, "_blank")}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <ExternalLink size={16} /> X / Twitter
              </button>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(signupUrl)}`, "_blank")}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <ExternalLink size={16} /> Facebook
              </button>
              <button
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(signupUrl)}`, "_blank")}
                className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <ExternalLink size={16} /> LinkedIn
              </button>
              <button
                onClick={() => window.open(`mailto:?subject=Join%20our%20affiliate%20program&body=Sign%20up%20here:%20${encodeURIComponent(signupUrl)}`, "_blank")}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <Mail size={16} /> Email
              </button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Embed on Your Website</h3>
            <p className="text-sm text-gray-500 mb-3">Add this HTML to your website to link to your affiliate signup page</p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono">
{`<a href="${signupUrl}"
   style="display:inline-block;padding:12px 24px;
   background:#4f46e5;color:#fff;border-radius:8px;
   text-decoration:none;font-weight:600;">
  Join Our Affiliate Program
</a>`}
              </pre>
              <button
                onClick={() => copyToClipboard(`<a href="${signupUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Join Our Affiliate Program</a>`)}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showModal && (
        <Modal title={editId ? "Edit Template" : "Create Template"} onClose={() => setShowModal(false)} wide>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Welcome Invitation"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
            <input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g., Earn commissions promoting our products!"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Email Body</label>
              <div className="flex gap-1">
                {VARIABLES.map(v => (
                  <button
                    key={v.tag}
                    onClick={() => insertVariable(v.tag)}
                    className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-mono hover:bg-indigo-100 transition-colors"
                    title={v.desc}
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder={`Hi {{affiliate_name}},\n\nWe'd love for you to join our affiliate program! Earn {{commission_rate}} on every sale you refer.\n\nSign up here: {{signup_link}}\n\nBest regards`}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Available variables: {VARIABLES.map(v => v.tag).join(", ")}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.subject.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : editId ? "Update Template" : "Create Template"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
