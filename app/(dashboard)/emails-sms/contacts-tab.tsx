"use client";

import { useState, useEffect } from "react";
import { Search, Filter, UserCircle, Mail, ShoppingBag, Tag, ChevronRight, Download } from "lucide-react";

interface Contact {
  id: string;
  email: string;
  name?: string;
  source?: string;
  subscribed: boolean;
  tags?: string[];
  total_orders?: number;
  total_spent?: number;
  rfm_score?: string;
  last_order_at?: string;
  emails_opened?: number;
  emails_sent?: number;
  created_at?: string;
}

export function ContactsTab({ brandId }: { brandId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const limit = 25;

  useEffect(() => {
    fetchContacts();
  }, [brandId, page, search]);

  async function fetchContacts() {
    setLoading(true);
    const params = new URLSearchParams({
      brandId,
      limit: String(limit),
      offset: String(page * limit),
      ...(search ? { search } : {}),
    });
    const res = await fetch(`/api/email/contacts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }

  function rfmBadge(score?: string) {
    if (!score) return null;
    const [r] = score.split("-").map(Number);
    const color = r >= 4 ? "bg-green-100 text-green-700" : r >= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
    return <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${color}`}>{score}</span>;
  }

  return (
    <div className="space-y-3">
      {/* Search & filter bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-white"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <span className="text-xs text-[var(--text-secondary)]">{total} contacts</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-tint)]">
              <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">Contact</th>
              <th className="text-left px-3 py-2.5 font-medium text-[var(--text-secondary)]">Source</th>
              <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)]">Orders</th>
              <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)]">Spent</th>
              <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)]">RFM</th>
              <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)]">Engagement</th>
              <th className="text-center px-3 py-2.5 font-medium text-[var(--text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">No contacts found</td></tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-tint)] cursor-pointer" onClick={() => setSelectedContact(c.id)}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-[var(--text-secondary)]" />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{c.name || c.email}</div>
                        {c.name && <div className="text-[10px] text-[var(--text-secondary)]">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                      {c.source ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">{c.total_orders ?? 0}</td>
                  <td className="px-3 py-2.5 text-center">${(c.total_spent ?? 0).toFixed(0)}</td>
                  <td className="px-3 py-2.5 text-center">{rfmBadge(c.rfm_score)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-[10px]">
                      {c.emails_opened ?? 0}/{c.emails_sent ?? 0} opened
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${c.subscribed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {c.subscribed ? "Active" : "Unsubscribed"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg disabled:opacity-40">
            Previous
          </button>
          <span className="text-xs text-[var(--text-secondary)]">
            Page {page + 1} of {Math.ceil(total / limit)}
          </span>
          <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total}
            className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {/* Contact detail slide-over would go here */}
      {selectedContact && (
        <ContactDetail contactId={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  );
}

function ContactDetail({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/email/contacts/${contactId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [contactId]);

  if (loading || !data) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-[var(--border)] shadow-xl z-50 p-6">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  const { contact, segments, events } = data;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-[var(--border)] shadow-xl z-50 overflow-y-auto">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{contact.name || contact.email}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{contact.email}</p>
          </div>
          <button onClick={onClose} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Orders", value: contact.total_orders ?? 0 },
            { label: "Spent", value: `$${(contact.total_spent ?? 0).toFixed(0)}` },
            { label: "RFM", value: contact.rfm_score ?? "—" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 bg-[var(--surface-tint)] rounded-lg">
              <div className="text-sm font-bold text-[var(--text-primary)]">{s.value}</div>
              <div className="text-[10px] text-[var(--text-secondary)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Segments */}
        {segments?.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2">Segments</h4>
            <div className="flex flex-wrap gap-1">
              {segments.map((s: any) => (
                <span key={s.segment_id} className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded-full">
                  {s.segments?.name ?? s.segment_id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {contact.tags?.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div>
          <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2">Activity</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(events ?? []).slice(0, 20).map((e: any) => (
              <div key={e.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--text-primary)]">
                    {e.event_type.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {new Date(e.occurred_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {(!events || events.length === 0) && (
              <p className="text-xs text-[var(--text-secondary)]">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
