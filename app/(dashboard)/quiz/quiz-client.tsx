"use client";

import { useState } from "react";
import {
  HelpCircle, Plus, Copy, Check, Trash2, GripVertical, ChevronDown,
  Mail, BarChart2, Link2, Zap, Settings2, Eye, EyeOff, ExternalLink,
  Layout, Image, Type, ChevronUp, Star, AlignLeft, AlignCenter, AlignRight,
  Code2
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

const TABS = ["Overview", "Analytics", "Integrations", "Canvas Editor"] as const;
type Tab = typeof TABS[number];

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
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧠</span>
          <h3 className="text-base font-bold text-indigo-900">Why a Quiz is Essential for Your Store</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/70 rounded-xl p-4">
            <div className="text-indigo-500 font-bold text-sm mb-1">📧 Email Capture</div>
            <p className="text-xs text-gray-600">Gate results behind an email — convert browsers into subscribers with 40–60% opt-in rates. Every quiz completion feeds your email list automatically.</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <div className="text-green-600 font-bold text-sm mb-1">🛒 Instant Upsell</div>
            <p className="text-xs text-gray-600">Show a personalized product recommendation right after the quiz. Matched products convert 3× better than generic recommendations.</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <div className="text-purple-600 font-bold text-sm mb-1">💌 Nurture → Sales</div>
            <p className="text-xs text-gray-600">Quiz answers segment your list automatically. Send targeted flows (skin type, goals, budget) that feel personal and drive repeat purchases.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Analytics Tab ─────────────────────────────── */
function AnalyticsTab({ quizzes, responses }: { quizzes: any[]; responses: any[] }) {
  const [selectedQuiz, setSelectedQuiz] = useState(quizzes[0]?.id ?? null);

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
        <p className="text-sm text-gray-500">No quiz responses yet. Responses will appear here once your quiz is live and embedded.</p>
      </div>
    );
  }

  // Filter to selected quiz
  const quizResponses = selectedQuiz
    ? responses.filter(r => r.quiz_id === selectedQuiz)
    : responses;

  const total = quizResponses.length;
  const withEmail = quizResponses.filter(r => r.email).length;
  const withConversion = quizResponses.filter(r => r.converted).length;
  const revenue = quizResponses.reduce((s, r) => s + Number(r.revenue ?? 0), 0);
  const emailRate = total > 0 ? ((withEmail / total) * 100).toFixed(1) : "0.0";
  const convRate = total > 0 ? ((withConversion / total) * 100).toFixed(1) : "0.0";

  // Group by day for last 14 days
  const now = new Date();
  const subDays = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recentResponses = quizResponses.filter(r => r.created_at && new Date(r.created_at) > subDays);
  const byDay: Record<string, number> = {};
  recentResponses.forEach(r => {
    const day = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byDay[day] = (byDay[day] ?? 0) + 1;
  });
  const dailyData = Object.entries(byDay).map(([day, count]) => ({ day, count }));

  const emailList = quizResponses.filter(r => r.email).slice(0, 8);

  const kpis = [
    { label: "Total responses", value: String(total) },
    { label: "Email capture rate", value: `${emailRate}%` },
    { label: "Conversion rate", value: `${convRate}%` },
    { label: "Revenue attributed", value: `$${revenue.toLocaleString()}` },
  ];

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-xl font-bold text-gray-900">{k.value}</div>
          </div>
        ))}
      </div>

      {dailyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Responses — last 14 days</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData} margin={{ left: 0, right: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Email captures */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Email captures</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Email</th>
              <th className="text-left pb-2 font-medium">Date</th>
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
      {/* Embed Code section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-800">Embed Quiz on Your Store</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Copy this snippet and inject it into your Shopify homepage section or ask the agent to do it automatically.</p>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Iframe embed (recommended)</div>
            <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre">{`<div id="quiz-embed" style="width:100%;max-width:680px;margin:0 auto">
  <iframe
    src="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nitaiecompro-nine.vercel.app'}/quiz/embed/QUIZ_ID?brand_id=BRAND_ID"
    width="100%"
    height="620"
    frameborder="0"
    style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)"
  ></iframe>
</div>`}</div>
            <button onClick={() => navigator.clipboard.writeText(`<!-- Quiz Embed -->\n<div id="quiz-embed" style="width:100%;max-width:680px;margin:0 auto"><iframe src="https://nitaiecompro-nine.vercel.app/quiz/embed/QUIZ_ID?brand_id=BRAND_ID" width="100%" height="620" frameborder="0" style="border-radius:16px"></iframe></div>`)} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy snippet</button>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-medium text-gray-600 mb-1">🤖 Auto-inject via Agent</div>
            <p className="text-xs text-gray-500">The SEO/store agent can inject this directly into your Shopify homepage theme using the Shopify Theme MCP — no manual copy-paste needed.</p>
          </div>
        </div>
      </div>
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

/* ─── Quiz Canvas Editor ────────────────────────── */
type CanvasElementType =
  | 'background' | 'logo' | 'progress_bar'
  | 'question_title' | 'description' | 'image_block'
  | 'single_choice' | 'multi_choice' | 'rating' | 'input_field'
  | 'next_button' | 'submit_button' | 'skip_link';

interface CanvasElement {
  id: number;
  type: CanvasElementType;
  label: string;
  visible: boolean;
  props: Record<string, any>;
}

const ELEMENT_GROUPS: { section: string; items: { type: CanvasElementType; label: string }[] }[] = [
  {
    section: 'Layout',
    items: [
      { type: 'background', label: 'Background' },
      { type: 'logo', label: 'Logo' },
      { type: 'progress_bar', label: 'Progress bar' },
    ],
  },
  {
    section: 'Content',
    items: [
      { type: 'question_title', label: 'Question title' },
      { type: 'description', label: 'Description' },
      { type: 'image_block', label: 'Image block' },
    ],
  },
  {
    section: 'Answers',
    items: [
      { type: 'single_choice', label: 'Single choice' },
      { type: 'multi_choice', label: 'Multi-choice' },
      { type: 'rating', label: 'Rating (1–5)' },
      { type: 'input_field', label: 'Input field' },
    ],
  },
  {
    section: 'Actions',
    items: [
      { type: 'next_button', label: 'Next button' },
      { type: 'submit_button', label: 'Submit button' },
      { type: 'skip_link', label: 'Skip link' },
    ],
  },
];

function makeDefaultProps(type: CanvasElementType): Record<string, any> {
  switch (type) {
    case 'background': return { bgColor: '#ffffff', imageFile: '' };
    case 'logo': return {};
    case 'progress_bar': return { fillPct: 50, fillColor: '#6366f1' };
    case 'question_title': return { text: 'What is your skin type?', fontSize: 20, color: '#111827', align: 'left' };
    case 'description': return { text: 'Select the option that best describes you.', fontSize: 14, color: '#6b7280', align: 'left' };
    case 'image_block': return { height: 200, imageFile: '' };
    case 'single_choice': return { options: ['Oily', 'Dry', 'Combination'] };
    case 'multi_choice': return { options: ['Acne', 'Dryness', 'Wrinkles'] };
    case 'rating': return { maxStars: 5, activeColor: '#f59e0b' };
    case 'input_field': return { placeholder: 'Type your answer…' };
    case 'next_button': return { text: 'Next →', bgColor: '#6366f1', textColor: '#ffffff', borderRadius: 12 };
    case 'submit_button': return { text: 'Submit', bgColor: '#16a34a', textColor: '#ffffff', borderRadius: 12 };
    case 'skip_link': return {};
    default: return {};
  }
}

function makeCanvasElement(type: CanvasElementType, label: string): CanvasElement {
  return { id: Date.now() + Math.random(), type, label, visible: true, props: makeDefaultProps(type) };
}

const DEFAULT_CANVAS: CanvasElement[] = [
  makeCanvasElement('progress_bar', 'Progress bar'),
  makeCanvasElement('question_title', 'Question title'),
  makeCanvasElement('single_choice', 'Single choice'),
  makeCanvasElement('next_button', 'Next button'),
];

function CanvasElementPreview({ el, isSelected, onClick }: { el: CanvasElement; isSelected: boolean; onClick: () => void }) {
  const ring = isSelected ? 'ring-2 ring-indigo-500' : '';
  const base = `cursor-pointer ${ring}`;

  switch (el.type) {
    case 'background':
      return (
        <div onClick={onClick} className={`absolute inset-0 ${base}`} style={{ background: el.props.bgColor || '#f3f4f6', zIndex: 0 }}>
          {!el.props.imageFile && (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>
      );
    case 'logo':
      return (
        <div onClick={onClick} className={`flex justify-center pt-6 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      );
    case 'progress_bar':
      return (
        <div onClick={onClick} className={`px-4 py-3 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 rounded-full" style={{ width: `${el.props.fillPct}%`, background: el.props.fillColor }} />
          </div>
        </div>
      );
    case 'question_title':
      return (
        <div onClick={onClick} className={`px-6 pt-6 pb-2 ${base}`} style={{ position: 'relative', zIndex: 1, textAlign: el.props.align || 'left' }}>
          <p style={{ fontSize: el.props.fontSize, fontWeight: 700, color: el.props.color }}>{el.props.text}</p>
        </div>
      );
    case 'description':
      return (
        <div onClick={onClick} className={`px-6 pb-4 ${base}`} style={{ position: 'relative', zIndex: 1, textAlign: el.props.align || 'left' }}>
          <p style={{ fontSize: el.props.fontSize, color: el.props.color }}>{el.props.text}</p>
        </div>
      );
    case 'image_block':
      return (
        <div onClick={onClick} className={`mx-4 mb-4 bg-gray-200 rounded-xl flex items-center justify-center ${base}`} style={{ height: el.props.height, position: 'relative', zIndex: 1 }}>
          <Image className="w-10 h-10 text-gray-400" />
        </div>
      );
    case 'single_choice':
      return (
        <div onClick={onClick} className={`px-4 pb-4 space-y-2 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          {(el.props.options || []).map((opt: string, i: number) => (
            <div key={i} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-700 bg-white">{opt}</div>
          ))}
        </div>
      );
    case 'multi_choice':
      return (
        <div onClick={onClick} className={`px-4 pb-4 space-y-2 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          {(el.props.options || []).map((opt: string, i: number) => (
            <div key={i} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-700 bg-white flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0" />
              {opt}
            </div>
          ))}
        </div>
      );
    case 'rating':
      return (
        <div onClick={onClick} className={`flex justify-center gap-2 py-4 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          {Array.from({ length: el.props.maxStars || 5 }).map((_, i) => (
            <Star key={i} className="w-8 h-8" style={{ color: i < 3 ? el.props.activeColor : '#d1d5db' }} fill={i < 3 ? el.props.activeColor : 'none'} />
          ))}
        </div>
      );
    case 'input_field':
      return (
        <div onClick={onClick} className={`mx-4 mb-4 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-400">{el.props.placeholder}</div>
        </div>
      );
    case 'next_button':
      return (
        <div onClick={onClick} className={`mx-4 mb-3 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-full h-12 rounded-xl flex items-center justify-center text-sm font-semibold" style={{ background: el.props.bgColor, color: el.props.textColor, borderRadius: el.props.borderRadius }}>
            {el.props.text}
          </div>
        </div>
      );
    case 'submit_button':
      return (
        <div onClick={onClick} className={`mx-4 mb-3 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-full h-12 rounded-xl flex items-center justify-center text-sm font-semibold" style={{ background: el.props.bgColor, color: el.props.textColor, borderRadius: el.props.borderRadius }}>
            {el.props.text}
          </div>
        </div>
      );
    case 'skip_link':
      return (
        <div onClick={onClick} className={`flex justify-center pb-4 ${base}`} style={{ position: 'relative', zIndex: 1 }}>
          <span className="text-sm text-gray-400">Skip this question →</span>
        </div>
      );
    default:
      return <div onClick={onClick} className={`px-4 py-2 text-xs text-gray-400 ${base}`}>{el.label}</div>;
  }
}

function CanvasPropertiesPanel({ el, onChange }: { el: CanvasElement; onChange: (updated: CanvasElement) => void }) {
  const set = (key: string, val: any) => onChange({ ...el, props: { ...el.props, [key]: val } });
  const setRoot = (key: keyof CanvasElement, val: any) => onChange({ ...el, [key]: val } as CanvasElement);

  return (
    <div className="p-3 space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Display name</label>
        <input value={el.label} onChange={e => setRoot('label', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Visible</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={el.visible} onChange={e => setRoot('visible', e.target.checked)} className="peer sr-only" />
          <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
        </label>
      </div>

      {el.type === 'background' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Color</label>
            <input type="color" value={el.props.bgColor || '#ffffff'} onChange={e => set('bgColor', e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
          <button className="text-xs text-indigo-600 hover:underline">Upload image</button>
        </>
      )}

      {(el.type === 'question_title' || el.type === 'description') && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Text</label>
            <textarea value={el.props.text} onChange={e => set('text', e.target.value)} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Font size</label>
            <select value={el.props.fontSize} onChange={e => set('fontSize', Number(e.target.value))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {[14, 16, 18, 20, 24].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Color</label>
            <input type="color" value={el.props.color || '#111827'} onChange={e => set('color', e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Align</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onClick={() => set('align', a)} className={`flex-1 py-1 rounded border text-xs ${el.props.align === a ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                  {a === 'left' ? <AlignLeft className="w-3 h-3 mx-auto" /> : a === 'center' ? <AlignCenter className="w-3 h-3 mx-auto" /> : <AlignRight className="w-3 h-3 mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {(el.type === 'single_choice' || el.type === 'multi_choice') && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Options</label>
          <div className="space-y-1">
            {(el.props.options || []).map((opt: string, i: number) => (
              <div key={i} className="flex gap-1">
                <input value={opt} onChange={e => { const opts = [...el.props.options]; opts[i] = e.target.value; set('options', opts); }} className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={() => { const opts = el.props.options.filter((_: any, j: number) => j !== i); set('options', opts); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => set('options', [...(el.props.options || []), 'New option'])} className="text-xs text-indigo-500 hover:text-indigo-700">+ Add option</button>
          </div>
        </div>
      )}

      {(el.type === 'next_button' || el.type === 'submit_button') && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Button text</label>
            <input value={el.props.text} onChange={e => set('text', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">BG color</label>
            <input type="color" value={el.props.bgColor} onChange={e => set('bgColor', e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Text color</label>
            <input type="color" value={el.props.textColor} onChange={e => set('textColor', e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Border radius: {el.props.borderRadius}px</label>
            <input type="range" min={0} max={24} value={el.props.borderRadius} onChange={e => set('borderRadius', Number(e.target.value))} className="w-full" />
          </div>
        </>
      )}

      {el.type === 'progress_bar' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fill: {el.props.fillPct}%</label>
            <input type="range" min={0} max={100} value={el.props.fillPct} onChange={e => set('fillPct', Number(e.target.value))} className="w-full" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Fill color</label>
            <input type="color" value={el.props.fillColor} onChange={e => set('fillColor', e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}

      {el.type === 'logo' && (
        <button className="text-xs text-indigo-600 hover:underline">Upload logo</button>
      )}

      {el.type === 'image_block' && (
        <>
          <button className="text-xs text-indigo-600 hover:underline">Upload image</button>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Height: {el.props.height}px</label>
            <input type="range" min={100} max={400} value={el.props.height} onChange={e => set('height', Number(e.target.value))} className="w-full" />
          </div>
        </>
      )}

      {el.type === 'rating' && (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Max stars</label>
            <select value={el.props.maxStars} onChange={e => set('maxStars', Number(e.target.value))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {[3, 5, 10].map(n => <option key={n} value={n}>{n} stars</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Active color</label>
            <input type="color" value={el.props.activeColor} onChange={e => set('activeColor', e.target.value)} className="w-10 h-7 rounded border border-gray-200 cursor-pointer" />
          </div>
        </>
      )}
    </div>
  );
}

{/* NOTE: When a visitor submits the quiz on the live embed page (/quiz/embed/[id]),
    the submission POSTs to /api/quiz/submit which saves quiz_responses AND
    adds the email to email_contacts + quiz_takers segment automatically. */}
function QuizCanvasEditor({ brandId, quizId }: { brandId: string; quizId?: string }) {
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>(DEFAULT_CANVAS.map(e => ({ ...e, id: Date.now() + Math.random(), props: { ...e.props } })));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedEl = canvasElements.find(e => e.id === selectedId) ?? null;
  const selectedIdx = canvasElements.findIndex(e => e.id === selectedId);

  const addElement = (type: CanvasElementType, label: string) => {
    const el = makeCanvasElement(type, label);
    setCanvasElements(els => [...els, el]);
    setSelectedId(el.id);
  };

  const updateElement = (updated: CanvasElement) =>
    setCanvasElements(els => els.map(e => e.id === updated.id ? updated : e));

  const moveUp = () => {
    if (selectedIdx <= 0) return;
    setCanvasElements(els => {
      const a = [...els];
      [a[selectedIdx - 1], a[selectedIdx]] = [a[selectedIdx], a[selectedIdx - 1]];
      return a;
    });
  };

  const moveDown = () => {
    if (selectedIdx < 0 || selectedIdx >= canvasElements.length - 1) return;
    setCanvasElements(els => {
      const a = [...els];
      [a[selectedIdx], a[selectedIdx + 1]] = [a[selectedIdx + 1], a[selectedIdx]];
      return a;
    });
  };

  const deleteEl = () => {
    if (!selectedId) return;
    setCanvasElements(els => els.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/quiz/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, canvasElements, designConfig: {} }),
      });
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      {/* Left panel — Elements */}
      <div className="w-[220px] border-r bg-white shrink-0 overflow-y-auto">
        <div className="text-xs font-semibold uppercase text-gray-400 p-3 pb-1">Elements</div>
        {ELEMENT_GROUPS.map(group => (
          <div key={group.section} className="mb-2">
            <div className="text-[10px] font-semibold uppercase text-gray-300 px-3 py-1">{group.section}</div>
            {group.items.map(item => (
              <button
                key={item.type}
                onClick={() => addElement(item.type, item.label)}
                className="flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-lg border border-gray-200 bg-white cursor-grab text-sm text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 w-[calc(100%-16px)] text-left transition"
              >
                {(item.type === 'background' || item.type === 'logo' || item.type === 'image_block') && <Image className="w-4 h-4 text-gray-400 shrink-0" />}
                {(item.type === 'question_title' || item.type === 'description') && <Type className="w-4 h-4 text-gray-400 shrink-0" />}
                {item.type === 'progress_bar' && <BarChart2 className="w-4 h-4 text-gray-400 shrink-0" />}
                {(item.type === 'single_choice' || item.type === 'multi_choice' || item.type === 'input_field') && <Layout className="w-4 h-4 text-gray-400 shrink-0" />}
                {item.type === 'rating' && <Star className="w-4 h-4 text-gray-400 shrink-0" />}
                {(item.type === 'next_button' || item.type === 'submit_button' || item.type === 'skip_link') && <Zap className="w-4 h-4 text-gray-400 shrink-0" />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Center panel — Canvas */}
      <div className="flex-1 bg-gray-100 flex flex-col overflow-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
          <button onClick={moveUp} disabled={!selectedId || selectedIdx <= 0} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <ChevronUp className="w-3.5 h-3.5" /> Move up
          </button>
          <button onClick={moveDown} disabled={!selectedId || selectedIdx >= canvasElements.length - 1} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <ChevronDown className="w-3.5 h-3.5" /> Move down
          </button>
          <button onClick={deleteEl} disabled={!selectedId} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <span className="text-xs text-gray-400 ml-auto">{selectedEl ? `Selected: ${selectedEl.label}` : 'Click element to select'}</span>
        </div>
        {/* Phone frame */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-8">
          <div className="w-[375px] min-h-[660px] bg-white rounded-[32px] shadow-2xl border-4 border-gray-800 overflow-hidden flex flex-col relative">
            {canvasElements.filter(e => e.visible).map(el => (
              <CanvasElementPreview
                key={el.id}
                el={el}
                isSelected={el.id === selectedId}
                onClick={() => setSelectedId(el.id)}
              />
            ))}
            {canvasElements.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
                Add elements from the left panel
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — Properties */}
      <div className="w-[280px] border-l bg-white shrink-0 flex flex-col overflow-hidden">
        <div className="text-xs font-semibold uppercase text-gray-400 p-3 border-b border-gray-100">Properties</div>
        <div className="flex-1 overflow-y-auto">
          {!selectedEl ? (
            <div className="p-6 text-center text-gray-400 text-sm mt-8">
              <Layout className="w-8 h-8 mx-auto mb-3 text-gray-200" />
              Select an element to edit its properties
            </div>
          ) : (
            <CanvasPropertiesPanel el={selectedEl} onChange={updateElement} />
          )}
        </div>
        {/* Bottom actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Design'}
          </button>
          <button
            onClick={() => { setCanvasElements([]); setSelectedId(null); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
        <div className="px-3 pb-3">
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <div className="text-xs font-semibold text-indigo-700 mb-1">💡 Smart Recommendations</div>
            <p className="text-[11px] text-indigo-600 leading-relaxed">After quiz submission, our AI matches answers to your product catalog and shows a personalized recommendation card. Configure matching rules in the Integrations tab.</p>
          </div>
        </div>
      </div>
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
      {tab === "Analytics" && <AnalyticsTab quizzes={quizzes} responses={responses} />}
      {tab === "Integrations" && <IntegrationsTab />}
      {tab === "Canvas Editor" && <QuizCanvasEditor brandId={brandId} quizId={quizzes[0]?.id} />}
    </div>
  );
}
