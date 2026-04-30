"use client";

import { useState } from "react";
import {
  HelpCircle, Plus, Copy, Check, Trash2, GripVertical, ChevronDown,
  Mail, BarChart2, Link2, Zap, Settings2, Eye, EyeOff, ExternalLink
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell
} from "recharts";

interface Props {
  brandId: string;
  quizzes: any[];
  responses: any[];
}

const TABS = ["Overview", "Quiz Builder", "Analytics", "Integrations"] as const;
type Tab = typeof TABS[number];

const QUESTION_TYPES = ["single", "multi", "text", "emoji", "image-grid", "slider"] as const;

const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

/* ─── Small helpers ─────────────────────────────── */
function Badge({ label, color = "gray" }: { label: string; color?: "green" | "yellow" | "gray" }) {
  const cls = color === "green"
    ? "bg-green-100 text-green-700"
    : color === "yellow"
    ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-600";
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ─── Overview Tab ──────────────────────────────── */
function OverviewTab({ quizzes, responses }: { quizzes: any[]; responses: any[] }) {
  const active = quizzes.filter(q => q.is_active).length;
  const totalResp = responses.length;
  const withEmail = responses.filter(r => r.email).length;
  const withPurchase = responses.filter(r => r.converted).length;
  const emailRate = totalResp > 0 ? ((withEmail / totalResp) * 100).toFixed(1) : "0.0";
  const convRate = totalResp > 0 ? ((withPurchase / totalResp) * 100).toFixed(1) : "0.0";
  const revenue = responses.reduce((s, r) => s + Number(r.revenue ?? 0), 0);

  const kpis = [
    { label: "Active quizzes", value: String(active) },
    { label: "Responses (30d)", value: String(totalResp) },
    { label: "Email capture rate", value: `${emailRate}%` },
    { label: "Purchase conversion", value: `${convRate}%` },
    { label: "Revenue attributed", value: `$${revenue.toLocaleString()}` },
  ];

  const quickStart = [
    { title: "Skin type quiz", desc: "5 questions · email gate · product match", icon: "✨" },
    { title: "Goals & needs quiz", desc: "6 questions · score-based results", icon: "🎯" },
    { title: "Product finder quiz", desc: "8 questions · direct recommendations", icon: "🔍" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-xl font-bold text-gray-900">{k.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-3">Quick-start templates</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {quickStart.map(q => (
            <div key={q.title} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-start hover:border-indigo-300 cursor-pointer transition">
              <span className="text-2xl">{q.icon}</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">{q.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{q.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Question Builder ──────────────────────────── */
function QuestionRow({ q, idx, onRemove }: { q: any; idx: number; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <span className="text-xs font-medium text-indigo-600 w-5">Q{idx + 1}</span>
        <span className="text-sm text-gray-800 flex-1 truncate">{q.text || "New question"}</span>
        <Badge label={q.type} />
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="p-1 hover:text-red-500 text-gray-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2">
          <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Question text" defaultValue={q.text} />
          <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Image URL (optional)" />
          {(q.type === "single" || q.type === "multi") && (
            <div className="space-y-1">
              {["Option A", "Option B", "Option C"].map((opt, i) => (
                <div key={i} className="flex gap-1.5">
                  <input className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" defaultValue={opt} />
                  <select className="text-xs border border-gray-200 rounded-lg px-2 text-gray-500">
                    <option>No jump</option>
                    <option>→ Q2</option>
                    <option>→ Q3</option>
                    <option>→ Results</option>
                  </select>
                </div>
              ))}
              <button className="text-xs text-indigo-500 hover:text-indigo-700">+ Add option</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Quiz Builder Tab ──────────────────────────── */
function QuizBuilderTab({ quizzes, responses }: { quizzes: any[]; responses: any[] }) {
  const [building, setBuilding] = useState(false);
  const [questions, setQuestions] = useState<any[]>([
    { id: 1, type: "single", text: "What's your skin type?" },
    { id: 2, type: "multi", text: "What are your skincare goals?" },
  ]);

  const embedCode = (id: string) =>
    `<script src="https://cdn.yourapp.com/quiz.js" data-quiz-id="${id}"></script>`;

  if (building) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">New Quiz</h2>
          <button onClick={() => setBuilding(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quiz title</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. Find Your Perfect Routine" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">CTA button text</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="See my results" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Answer 5 quick questions…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Cover image URL</label>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="https://…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Result type</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option>Product recommendations</option>
              <option>Score-based</option>
              <option>Custom message</option>
            </select>
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Questions</span>
            <div className="flex gap-1.5">
              {QUESTION_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setQuestions(qs => [...qs, { id: Date.now(), type: t, text: "" }])}
                  className="text-[11px] px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <QuestionRow key={q.id} q={q} idx={i} onRemove={() => setQuestions(qs => qs.filter(x => x.id !== q.id))} />
            ))}
          </div>
        </div>

        {/* Email gate */}
        <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-indigo-500" /> Email gate</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked className="peer sr-only" />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
            </label>
          </div>
          <select className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option>Before results</option>
            <option>As first question</option>
          </select>
        </div>

        {/* Product rules */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Product recommendation rules</div>
          <div className="space-y-1.5">
            {[{ tag: "oily", score: 3 }, { tag: "dry", score: 2 }].map(r => (
              <div key={r.tag} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="font-medium">If tag</span>
                <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5">{r.tag}</span>
                <span>score &gt;</span>
                <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5">{r.score}</span>
                <span className="text-gray-400">→ show collection</span>
                <input className="flex-1 border-b border-dashed border-gray-300 bg-transparent focus:outline-none" placeholder="collection-handle" />
              </div>
            ))}
            <button className="text-xs text-indigo-500 hover:text-indigo-700">+ Add rule</button>
          </div>
        </div>

        {/* Embed */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Embed snippet</div>
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-2.5">
            <code className="text-xs text-green-400 flex-1 truncate">{embedCode("quiz_new")}</code>
            <CopyButton text={embedCode("quiz_new")} />
          </div>
        </div>

        <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
          Publish Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setBuilding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> New Quiz
        </button>
      </div>
      {quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No quizzes yet — create your first above.</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => {
            const qr = responses.filter(r => r.quiz_id === quiz.id);
            const emailRate = qr.length > 0 ? ((qr.filter(r => r.email).length / qr.length) * 100).toFixed(0) : "0";
            return (
              <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{quiz.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{quiz.quiz_questions?.length ?? 0} questions · {qr.length} responses · {emailRate}% email capture</div>
                    {quiz.embed_url && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <code className="text-[11px] text-gray-400 truncate max-w-xs">{quiz.embed_url}</code>
                        <CopyButton text={quiz.embed_url} />
                        <a href={quiz.embed_url} target="_blank" rel="noreferrer" className="p-1 text-gray-400 hover:text-indigo-500"><ExternalLink className="w-3 h-3" /></a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge label={quiz.is_active ? "active" : "draft"} color={quiz.is_active ? "green" : "yellow"} />
                    <button className="text-xs text-indigo-500 hover:underline">Edit</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Analytics Tab ─────────────────────────────── */
function AnalyticsTab({ quizzes, responses }: { quizzes: any[]; responses: any[] }) {
  const [selectedQuiz, setSelectedQuiz] = useState(quizzes[0]?.id ?? null);

  const funnelData = [
    { name: "Started", value: 420, fill: FUNNEL_COLORS[0] },
    { name: "Q2", value: 390, fill: FUNNEL_COLORS[1] },
    { name: "Q3", value: 340, fill: FUNNEL_COLORS[2] },
    { name: "Completed", value: 280, fill: FUNNEL_COLORS[3] },
    { name: "Email given", value: 195, fill: FUNNEL_COLORS[4] },
    { name: "Purchased", value: 62, fill: FUNNEL_COLORS[5] },
  ];

  const answerData = [
    { answer: "Oily", count: 142 },
    { answer: "Dry", count: 98 },
    { answer: "Combination", count: 115 },
    { answer: "Normal", count: 65 },
    { answer: "Sensitive", count: 80 },
  ];

  const topProducts = [
    { product: "Hydrating Serum", recommended: 124, purchased: 41 },
    { product: "Oil Control SPF", recommended: 98, purchased: 38 },
    { product: "Gentle Cleanser", recommended: 87, purchased: 29 },
    { product: "Retinol Night Cream", recommended: 56, purchased: 18 },
  ];

  const emailList = responses.filter(r => r.email).slice(0, 8);

  return (
    <div className="space-y-6">
      {quizzes.length > 1 && (
        <div className="flex gap-2">
          {quizzes.map(q => (
            <button
              key={q.id}
              onClick={() => setSelectedQuiz(q.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedQuiz === q.id ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}
            >
              {q.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Completion funnel</div>
          <div className="space-y-1.5">
            {funnelData.map((step, i) => (
              <div key={step.name} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-500 text-right">{step.name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(step.value / funnelData[0].value) * 100}%`, background: step.fill }}
                  >
                    <span className="text-white text-[11px] font-semibold">{step.value}</span>
                  </div>
                </div>
                <div className="w-12 text-xs text-gray-400 text-right">
                  {i === 0 ? "100%" : `${((step.value / funnelData[0].value) * 100).toFixed(0)}%`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Answer distribution — Q1</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={answerData} layout="vertical" margin={{ left: 60, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="answer" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Top recommended products</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Product</th>
              <th className="text-right pb-2 font-medium">Recommended</th>
              <th className="text-right pb-2 font-medium">Purchased</th>
              <th className="text-right pb-2 font-medium">Conv %</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map(p => (
              <tr key={p.product} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 text-gray-800">{p.product}</td>
                <td className="py-2 text-right text-gray-600">{p.recommended}</td>
                <td className="py-2 text-right text-gray-600">{p.purchased}</td>
                <td className="py-2 text-right font-semibold text-indigo-600">{((p.purchased / p.recommended) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email captures */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Email captures</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Email</th>
              <th className="text-left pb-2 font-medium">Answered</th>
              <th className="text-left pb-2 font-medium">Result</th>
              <th className="text-left pb-2 font-medium">Purchased</th>
            </tr>
          </thead>
          <tbody>
            {emailList.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">No email captures yet</td></tr>
            ) : (
              emailList.map((r, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-700">{r.email}</td>
                  <td className="py-1.5 text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-1.5 text-gray-600">{r.result ?? "—"}</td>
                  <td className="py-1.5">{r.converted ? <Check className="w-3.5 h-3.5 text-green-500" /> : <span className="text-gray-300">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Integrations Tab ──────────────────────────── */
function IntegrationsTab() {
  const [klaviyoId, setKlaviyoId] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const save = (key: string) => {
    setSaving(key);
    setTimeout(() => setSaving(null), 1500);
  };

  const integrations = [
    {
      key: "klaviyo",
      name: "Klaviyo",
      icon: "📧",
      desc: "Sync email captures to a Klaviyo list and trigger flows based on quiz results.",
      field: <input value={klaviyoId} onChange={e => setKlaviyoId(e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Klaviyo List ID (e.g. abc123)" />,
    },
    {
      key: "shopify",
      name: "Shopify customer tags",
      icon: "🛍️",
      desc: "Automatically tag Shopify customers with their quiz result (e.g. 'quiz-oily-skin').",
      field: <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4" /> Auto-tag on quiz completion</label>,
    },
    {
      key: "judgeme",
      name: "Judge.me reviews",
      icon: "⭐",
      desc: "Send a review request 7 days after purchase for the recommended product.",
      field: <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="accent-indigo-600 w-4 h-4" /> Enable review requests</label>,
    },
    {
      key: "meta",
      name: "Meta Custom Audience",
      icon: "📡",
      desc: "Sync captured emails to a Meta Custom Audience for retargeting.",
      field: <input className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Meta Ad Account ID" />,
    },
  ];

  return (
    <div className="space-y-4">
      {integrations.map(int => (
        <div key={int.key} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{int.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">{int.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 mb-3">{int.desc}</div>
              <div className="flex items-center gap-2">
                {int.field}
                <button
                  onClick={() => save(int.key)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex-shrink-0"
                >
                  {saving === int.key ? <Check className="w-4 h-4" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Root Component ────────────────────────────── */
export default function QuizClient({ brandId, quizzes, responses }: Props) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab quizzes={quizzes} responses={responses} />}
      {tab === "Quiz Builder" && <QuizBuilderTab quizzes={quizzes} responses={responses} />}
      {tab === "Analytics" && <AnalyticsTab quizzes={quizzes} responses={responses} />}
      {tab === "Integrations" && <IntegrationsTab />}
    </div>
  );
}
