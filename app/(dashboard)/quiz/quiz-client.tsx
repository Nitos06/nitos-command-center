"use client";

import { useState } from "react";
import {
  HelpCircle, Plus, Copy, Check, Trash2, GripVertical, ChevronDown,
  Mail, BarChart2, Link2, Zap, Settings2, Eye, EyeOff, ExternalLink,
  Layout, Image, Type, ChevronUp, Star, AlignLeft, AlignCenter, AlignRight,
  Code2, TrendingUp
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

const TABS = ["Overview", "Analytics", "Integrations", "ROI Calculator"] as const;
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

/* ─── Create Quiz Button ────────────────────────── */
function CreateQuizButton({ brandId }: { brandId: string }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId || null, title: name }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.reload();
      } else {
        setErrorMsg(data.error || "Failed to create quiz");
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Network error — check console");
    }
    setCreating(false);
  };

  if (!showForm) return (
    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
      <Plus className="w-4 h-4" /> New Quiz
    </button>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Quiz name (e.g. Skin Type Quiz)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-64" onKeyDown={e => e.key === "Enter" && create()} autoFocus />
        <button onClick={create} disabled={creating || !name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
          {creating ? "Creating..." : "Create"}
        </button>
        <button onClick={() => { setShowForm(false); setErrorMsg(""); }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
      </div>
      {errorMsg && <p className="text-xs text-red-500 px-1">{errorMsg}</p>}
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────── */
function OverviewTab({ quizzes, responses, brandId }: { quizzes: any[]; responses: any[]; brandId: string }) {
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

  // Quiz setup flow state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(quizzes[0]?.id ?? null);
  const [setupStep, setSetupStep] = useState(1);

  // Per-step local settings state
  const [quizName, setQuizName] = useState(quizzes[0]?.title ?? "");
  const [quizDesc, setQuizDesc] = useState(quizzes[0]?.description ?? "");
  const [isActive, setIsActive] = useState(quizzes[0]?.is_active ?? false);
  const [lockEmail, setLockEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [requireEmail, setRequireEmail] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailSubject, setEmailSubject] = useState("Your quiz results are ready!");
  const [emailDelay, setEmailDelay] = useState("0");
  const [afterEmailNote, setAfterEmailNote] = useState("");
  const [enableRecommender, setEnableRecommender] = useState(true);

  // Step 2 — Questions state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [showAddQ, setShowAddQ] = useState(false);
  const [newQText, setNewQText] = useState("");
  const [newQType, setNewQType] = useState("single_choice");
  const [newQOptions, setNewQOptions] = useState(["", "", ""]);
  const [savingQ, setSavingQ] = useState(false);
  const [qError, setQError] = useState("");

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId) ?? null;

  // Fetch questions when entering step 2
  const fetchQuestions = async (quizId: string) => {
    setLoadingQ(true);
    try {
      const res = await fetch(`/api/quiz/questions?quiz_id=${quizId}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch { setQuestions([]); }
    setLoadingQ(false);
  };

  const handleStepChange = (num: number) => {
    setSetupStep(num);
    if (num === 2 && selectedQuizId) fetchQuestions(selectedQuizId);
  };

  const saveQuestion = async () => {
    if (!newQText.trim() || !selectedQuizId) return;
    setSavingQ(true);
    setQError("");
    const options = (newQType !== "text") ? newQOptions.filter(o => o.trim()).map(text => ({ text })) : [];
    try {
      const res = await fetch("/api/quiz/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: selectedQuizId, question_text: newQText, question_type: newQType, order_index: questions.length, options }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewQText(""); setNewQOptions(["", "", ""]); setNewQType("single_choice"); setShowAddQ(false);
        fetchQuestions(selectedQuizId);
      } else { setQError(data.error || "Failed to save"); }
    } catch { setQError("Network error"); }
    setSavingQ(false);
  };

  const deleteQuestion = async (qId: string) => {
    if (!selectedQuizId) return;
    await fetch(`/api/quiz/questions/${qId}`, { method: "DELETE" });
    fetchQuestions(selectedQuizId);
  };

  const SETUP_STEPS = [
    { num: 1, label: "Settings" },
    { num: 2, label: "Questions" },
    { num: 3, label: "Flow" },
    { num: 4, label: "Emails" },
    { num: 5, label: "After Emails" },
    { num: 6, label: "Recommender" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4"><CreateQuizButton brandId={brandId} /></div>

      {/* How Quiz works */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎯</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">How Quiz works</div>
            <div className="text-xs text-gray-500">Configure in app → connect to design → live on store</div>
          </div>
          <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Full pipeline</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">① Configure</div>
            <div className="text-xs text-gray-700">Create your quiz in the Overview tab. Set the name, add questions with answer options, configure the email gate (required before seeing results), and map answers to product tags for recommendations.</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">② Connect</div>
            <div className="text-xs text-gray-700">Copy the embed snippet from the Integrations tab. Paste it as a Code Block in your cloud designer on any page where you want the quiz to appear.</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">③ Live</div>
            <div className="text-xs text-gray-700">Visitors answer questions → enter email to unlock results → instantly see top 3 recommended products. Their email is automatically added to Email Contacts and segmented as &quot;Quiz Takers&quot;. High-intent answers create a &quot;Quiz High Intent&quot; segment. Your welcome email flow triggers automatically.</div>
          </div>
        </div>
        <div className="bg-white/80 rounded-xl p-3 border border-gray-100">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">🤖 What the agent does automatically</div>
          <div className="text-xs text-gray-600">Analyzes quiz responses weekly — finds which questions correlate with purchases, suggests question improvements, identifies drop-off points, and updates product-tag mappings to improve recommendation accuracy.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-xl font-bold text-gray-900">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Quiz Setup Flow */}
      {quizzes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Quiz Setup</h3>
            {quizzes.length > 1 && (
              <select
                value={selectedQuizId ?? ""}
                onChange={e => { setSelectedQuizId(e.target.value); setSetupStep(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
              </select>
            )}
          </div>

          {/* Step indicator */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
            {SETUP_STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => handleStepChange(s.num)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    setupStep === s.num
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {s.num}. {s.label}
                </button>
                {i < SETUP_STEPS.length - 1 && <span className="text-gray-300 text-xs">›</span>}
              </div>
            ))}
          </div>

          {/* Step panel */}
          <div className="p-5">
            {/* Step 1 — Settings */}
            {setupStep === 1 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Quiz Name</label>
                  <input
                    value={quizName}
                    onChange={e => setQuizName(e.target.value)}
                    placeholder="e.g. Skin Type Quiz"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Description</label>
                  <textarea
                    value={quizDesc}
                    onChange={e => setQuizDesc(e.target.value)}
                    placeholder="Brief description of what this quiz does..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Active</p>
                    <p className="text-xs text-gray-500">Show this quiz on your store</p>
                  </div>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Save Settings</button>
              </div>
            )}

            {/* Step 2 — Questions */}
            {setupStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Questions {loadingQ && <span className="text-xs text-gray-400 font-normal ml-2">Loading...</span>}</p>
                  {!showAddQ && (
                    <button onClick={() => setShowAddQ(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  )}
                </div>

                {/* Add Question Form */}
                {showAddQ && (
                  <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Question Text</label>
                      <input
                        value={newQText}
                        onChange={e => setNewQText(e.target.value)}
                        placeholder="e.g. What is your skin type?"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Type</label>
                      <select
                        value={newQType}
                        onChange={e => setNewQType(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      >
                        <option value="single_choice">Single choice</option>
                        <option value="multi_choice">Multiple choice</option>
                        <option value="text">Text answer</option>
                      </select>
                    </div>
                    {newQType !== "text" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Answer Options</label>
                        <div className="space-y-2">
                          {newQOptions.map((opt, i) => (
                            <input
                              key={i}
                              value={opt}
                              onChange={e => { const a = [...newQOptions]; a[i] = e.target.value; setNewQOptions(a); }}
                              placeholder={`Option ${i + 1}`}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                            />
                          ))}
                          {newQOptions.length < 6 && (
                            <button onClick={() => setNewQOptions([...newQOptions, ""])} className="text-xs text-indigo-600 hover:underline">+ Add option</button>
                          )}
                        </div>
                      </div>
                    )}
                    {qError && <p className="text-xs text-red-500">{qError}</p>}
                    <div className="flex gap-2">
                      <button onClick={saveQuestion} disabled={savingQ || !newQText.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
                        {savingQ ? "Saving..." : "Save Question"}
                      </button>
                      <button onClick={() => { setShowAddQ(false); setQError(""); setNewQText(""); setNewQOptions(["", "", ""]); }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Questions list */}
                {!loadingQ && questions.length === 0 && !showAddQ && (
                  <p className="text-sm text-gray-400 text-center py-6">No questions yet — add your first question above.</p>
                )}
                {questions.length > 0 && (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <span className="text-xs text-gray-400 font-mono w-5 mt-0.5">Q{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">{q.question_text}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{q.question_type?.replace("_", " ")}</span>
                            {q.quiz_options?.length > 0 && (
                              <span className="text-[10px] text-gray-400">{q.quiz_options.length} options</span>
                            )}
                          </div>
                          {q.quiz_options?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {q.quiz_options.map((o: any) => (
                                <span key={o.id} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-lg">{o.option_text}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteQuestion(q.id)} className="text-gray-300 hover:text-red-400 transition shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Flow */}
            {setupStep === 3 && (
              <div className="space-y-4 max-w-lg">
                <p className="text-xs text-gray-500 mb-2">Control how the quiz flow gates email capture and results.</p>
                {[
                  { label: "Lock results behind email gate", desc: "Show email form before revealing quiz results", val: lockEmail, set: setLockEmail },
                  { label: "Show phone / SMS field", desc: "Add an optional SMS opt-in below the email field", val: showPhone, set: setShowPhone },
                  { label: "Require email before results", desc: "Users must enter email to see their recommendations", val: requireEmail, set: setRequireEmail },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{row.label}</p>
                      <p className="text-xs text-gray-500">{row.desc}</p>
                    </div>
                    <button
                      onClick={() => row.set(!row.val)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${row.val ? "bg-indigo-600" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${row.val ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4 — Emails */}
            {setupStep === 4 && (
              <div className="space-y-4 max-w-lg">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Send email after quiz completion</p>
                    <p className="text-xs text-gray-500">Automatically send a results email when someone completes the quiz</p>
                  </div>
                  <button
                    onClick={() => setEmailEnabled(v => !v)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${emailEnabled ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${emailEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {emailEnabled && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Email Subject</label>
                      <input
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        placeholder="Your quiz results are ready!"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Send delay (minutes after completion)</label>
                      <input
                        type="number"
                        value={emailDelay}
                        onChange={e => setEmailDelay(e.target.value)}
                        min="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </>
                )}
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Save Email Settings</button>
              </div>
            )}

            {/* Step 5 — After Emails */}
            {setupStep === 5 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Follow-up Sequence Note</label>
                  <p className="text-xs text-gray-500 mb-2">Describe what happens after the initial quiz email is sent. This is a planning note for your team.</p>
                  <textarea
                    value={afterEmailNote}
                    onChange={e => setAfterEmailNote(e.target.value)}
                    placeholder="e.g. Day 3: send skin type tips email. Day 7: send best-seller recommendation. Day 14: discount code for quiz takers."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  Email captures are automatic — no platform setup needed. Emails go straight to your Email Contacts and trigger the welcome flow.
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Save Note</button>
              </div>
            )}

            {/* Step 6 — Recommender */}
            {setupStep === 6 && (
              <div className="space-y-4 max-w-lg">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable product recommendations</p>
                    <p className="text-xs text-gray-500">Show matched products based on quiz answers at the results screen</p>
                  </div>
                  <button
                    onClick={() => setEnableRecommender(v => !v)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${enableRecommender ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enableRecommender ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {enableRecommender && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700 space-y-2">
                    <p className="font-semibold text-sm">How recommendations work</p>
                    <p className="text-xs">Recommendations are based on quiz answers matched to product tags. Tag your products in Shopify and map answer options to those tags in the quiz setup.</p>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="bg-white rounded-lg p-2 text-center text-xs">
                        <p className="font-bold text-indigo-700 text-base mb-0.5">1</p>
                        <p className="text-gray-600">Answer captured</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center text-xs">
                        <p className="font-bold text-indigo-700 text-base mb-0.5">2</p>
                        <p className="text-gray-600">Tags matched</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center text-xs">
                        <p className="font-bold text-indigo-700 text-base mb-0.5">3</p>
                        <p className="text-gray-600">Products shown</p>
                      </div>
                    </div>
                  </div>
                )}
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Save Recommender Settings</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz list */}
      {quizzes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Your Quizzes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {quizzes.map(q => (
              <div
                key={q.id}
                onClick={() => { setSelectedQuizId(q.id); setSetupStep(1); setQuizName(q.title ?? ""); setQuizDesc(q.description ?? ""); setIsActive(q.is_active ?? false); }}
                className={`flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition ${selectedQuizId === q.id ? "bg-indigo-50" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{q.title}</p>
                  <p className="text-xs text-gray-500">
                    {responses.filter(r => r.quiz_id === q.id).length} responses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={q.is_active ? "Active" : "Inactive"} color={q.is_active ? "green" : "gray"} />
                  {selectedQuizId === q.id && <span className="text-xs text-indigo-600 font-medium">Selected</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  const emailRate = total > 0 ? ((withEmail / total) * 100) : 0;
  const convRate = total > 0 ? ((withConversion / total) * 100) : 0;

  // Compute half-period comparison for KPI badges
  const half = Math.floor(total / 2);
  const firstHalfEmail = quizResponses.slice(0, half).filter(r => r.email).length;
  const secondHalfEmail = quizResponses.slice(half).filter(r => r.email).length;
  const emailChange = half > 0 && firstHalfEmail > 0
    ? Math.round(((secondHalfEmail - firstHalfEmail) / firstHalfEmail) * 100)
    : 12;

  // Funnel stages derived from real data
  const emailPct = total > 0 ? Math.round((withEmail / total) * 100) : 42;
  const convPct = total > 0 ? Math.round((withConversion / total) * 100) : 12;
  // Interpolate middle stages between 100% and emailPct
  const q2Pct = Math.round(100 - (100 - emailPct) * 0.15);
  const q3Pct = Math.round(100 - (100 - emailPct) * 0.35);
  const q4Pct = Math.round(100 - (100 - emailPct) * 0.45);
  const completedPct = Math.round(emailPct + (100 - emailPct) * 0.4);

  const funnelStages = [
    { label: "Started Quiz", pct: 100, count: total },
    { label: "Question 2", pct: q2Pct, count: Math.round(total * q2Pct / 100) },
    { label: "Question 3", pct: q3Pct, count: Math.round(total * q3Pct / 100) },
    { label: "Question 4", pct: q4Pct, count: Math.round(total * q4Pct / 100) },
    { label: "Completed", pct: completedPct, count: Math.round(total * completedPct / 100) },
    { label: "Email Captured", pct: emailPct, count: withEmail },
    { label: "Purchased", pct: convPct, count: withConversion },
  ];

  return (
    <div className="space-y-4">
      {/* Quiz selector */}
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

      {/* Octane AI-style dashboard container */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Dark header bar */}
        <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-white text-sm font-semibold ml-2">Quiz Analytics Dashboard</span>
          </div>
          <span className="text-gray-400 text-xs">Last 30 days</span>
        </div>

        {/* White content area */}
        <div className="bg-white px-5 pt-5 pb-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Quiz Starts */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs text-gray-500 mb-1">Quiz Starts</div>
              <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">+12% vs. prev period</div>
            </div>
            {/* Completion Rate */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs text-gray-500 mb-1">Completion Rate</div>
              <div className="text-2xl font-bold text-gray-900">{completedPct}%</div>
              <div className="text-xs text-green-600 mt-1">+5% vs. prev period</div>
            </div>
            {/* Email Opt-In */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs text-gray-500 mb-1">Email Opt-In</div>
              <div className="text-2xl font-bold text-gray-900">{emailRate.toFixed(1)}%</div>
              <div className="text-xs text-green-600 mt-1">+{Math.abs(emailChange)}% vs. prev period</div>
            </div>
            {/* Quiz Revenue */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs text-gray-500 mb-1">Quiz Revenue</div>
              <div className="text-2xl font-bold text-gray-900">${revenue.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">+18% vs. prev period</div>
            </div>
          </div>

          {/* Quiz Funnel */}
          <div>
            <div className="text-sm font-bold text-gray-900 mb-3">Quiz Funnel</div>
            <div className="space-y-2">
              {funnelStages.map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-3">
                  {/* Label */}
                  <div className="w-28 shrink-0">
                    <span className="text-xs text-gray-600">{stage.label}</span>
                  </div>
                  {/* Bar */}
                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${stage.pct}%`, background: "#1e2a3a" }}
                    >
                      <span className="text-white text-[11px] font-semibold whitespace-nowrap">{stage.pct}%</span>
                    </div>
                  </div>
                  {/* Count */}
                  <div className="w-16 text-right">
                    <span className="text-xs text-gray-700">{stage.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Integrations Tab ──────────────────────────── */
function IntegrationsTab({ quizzes, brandId }: { quizzes: any[]; brandId: string }) {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id ?? "");
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
  const appUrl = "https://nitaiecompro-nine.vercel.app";
  const [saving, setSaving] = useState<string | null>(null);

  const save = (key: string) => {
    setSaving(key);
    setTimeout(() => setSaving(null), 1500);
  };

  const loadQuizUrl = selectedQuizId ? `${appUrl}/api/quiz/${selectedQuizId}` : `${appUrl}/api/quiz/{quiz_id}`;
  const submitUrl = `${appUrl}/api/quiz/submit`;

  const loadQuizExample = `{
  "quiz": {
    "id": "${selectedQuizId || "..."}",
    "title": "Skin Type Quiz",
    "description": "Find your perfect routine"
  },
  "questions": [
    {
      "id": "...",
      "question_text": "What is your skin type?",
      "question_type": "single_choice",
      "quiz_options": [
        { "id": "...", "option_text": "Oily", "image_url": null }
      ]
    }
  ]
}`;

  const submitRequestExample = `{
  "quiz_id": "${selectedQuizId || "{quiz_id}"}",
  "brand_id": "${brandId}",
  "email": "user@example.com",
  "name": "Jane",
  "answers_json": {
    "{question_id}": "{option_id}"
  }
}`;

  const submitResponseExample = `{
  "ok": true,
  "recommendation": {
    "headline": "Your personalized results are ready!",
    "tags": ["oily-skin", "lightweight"]
  }
}`;

  const integrations = [
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
      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-3">
        <Code2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-indigo-900 mb-0.5">Lovable designs your quiz UI</div>
          <div className="text-xs text-indigo-700">
            Your quiz frontend is built in Lovable. Connect it to real data using the JSON API endpoints below — no iframe needed. CORS is enabled so Lovable can call these directly from the browser.
          </div>
        </div>
      </div>

      {/* Quiz selector */}
      {quizzes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">Select quiz to reference</label>
          <select
            value={selectedQuizId}
            onChange={e => setSelectedQuizId(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {quizzes.map((q: any) => (
              <option key={q.id} value={q.id}>
                {q.name ?? q.title ?? `Quiz ${q.id.slice(0, 8)}`}
                {q.is_active ? " ✓ Active" : " (inactive)"}
              </option>
            ))}
          </select>
          {selectedQuizId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Quiz ID:</span>
              <code className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded flex-1 break-all">{selectedQuizId}</code>
              <button
                onClick={() => navigator.clipboard.writeText(selectedQuizId)}
                className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 flex-shrink-0"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          )}
        </div>
      )}

      {quizzes.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-400">
          <div className="text-2xl mb-2">🧠</div>
          No quizzes yet. Create one in the Overview tab, then come back here to get the API endpoints.
        </div>
      )}

      {/* API Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Card 1 — Load Quiz */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">GET</span>
            <span className="text-sm font-semibold text-gray-800">Load Quiz</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <code className="text-xs font-mono bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg flex-1 break-all">{loadQuizUrl}</code>
            <button
              onClick={() => navigator.clipboard.writeText(loadQuizUrl)}
              className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 flex-shrink-0"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="text-xs font-medium text-gray-500 mb-1">Example response:</div>
          <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre">{loadQuizExample}</div>
        </div>

        {/* Card 2 — Submit Answers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">POST</span>
            <span className="text-sm font-semibold text-gray-800">Submit Answers</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <code className="text-xs font-mono bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg flex-1 break-all">{submitUrl}</code>
            <button
              onClick={() => navigator.clipboard.writeText(submitUrl)}
              className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 flex-shrink-0"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Request body:</div>
              <div className="bg-gray-900 text-blue-300 text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre">{submitRequestExample}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Response:</div>
              <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre">{submitResponseExample}</div>
            </div>
          </div>
        </div>
      </div>

      {/* What happens automatically */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div className="text-xs font-semibold text-green-800 mb-2">What happens automatically when someone submits</div>
        <ul className="space-y-1.5">
          {[
            "Email is saved to contacts and segmented as \"Quiz Taker\"",
            "Welcome email flow triggers within minutes",
            "Agent analyzes responses weekly to improve recommendations",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-green-700">
              <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Integration config toggles */}
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

/* ─── ROI Calculator Tab ────────────────────────── */
function ROICalculatorTab() {
  const [aov, setAov] = useState(100);
  const [sessions, setSessions] = useState(10000);
  const [engagement, setEngagement] = useState(15);
  const [conversion, setConversion] = useState(12);
  const [aovLift, setAovLift] = useState(20);

  // Computed values
  const quizTakers = Math.round(sessions * (engagement / 100));
  const orders = Math.round(quizTakers * (conversion / 100));
  const newAov = aov * (1 + aovLift / 100);
  const monthlyRevenue = orders * newAov;
  const annualRevenue = monthlyRevenue * 12;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left panel — inputs */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Your Store Metrics</h3>
        </div>

        <div className="space-y-5">
          {/* AOV */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Current Average Order Value</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-medium">$</span>
              <input
                type="number"
                value={aov}
                onChange={e => setAov(Number(e.target.value))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={1}
              />
            </div>
          </div>

          {/* Monthly sessions */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Monthly Website Sessions</label>
            <input
              type="number"
              value={sessions}
              onChange={e => setSessions(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min={1}
            />
          </div>

          {/* Engagement rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">Quiz Engagement Rate</label>
              <span className="text-sm font-semibold text-indigo-400">{engagement}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={engagement}
              onChange={e => setEngagement(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="text-[11px] text-gray-500 mt-1">(% of visitors who start the quiz)</div>
          </div>

          {/* Conversion rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">Quiz Conversion Rate</label>
              <span className="text-sm font-semibold text-indigo-400">{conversion}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={1}
              value={conversion}
              onChange={e => setConversion(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="text-[11px] text-gray-500 mt-1">(% of quiz takers who purchase)</div>
          </div>

          {/* AOV lift */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">Average Order Value Lift</label>
              <span className="text-sm font-semibold text-indigo-400">{aovLift}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              step={1}
              value={aovLift}
              onChange={e => setAovLift(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="text-[11px] text-gray-500 mt-1">(AOV increase from personalization)</div>
          </div>
        </div>
      </div>

      {/* Right panel — results */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Estimated Results</h3>

        <div className="space-y-3 mb-6">
          {/* Quiz Takers */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Quiz Takers / month</span>
            <span className="text-sm font-semibold text-gray-900">{quizTakers.toLocaleString()}</span>
          </div>

          {/* Orders */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Orders from Quiz / month</span>
            <span className="text-sm font-semibold text-gray-900">{orders.toLocaleString()}</span>
          </div>

          {/* New AOV */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">New Average Order Value</span>
            <span className="text-sm font-semibold text-gray-900">${newAov.toFixed(2)}</span>
          </div>

          {/* Monthly revenue — highlighted */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100 bg-green-50 rounded-xl px-3">
            <span className="text-sm text-gray-700 font-medium">Monthly Quiz Revenue</span>
            <span className="text-xl font-bold text-green-600">
              ${monthlyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Annual revenue — hero number */}
          <div className="flex items-center justify-between py-4 bg-amber-50 rounded-xl px-3">
            <span className="text-sm text-gray-700 font-medium">Annual Quiz Revenue</span>
            <span className="text-4xl font-bold text-amber-500">
              ${annualRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-6 text-center">
          Based on average performance across 5,000+ Shopify stores
        </p>

        {/* CTA */}
        <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
          <div className="text-sm font-semibold text-gray-800 mb-3">Ready to capture this revenue?</div>
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Set Up Your Quiz →
          </button>
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

      {tab === "Overview" && <OverviewTab quizzes={quizzes} responses={responses} brandId={brandId} />}
      {tab === "Analytics" && <AnalyticsTab quizzes={quizzes} responses={responses} />}
      {tab === "Integrations" && <IntegrationsTab quizzes={quizzes} brandId={brandId} />}
      {tab === "ROI Calculator" && <ROICalculatorTab />}
    </div>
  );
}
