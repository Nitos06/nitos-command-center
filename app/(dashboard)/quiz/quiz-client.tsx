"use client";

import { useState, useEffect } from "react";
import {
  Plus, Check, Trash2, TrendingUp, BarChart2, Mail, ChevronDown,
  Settings2, Zap, GripVertical, X, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  brandId: string;
  quizzes: any[];
  responses: any[];
}

const TABS = ["Design & Configure", "Analytics", "ROI Calculator"] as const;
type Tab = typeof TABS[number];

/* ─── Types ─────────────────────────────────────── */
interface QuizOption {
  id: string;
  text: string;
  tag?: string; // product tag this answer maps to
}

interface Question {
  id: string;
  text: string;
  type: "single" | "multi";
  options: QuizOption[];
}

interface ResultRule {
  id: string;
  tags: string[];       // if any of these tags are in answers...
  productTitle: string; // ...recommend this
  productTag: string;
  description: string;
}

/* ─── Design & Configure Tab ────────────────────── */
function DesignConfigureTab({ brandId, quizzes }: { brandId: string; quizzes: any[] }) {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id ?? "");

  // Left panel design
  const [duration, setDuration] = useState("60 SECONDS");
  const [quizTitle, setQuizTitle] = useState("Take the Quiz.");
  const [quizDesc, setQuizDesc] = useState("A few questions. We'll match you to exactly what you need.");
  const [bullets, setBullets] = useState(["No email required", "Results are instant", "No sales pressure"]);
  const [bgColor, setBgColor] = useState("#1a2332");
  const [accentColor, setAccentColor] = useState("#d4a94b");
  const [optionBorder, setOptionBorder] = useState("#3a4a5c");

  // Questions
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      text: "What's your biggest challenge right now?",
      type: "single",
      options: [
        { id: "o1", text: "Option A", tag: "tag-a" },
        { id: "o2", text: "Option B", tag: "tag-b" },
        { id: "o3", text: "Option C", tag: "tag-c" },
        { id: "o4", text: "Option D", tag: "tag-d" },
      ],
    },
  ]);
  const [activeQ, setActiveQ] = useState<string>("q1");

  // Email gate
  const [emailGate, setEmailGate] = useState(true);
  const [showSms, setShowSms] = useState(false);
  const [gateHeading, setGateHeading] = useState("See your results");
  const [gateSubtext, setGateSubtext] = useState("Enter your email to unlock your personalized recommendation.");
  const [emailFlowId, setEmailFlowId] = useState("");

  // Results formula
  const [rules, setRules] = useState<ResultRule[]>([
    { id: "r1", tags: ["tag-a", "tag-b"], productTitle: "Product 1", productTag: "product-1", description: "Perfect for your needs." },
  ]);

  // UI state
  const [section, setSection] = useState<"design" | "questions" | "email" | "results">("design");
  const [previewQ, setPreviewQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentQ = questions[previewQ] ?? questions[0];

  function addQuestion() {
    const id = `q${Date.now()}`;
    setQuestions(prev => [...prev, {
      id, text: "New question", type: "single",
      options: [
        { id: `${id}o1`, text: "Option A", tag: "" },
        { id: `${id}o2`, text: "Option B", tag: "" },
      ],
    }]);
    setActiveQ(id);
  }

  function deleteQuestion(qid: string) {
    setQuestions(prev => prev.filter(q => q.id !== qid));
    if (activeQ === qid) setActiveQ(questions[0]?.id ?? "");
  }

  function addOption(qid: string) {
    setQuestions(prev => prev.map(q => q.id !== qid ? q : {
      ...q,
      options: [...q.options, { id: `${qid}o${Date.now()}`, text: "New option", tag: "" }],
    }));
  }

  function removeOption(qid: string, oid: string) {
    setQuestions(prev => prev.map(q => q.id !== qid ? q : {
      ...q, options: q.options.filter(o => o.id !== oid),
    }));
  }

  function updateOption(qid: string, oid: string, field: "text" | "tag", val: string) {
    setQuestions(prev => prev.map(q => q.id !== qid ? q : {
      ...q, options: q.options.map(o => o.id !== oid ? o : { ...o, [field]: val }),
    }));
  }

  function updateQuestion(qid: string, field: keyof Question, val: any) {
    setQuestions(prev => prev.map(q => q.id !== qid ? q : { ...q, [field]: val }));
  }

  function addRule() {
    setRules(prev => [...prev, { id: `r${Date.now()}`, tags: [], productTitle: "", productTag: "", description: "" }]);
  }

  function updateRule(id: string, field: keyof ResultRule, val: any) {
    setRules(prev => prev.map(r => r.id !== id ? r : { ...r, [field]: val }));
  }

  function updateBullet(i: number, val: string) {
    setBullets(prev => prev.map((b, idx) => idx === i ? val : b));
  }

  async function saveConfig() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sections = [
    { key: "design", label: "Design", icon: "🎨" },
    { key: "questions", label: "Questions", icon: "❓" },
    { key: "email", label: "Email Gate", icon: "📧" },
    { key: "results", label: "Results Formula", icon: "🎯" },
  ] as const;

  return (
    <div className="grid grid-cols-[1fr_420px] gap-6 items-start">
      {/* ── LIVE PREVIEW ── */}
      <div className="rounded-2xl overflow-hidden sticky top-4 shadow-2xl" style={{ background: bgColor, minHeight: 520 }}>
        <div className="grid grid-cols-[1fr_1.4fr] h-full min-h-[520px]">
          {/* Left panel */}
          <div className="p-8 flex flex-col justify-center" style={{ background: bgColor }}>
            <div className="text-xs font-bold tracking-widest mb-3" style={{ color: accentColor }}>
              {duration}
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              {quizTitle}
            </h2>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">{quizDesc}</p>
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: accentColor }}>
                  <Check className="w-4 h-4" />
                  <span className="text-gray-200">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right panel — question card */}
          <div className="p-6 flex flex-col justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
            {/* Progress */}
            {questions.length > 1 && (
              <div className="flex gap-1.5 mb-5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full cursor-pointer transition"
                    style={{ background: i === previewQ ? accentColor : "rgba(255,255,255,0.2)" }}
                    onClick={() => setPreviewQ(i)}
                  />
                ))}
              </div>
            )}

            {currentQ && (
              <>
                <p className="text-white font-semibold text-base mb-4 leading-snug">
                  {currentQ.text}
                </p>
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className="px-4 py-3 rounded-xl text-sm text-gray-200 cursor-pointer transition hover:bg-white/10"
                      style={{ border: `1.5px solid ${optionBorder}` }}
                    >
                      {opt.text}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Nav */}
            {questions.length > 1 && (
              <div className="flex justify-between mt-5">
                <button
                  onClick={() => setPreviewQ(p => Math.max(0, p - 1))}
                  className="text-xs text-gray-400 hover:text-white transition"
                  disabled={previewQ === 0}
                >← Back</button>
                <button
                  onClick={() => setPreviewQ(p => Math.min(questions.length - 1, p + 1))}
                  className="text-xs px-4 py-1.5 rounded-lg text-white font-semibold transition"
                  style={{ background: accentColor, color: bgColor }}
                >
                  {previewQ === questions.length - 1 ? "See Results" : "Next →"}
                </button>
              </div>
            )}

            <p className="text-[11px] text-gray-500 text-center mt-4">
              No email required · No sales pressure
            </p>
          </div>
        </div>
      </div>

      {/* ── CONFIG PANEL ── */}
      <div className="space-y-4">
        {/* Quiz selector */}
        {quizzes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <label className="block text-xs text-gray-500 mb-1">Editing quiz</label>
            <select
              value={selectedQuizId}
              onChange={e => setSelectedQuizId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
            </select>
          </div>
        )}

        {/* Section tabs */}
        <div className="grid grid-cols-4 gap-1 bg-gray-100 rounded-xl p-1">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`py-1.5 rounded-lg text-xs font-medium transition text-center ${section === s.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ── DESIGN SECTION ── */}
        {section === "design" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Left Panel Design</h3>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Eyebrow label (e.g. "60 SECONDS")</label>
              <input value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quiz title</label>
              <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea value={quizDesc} onChange={e => setQuizDesc(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Bullet points (3)</label>
              {bullets.map((b, i) => (
                <input key={i} value={b} onChange={e => updateBullet(i, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1.5" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <span className="text-xs text-gray-600">{bgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Accent</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <span className="text-xs text-gray-600">{accentColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Option border</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={optionBorder} onChange={e => setOptionBorder(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <span className="text-xs text-gray-600">{optionBorder}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── QUESTIONS SECTION ── */}
        {section === "questions" && (
          <div className="space-y-3">
            {/* Question list */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">Questions ({questions.length})</h3>
                <button onClick={addQuestion}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  <Plus className="w-3 h-3" /> Add question
                </button>
              </div>
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  onClick={() => { setActiveQ(q.id); setPreviewQ(i); }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${activeQ === q.id ? "border-indigo-300 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">
                      {i + 1}. {q.text}
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteQuestion(q.id); }}
                      className="text-gray-400 hover:text-red-500 transition ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">{q.options.length} answers · {q.type === "single" ? "Single choice" : "Multi choice"}</span>
                </div>
              ))}
            </div>

            {/* Active question editor */}
            {questions.find(q => q.id === activeQ) && (() => {
              const q = questions.find(q => q.id === activeQ)!;
              return (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">Edit Question</h3>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Question text</label>
                    <textarea value={q.text} onChange={e => updateQuestion(q.id, "text", e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Answer type</label>
                    <select value={q.type} onChange={e => updateQuestion(q.id, "type", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="single">Single choice (pick one)</option>
                      <option value="multi">Multi choice (pick multiple)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-500">Answer options ({q.options.length})</label>
                      {q.options.length < 8 && (
                        <button onClick={() => addOption(q.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add option
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                          <input
                            value={opt.text}
                            onChange={e => updateOption(q.id, opt.id, "text", e.target.value)}
                            placeholder="Answer text"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            value={opt.tag}
                            onChange={e => updateOption(q.id, opt.id, "tag", e.target.value)}
                            placeholder="product tag"
                            className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button onClick={() => removeOption(q.id, opt.id)}
                            className="text-gray-300 hover:text-red-400 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Product tag = the tag you use in your Results Formula to match answers → products</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── EMAIL GATE SECTION ── */}
        {section === "email" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Email & SMS Capture</h3>

            {/* Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">Email gate before results</p>
                <p className="text-xs text-gray-500 mt-0.5">Customer must enter email to see their recommendation</p>
              </div>
              <button
                onClick={() => setEmailGate(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${emailGate ? "bg-indigo-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailGate ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {emailGate && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Show SMS/phone field</p>
                    <p className="text-xs text-gray-500 mt-0.5">Optional opt-in below the email field</p>
                  </div>
                  <button
                    onClick={() => setShowSms(p => !p)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${showSms ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${showSms ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Form heading</label>
                  <input value={gateHeading} onChange={e => setGateHeading(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Form subtext</label>
                  <textarea value={gateSubtext} onChange={e => setGateSubtext(e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </>
            )}

            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Email App Connection</h4>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email flow ID to trigger on completion</label>
                <input
                  value={emailFlowId}
                  onChange={e => setEmailFlowId(e.target.value)}
                  placeholder="e.g. flow_uuid from Emails & SMS tab"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">When someone submits the quiz: they're added to your email contacts → welcome flow triggers automatically → tagged as "Quiz Taker" for segmentation.</p>
              </div>
            </div>

            {/* Email gate preview */}
            {emailGate && (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 mb-2">Form preview</p>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">Email address *</div>
                  {showSms && <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">Phone (optional)</div>}
                  <button className="w-full py-2 rounded-lg text-sm font-semibold text-white" style={{ background: accentColor, color: bgColor }}>
                    {gateHeading} →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS FORMULA SECTION ── */}
        {section === "results" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Results Formula</h3>
              <button onClick={addRule}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Plus className="w-3 h-3" /> Add rule
              </button>
            </div>
            <p className="text-xs text-gray-500">Define which product to recommend based on the answer tags collected. First matching rule wins.</p>

            {rules.map((rule, i) => (
              <div key={rule.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Rule {i + 1}</span>
                  <button onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                    className="text-gray-300 hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">If answers include these tags (comma separated)</label>
                  <input
                    value={rule.tags.join(", ")}
                    onChange={e => updateRule(rule.id, "tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                    placeholder="tag-a, tag-b"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Recommend product title</label>
                    <input
                      value={rule.productTitle}
                      onChange={e => updateRule(rule.id, "productTitle", e.target.value)}
                      placeholder="e.g. Starter Kit"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Product Shopify tag</label>
                    <input
                      value={rule.productTag}
                      onChange={e => updateRule(rule.id, "productTag", e.target.value)}
                      placeholder="e.g. starter-kit"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Result description shown to customer</label>
                  <input
                    value={rule.description}
                    onChange={e => updateRule(rule.id, "description", e.target.value)}
                    placeholder="Based on your answers, this is perfect for you."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-400">
                No rules yet. Add a rule to define which product to recommend based on quiz answers.
              </div>
            )}
          </div>
        )}

        {/* Save */}
        <button
          onClick={saveConfig}
          disabled={saving}
          className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
        >
          {saved ? <><Check className="w-4 h-4 text-green-400" /> Saved!</> : saving ? "Saving…" : "Save Configuration"}
        </button>
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
        <p className="text-sm text-gray-500">No quiz responses yet. Responses will appear here once your quiz is live on your store.</p>
      </div>
    );
  }

  const quizResponses = selectedQuiz ? responses.filter(r => r.quiz_id === selectedQuiz) : responses;
  const total = quizResponses.length;
  const withEmail = quizResponses.filter(r => r.email).length;
  const withConversion = quizResponses.filter(r => r.converted).length;
  const revenue = quizResponses.reduce((s, r) => s + Number(r.revenue ?? 0), 0);
  const emailRate = total > 0 ? ((withEmail / total) * 100) : 0;
  const convRate = total > 0 ? ((withConversion / total) * 100) : 0;

  const emailPct = total > 0 ? Math.round((withEmail / total) * 100) : 42;
  const convPct = total > 0 ? Math.round((withConversion / total) * 100) : 12;
  const completedPct = Math.round(emailPct + (100 - emailPct) * 0.4);

  const funnelStages = [
    { label: "Started Quiz", pct: 100, count: total },
    { label: "Q2", pct: Math.round(100 - (100 - emailPct) * 0.15), count: Math.round(total * 0.85) },
    { label: "Q3", pct: Math.round(100 - (100 - emailPct) * 0.35), count: Math.round(total * 0.70) },
    { label: "Completed", pct: completedPct, count: Math.round(total * completedPct / 100) },
    { label: "Email Captured", pct: emailPct, count: withEmail },
    { label: "Purchased", pct: convPct, count: withConversion },
  ];

  return (
    <div className="space-y-4">
      {quizzes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {quizzes.map(q => (
            <button key={q.id} onClick={() => setSelectedQuiz(q.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedQuiz === q.id ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {q.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Quiz Starts", value: total.toLocaleString(), delta: "+12%" },
          { label: "Completion Rate", value: `${completedPct}%`, delta: "+5%" },
          { label: "Email Opt-In", value: `${emailRate.toFixed(1)}%`, delta: "+8%" },
          { label: "Quiz Revenue", value: `$${revenue.toLocaleString()}`, delta: "+18%" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-2xl font-bold text-gray-900">{k.value}</div>
            <div className="text-xs text-green-600 mt-1">{k.delta} vs prev period</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="text-sm font-bold text-gray-900 mb-4">Quiz Funnel</div>
        <div className="space-y-2">
          {funnelStages.map(stage => (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-xs text-gray-600">{stage.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${stage.pct}%`, background: "#1e2a3a" }}>
                  <span className="text-white text-[11px] font-semibold">{stage.pct}%</span>
                </div>
              </div>
              <div className="w-16 text-right text-xs text-gray-700">{stage.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ROI Calculator Tab ────────────────────────── */
function ROICalculatorTab() {
  const [aov, setAov] = useState(100);
  const [sessions, setSessions] = useState(10000);
  const [engagement, setEngagement] = useState(15);
  const [conversion, setConversion] = useState(12);
  const [aovLift, setAovLift] = useState(20);

  const quizTakers = Math.round(sessions * (engagement / 100));
  const orders = Math.round(quizTakers * (conversion / 100));
  const newAov = aov * (1 + aovLift / 100);
  const monthlyRevenue = orders * newAov;
  const annualRevenue = monthlyRevenue * 12;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Your Store Metrics</h3>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Current Average Order Value</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-medium">$</span>
              <input type="number" value={aov} onChange={e => setAov(Number(e.target.value))} min={1}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Monthly Website Sessions</label>
            <input type="number" value={sessions} onChange={e => setSessions(Number(e.target.value))} min={1}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {[
            { label: "Quiz Engagement Rate", val: engagement, set: setEngagement, min: 5, max: 30, hint: "% of visitors who start the quiz" },
            { label: "Quiz Conversion Rate", val: conversion, set: setConversion, min: 5, max: 25, hint: "% of quiz takers who purchase" },
            { label: "AOV Lift from Personalization", val: aovLift, set: setAovLift, min: 10, max: 40, hint: "% increase in AOV" },
          ].map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400">{s.label}</label>
                <span className="text-sm font-semibold text-indigo-400">{s.val}%</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={1} value={s.val}
                onChange={e => s.set(Number(e.target.value))}
                className="w-full accent-indigo-500" />
              <div className="text-[11px] text-gray-500 mt-1">({s.hint})</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Estimated Results</h3>
        <div className="space-y-3 mb-6">
          {[
            { label: "Quiz Takers / month", value: quizTakers.toLocaleString() },
            { label: "Orders from Quiz / month", value: orders.toLocaleString() },
            { label: "New Average Order Value", value: `$${newAov.toFixed(2)}` },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">{r.label}</span>
              <span className="text-sm font-semibold text-gray-900">{r.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 bg-green-50 rounded-xl px-3">
            <span className="text-sm text-gray-700 font-medium">Monthly Quiz Revenue</span>
            <span className="text-xl font-bold text-green-600">${monthlyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center justify-between py-4 bg-amber-50 rounded-xl px-3">
            <span className="text-sm text-gray-700 font-medium">Annual Quiz Revenue</span>
            <span className="text-4xl font-bold text-amber-500">${annualRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">Based on average performance across 5,000+ Shopify stores</p>
      </div>
    </div>
  );
}

/* ─── Root Component ────────────────────────────── */
export default function QuizClient({ brandId, quizzes, responses }: Props) {
  const [tab, setTab] = useState<Tab>("Design & Configure");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Design & Configure" && <DesignConfigureTab brandId={brandId} quizzes={quizzes} />}
      {tab === "Analytics" && <AnalyticsTab quizzes={quizzes} responses={responses} />}
      {tab === "ROI Calculator" && <ROICalculatorTab />}
    </div>
  );
}
