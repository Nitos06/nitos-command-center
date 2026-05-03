"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Search, Filter, ChevronDown, ChevronRight,
  Bot, Send, Loader2, CheckCircle2, Clock, HelpCircle,
} from "lucide-react";

interface Question {
  id: string;
  product_title?: string;
  product_id?: string;
  customer_name?: string;
  customer_email?: string;
  question: string;
  answer?: string;
  status: "unanswered" | "answered";
  created_at: string;
  answered_at?: string;
  brand_id: string;
}

interface Props {
  brandId: string;
  questions: Question[];
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "success" | "warn" | "default" }) {
  const cls = {
    success: "bg-green-100 text-green-700",
    warn: "bg-amber-100 text-amber-700",
    default: "bg-gray-100 text-gray-600",
  }[variant];
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

export default function QAManager({ brandId, questions }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unanswered" | "answered">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState(questions);

  const filtered = useMemo(() => localQuestions.filter(q => {
    if (search && !`${q.customer_name} ${q.question} ${q.product_title}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    return true;
  }), [localQuestions, search, statusFilter]);

  const unansweredCount = localQuestions.filter(q => q.status === "unanswered").length;
  const answeredCount = localQuestions.filter(q => q.status === "answered").length;

  async function submitAnswer(id: string) {
    const text = replyTexts[id]?.trim();
    if (!text) return;
    setSaving(id);
    try {
      await fetch("/api/apps/reviews/qa/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, answer: text, brandId }),
      });
      setLocalQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, answer: text, status: "answered" as const, answered_at: new Date().toISOString() } : q
      ));
      setReplyTexts(prev => ({ ...prev, [id]: "" }));
    } finally {
      setSaving(null);
    }
  }

  async function aiAnswer(id: string, question: string, productTitle?: string) {
    setAiLoading(id);
    try {
      const res = await fetch("/api/cs/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          message: `Answer this customer product question concisely and helpfully. Product: ${productTitle || "N/A"}. Question: ${question}`,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setReplyTexts(prev => ({ ...prev, [id]: data.reply }));
      }
    } finally {
      setAiLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 py-2.5 px-3 text-center">
          <div className="text-lg font-bold text-gray-900">{localQuestions.length}</div>
          <div className="text-[10px] text-gray-500">Total Questions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 py-2.5 px-3 text-center">
          <div className="text-lg font-bold text-amber-600">{unansweredCount}</div>
          <div className="text-[10px] text-gray-500">Unanswered</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 py-2.5 px-3 text-center">
          <div className="text-lg font-bold text-green-600">{answeredCount}</div>
          <div className="text-[10px] text-gray-500">Answered</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "unanswered", "answered"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                statusFilter === s
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {s === "all" ? "All" : s === "unanswered" ? `Unanswered (${unansweredCount})` : `Answered (${answeredCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
            <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="text-xs text-gray-400">No questions match your filters.</div>
          </div>
        )}
        {filtered.map(q => {
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Question header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50/40 transition-colors"
              >
                <div className="mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-900">{q.customer_name || "Anonymous"}</span>
                    <Badge variant={q.status === "answered" ? "success" : "warn"}>
                      {q.status === "answered" ? "Answered" : "Unanswered"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-700 line-clamp-1">{q.question}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {q.product_title && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{q.product_title}</span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded answer area */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-3 bg-gray-50/30">
                  <div className="mb-2">
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Question</div>
                    <div className="text-xs text-gray-700">{q.question}</div>
                  </div>

                  {q.answer && (
                    <div className="mb-3 bg-green-50 rounded-lg p-2.5 border border-green-100">
                      <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">
                        Current Answer
                      </div>
                      <div className="text-xs text-gray-700">{q.answer}</div>
                      {q.answered_at && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Answered {new Date(q.answered_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {q.answer ? "Update Answer" : "Your Answer"}
                    </div>
                    <textarea
                      value={replyTexts[q.id] || ""}
                      onChange={e => setReplyTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your answer..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => aiAnswer(q.id, q.question, q.product_title)}
                        disabled={aiLoading === q.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
                      >
                        {aiLoading === q.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Bot className="w-3 h-3" />
                        )}
                        AI Answer
                      </button>
                      <button
                        onClick={() => submitAnswer(q.id)}
                        disabled={!replyTexts[q.id]?.trim() || saving === q.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-xs text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 ml-auto"
                      >
                        {saving === q.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {q.answer ? "Update" : "Submit Answer"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
