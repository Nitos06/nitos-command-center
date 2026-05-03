"use client";

import { useState, useCallback } from "react";
import {
  Save, Plus, Trash2, GripVertical, Check, ChevronRight, ChevronLeft,
  Palette, ListChecks, Mail, FlaskConical, Eye, Loader2, Copy,
  CheckCircle2, Tag, X, Sparkles, ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuizOption {
  id: string;
  text: string;
  tags: string[];
  imageUrl?: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: "single" | "multi";
  options: QuizOption[];
}

interface ResultRule {
  id: string;
  tags: string[];
  productHandle: string;
  productTitle: string;
  description: string;
  imageUrl?: string;
}

interface EmailGateConfig {
  enabled: boolean;
  showName: boolean;
  showSms: boolean;
  heading: string;
  subtext: string;
  emailFlowId: string;
}

interface DesignConfig {
  bgColor: string;
  accentColor: string;
  optionBorderColor: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: [string, string, string];
}

interface Quiz {
  id: string;
  name: string;
  design: DesignConfig;
  questions: QuizQuestion[];
  emailGate: EmailGateConfig;
  results: ResultRule[];
}

interface Props {
  brandId: string;
  quizzes: any[];
  questions: any[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_DESIGN: DesignConfig = {
  bgColor: "#0f172a",
  accentColor: "#6366f1",
  optionBorderColor: "#334155",
  eyebrow: "PERSONALIZED FOR YOU",
  title: "Find Your Perfect Match",
  description: "Answer a few quick questions and we'll recommend the best products for your needs.",
  bullets: ["Takes only 2 minutes", "Science-backed recommendations", "100% free"],
};

const DEFAULT_EMAIL_GATE: EmailGateConfig = {
  enabled: true,
  showName: true,
  showSms: false,
  heading: "Almost there! Where should we send your results?",
  subtext: "Plus get 10% off your personalized picks.",
  emailFlowId: "",
};

function blankQuiz(): Quiz {
  return {
    id: uid(),
    name: "New Quiz",
    design: { ...DEFAULT_DESIGN, bullets: [...DEFAULT_DESIGN.bullets] as [string, string, string] },
    questions: [
      {
        id: uid(),
        text: "What's your primary goal?",
        type: "single",
        options: [
          { id: uid(), text: "Performance", tags: ["performance"] },
          { id: uid(), text: "Comfort", tags: ["comfort"] },
          { id: uid(), text: "Style", tags: ["style"] },
        ],
      },
    ],
    emailGate: { ...DEFAULT_EMAIL_GATE },
    results: [],
  };
}

function hydrateQuiz(raw: any, questionRows: any[]): Quiz {
  const qForQuiz = questionRows.filter((q: any) => q.quiz_id === raw.id);
  const meta = raw.meta ?? {};
  return {
    id: raw.id,
    name: raw.name ?? "Untitled",
    design: meta.design ?? { ...DEFAULT_DESIGN, bullets: [...DEFAULT_DESIGN.bullets] as [string, string, string] },
    questions: qForQuiz.map((q: any) => ({
      id: q.id,
      text: q.text ?? "",
      type: q.type ?? "single",
      options: (q.options ?? []).map((o: any) => ({ id: o.id ?? uid(), text: o.text ?? "", tags: o.tags ?? [] })),
    })),
    emailGate: meta.emailGate ?? { ...DEFAULT_EMAIL_GATE },
    results: meta.results ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  Tiny reusable bits                                                 */
/* ------------------------------------------------------------------ */

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded border-0 cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-20 text-xs font-mono border rounded px-1.5 py-1 bg-white" />
      </div>
    </label>
  );
}

function Field({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  const cls = "w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none";
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-indigo-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
        active ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  CONFIG PANELS                                                      */
/* ------------------------------------------------------------------ */

function DesignPanel({ design, onChange }: { design: DesignConfig; onChange: (d: DesignConfig) => void }) {
  const set = (k: keyof DesignConfig, v: any) => onChange({ ...design, [k]: v });
  const setBullet = (i: number, v: string) => {
    const b = [...design.bullets] as [string, string, string];
    b[i] = v;
    onChange({ ...design, bullets: b });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Colors</h3>
      <div className="space-y-3 bg-gray-50 rounded-xl p-3">
        <ColorPicker label="Background" value={design.bgColor} onChange={v => set("bgColor", v)} />
        <ColorPicker label="Accent" value={design.accentColor} onChange={v => set("accentColor", v)} />
        <ColorPicker label="Option border" value={design.optionBorderColor} onChange={v => set("optionBorderColor", v)} />
      </div>

      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6">Content</h3>
      <div className="space-y-3">
        <Field label="Eyebrow label" value={design.eyebrow} onChange={v => set("eyebrow", v)} placeholder="PERSONALIZED FOR YOU" />
        <Field label="Quiz title" value={design.title} onChange={v => set("title", v)} placeholder="Find Your Perfect Match" />
        <Field label="Description" value={design.description} onChange={v => set("description", v)} textarea placeholder="Answer a few questions..." />
      </div>

      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6">Bullet Points</h3>
      <div className="space-y-2">
        {design.bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <input
              type="text"
              value={b}
              onChange={e => setBullet(i, e.target.value)}
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionsPanel({ questions, onChange }: { questions: QuizQuestion[]; onChange: (q: QuizQuestion[]) => void }) {
  const [activeQ, setActiveQ] = useState(0);

  const addQuestion = () => {
    const q: QuizQuestion = { id: uid(), text: "New question", type: "single", options: [{ id: uid(), text: "Option 1", tags: [] }] };
    onChange([...questions, q]);
    setActiveQ(questions.length);
  };

  const removeQuestion = (i: number) => {
    const next = questions.filter((_, idx) => idx !== i);
    onChange(next);
    if (activeQ >= next.length) setActiveQ(Math.max(0, next.length - 1));
  };

  const updateQuestion = (i: number, patch: Partial<QuizQuestion>) => {
    const next = [...questions];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const addOption = (qi: number) => {
    const q = { ...questions[qi] };
    q.options = [...q.options, { id: uid(), text: `Option ${q.options.length + 1}`, tags: [] }];
    const next = [...questions]; next[qi] = q; onChange(next);
  };

  const removeOption = (qi: number, oi: number) => {
    const q = { ...questions[qi] };
    q.options = q.options.filter((_, idx) => idx !== oi);
    const next = [...questions]; next[qi] = q; onChange(next);
  };

  const updateOption = (qi: number, oi: number, patch: Partial<QuizOption>) => {
    const q = { ...questions[qi] };
    q.options = [...q.options];
    q.options[oi] = { ...q.options[oi], ...patch };
    const next = [...questions]; next[qi] = q; onChange(next);
  };

  const addTag = (qi: number, oi: number, tag: string) => {
    if (!tag.trim()) return;
    const o = questions[qi].options[oi];
    if (o.tags.includes(tag.trim())) return;
    updateOption(qi, oi, { tags: [...o.tags, tag.trim()] });
  };

  const removeTag = (qi: number, oi: number, tag: string) => {
    const o = questions[qi].options[oi];
    updateOption(qi, oi, { tags: o.tags.filter(t => t !== tag) });
  };

  const q = questions[activeQ];

  return (
    <div className="space-y-4">
      {/* question list */}
      <div className="flex items-center gap-2 flex-wrap">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => setActiveQ(i)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              i === activeQ ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Q{i + 1}
          </button>
        ))}
        <button onClick={addQuestion} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {q && (
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Field label="Question text" value={q.text} onChange={v => updateQuestion(activeQ, { text: v })} placeholder="What's your primary goal?" />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Type:</span>
            {(["single", "multi"] as const).map(t => (
              <button
                key={t}
                onClick={() => updateQuestion(activeQ, { type: t })}
                className={`px-2.5 py-1 text-xs rounded-lg ${q.type === t ? "bg-indigo-100 text-indigo-700 font-semibold" : "bg-gray-100 text-gray-500"}`}
              >
                {t === "single" ? "Single choice" : "Multi choice"}
              </button>
            ))}
            <div className="flex-1" />
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(activeQ)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Options</h4>
          <div className="space-y-3">
            {q.options.map((o, oi) => (
              <div key={o.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                  <input
                    type="text"
                    value={o.text}
                    onChange={e => updateOption(activeQ, oi, { text: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white"
                  />
                  {q.options.length > 1 && (
                    <button onClick={() => removeOption(activeQ, oi)} className="text-red-400 hover:text-red-600 p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap pl-6">
                  <Tag className="w-3 h-3 text-gray-400" />
                  {o.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(activeQ, oi, tag)} className="hover:text-red-500">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag..."
                    className="text-[11px] border-0 bg-transparent outline-none w-16"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        addTag(activeQ, oi, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => addOption(activeQ)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add option
          </button>
        </div>
      )}
    </div>
  );
}

function EmailGatePanel({ config, onChange }: { config: EmailGateConfig; onChange: (c: EmailGateConfig) => void }) {
  const set = (k: keyof EmailGateConfig, v: any) => onChange({ ...config, [k]: v });

  return (
    <div className="space-y-4">
      <Toggle label="Enable email gate before results" checked={config.enabled} onChange={v => set("enabled", v)} />

      {config.enabled && (
        <>
          <div className="space-y-3 pt-2">
            <Toggle label="Show name field" checked={config.showName} onChange={v => set("showName", v)} />
            <Toggle label="Show SMS / phone field" checked={config.showSms} onChange={v => set("showSms", v)} />
          </div>

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6">Copy</h3>
          <Field label="Heading" value={config.heading} onChange={v => set("heading", v)} placeholder="Almost there!" />
          <Field label="Subtext" value={config.subtext} onChange={v => set("subtext", v)} placeholder="Plus get 10% off..." />

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6">Automation</h3>
          <Field label="Email flow ID to trigger" value={config.emailFlowId} onChange={v => set("emailFlowId", v)} placeholder="flow_abc123" />
          <p className="text-[11px] text-gray-400">When a visitor submits their email, this flow will be triggered automatically in your email app.</p>
        </>
      )}
    </div>
  );
}

function ResultsPanel({ rules, onChange }: { rules: ResultRule[]; onChange: (r: ResultRule[]) => void }) {
  const addRule = () => {
    onChange([...rules, { id: uid(), tags: [], productHandle: "", productTitle: "", description: "", imageUrl: "" }]);
  };

  const removeRule = (i: number) => onChange(rules.filter((_, idx) => idx !== i));

  const updateRule = (i: number, patch: Partial<ResultRule>) => {
    const next = [...rules]; next[i] = { ...next[i], ...patch }; onChange(next);
  };

  const addRuleTag = (i: number, tag: string) => {
    if (!tag.trim()) return;
    const r = rules[i];
    if (r.tags.includes(tag.trim())) return;
    updateRule(i, { tags: [...r.tags, tag.trim()] });
  };

  const removeRuleTag = (i: number, tag: string) => {
    updateRule(i, { tags: rules[i].tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Define rules that map answer tags to product recommendations. When a visitor&apos;s selected tags match a rule, that product is recommended.
      </p>

      {rules.map((r, i) => (
        <div key={r.id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Rule {i + 1}</span>
            <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* If tags include... */}
          <div>
            <span className="text-[11px] font-medium text-gray-500 mb-1 block">If tags include:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {r.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => removeRuleTag(i, tag)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                className="text-[11px] border rounded-lg px-2 py-1 bg-white w-20"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    addRuleTag(i, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-gray-300 mx-auto" />

          {/* Recommend product */}
          <Field label="Product title" value={r.productTitle} onChange={v => updateRule(i, { productTitle: v })} placeholder="Ultra Comfort Pro" />
          <Field label="Product handle" value={r.productHandle} onChange={v => updateRule(i, { productHandle: v })} placeholder="ultra-comfort-pro" />
          <Field label="Recommendation copy" value={r.description} onChange={v => updateRule(i, { description: v })} textarea placeholder="Based on your answers, this is the perfect fit..." />
        </div>
      ))}

      <button onClick={addRule} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-3 text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 font-medium flex items-center justify-center gap-1.5 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add result rule
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LIVE PREVIEW                                                       */
/* ------------------------------------------------------------------ */

function LivePreview({
  quiz,
  activeTab,
}: {
  quiz: Quiz;
  activeTab: "design" | "questions" | "emailGate" | "results";
}) {
  const { design, questions, emailGate, results } = quiz;
  const [previewQ, setPreviewQ] = useState(0);
  const [selectedOpts, setSelectedOpts] = useState<Set<string>>(new Set());

  const currentQ = questions[previewQ];

  const toggleOpt = (id: string, type: "single" | "multi") => {
    if (type === "single") {
      setSelectedOpts(new Set([id]));
    } else {
      const next = new Set(selectedOpts);
      next.has(id) ? next.delete(id) : next.add(id);
      setSelectedOpts(next);
    }
  };

  /* What shows in the right column of the preview card */
  const renderRightPanel = () => {
    if (activeTab === "emailGate" && emailGate.enabled) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">{emailGate.heading}</h3>
          <p className="text-sm text-white/60">{emailGate.subtext}</p>
          {emailGate.showName && (
            <input type="text" placeholder="Your name" className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40" readOnly />
          )}
          <input type="email" placeholder="Email address" className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40" readOnly />
          {emailGate.showSms && (
            <input type="tel" placeholder="Phone number" className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40" readOnly />
          )}
          <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: design.accentColor }}>
            See My Results
          </button>
        </div>
      );
    }

    if (activeTab === "results" && results.length > 0) {
      const r = results[0];
      return (
        <div className="space-y-3">
          <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">Your Top Pick</span>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <div className="w-full h-28 bg-white/5 rounded-lg mb-3 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <h4 className="text-white font-bold">{r.productTitle || "Product Name"}</h4>
            <p className="text-white/60 text-xs mt-1">{r.description || "Personalized recommendation copy..."}</p>
            <button className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: design.accentColor }}>
              View Product
            </button>
          </div>
        </div>
      );
    }

    /* Default: question view */
    if (!currentQ) return <p className="text-white/40 text-sm">Add a question to preview it here.</p>;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 mb-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPreviewQ(i); setSelectedOpts(new Set()); }}
              className={`w-2 h-2 rounded-full transition-all ${i === previewQ ? "scale-125" : "opacity-40"}`}
              style={{ backgroundColor: i === previewQ ? design.accentColor : "#fff" }}
            />
          ))}
        </div>
        <p className="text-xs text-white/40 font-medium">Question {previewQ + 1} of {questions.length}</p>
        <h3 className="text-lg font-bold text-white leading-snug">{currentQ.text}</h3>
        <div className="space-y-2 mt-2">
          {currentQ.options.map(o => {
            const sel = selectedOpts.has(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggleOpt(o.id, currentQ.type)}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-3"
                style={{
                  borderColor: sel ? design.accentColor : design.optionBorderColor,
                  backgroundColor: sel ? `${design.accentColor}22` : "transparent",
                  color: "#fff",
                }}
              >
                <span
                  className={`w-5 h-5 rounded-${currentQ.type === "single" ? "full" : "md"} border-2 flex items-center justify-center shrink-0`}
                  style={{ borderColor: sel ? design.accentColor : design.optionBorderColor, backgroundColor: sel ? design.accentColor : "transparent" }}
                >
                  {sel && <Check className="w-3 h-3 text-white" />}
                </span>
                {o.text}
              </button>
            );
          })}
        </div>
        {/* navigation */}
        <div className="flex items-center justify-between pt-3">
          <button
            onClick={() => { setPreviewQ(p => Math.max(0, p - 1)); setSelectedOpts(new Set()); }}
            disabled={previewQ === 0}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            onClick={() => { setPreviewQ(p => Math.min(questions.length - 1, p + 1)); setSelectedOpts(new Set()); }}
            disabled={previewQ === questions.length - 1}
            className="flex items-center gap-1 text-xs font-semibold text-white px-4 py-1.5 rounded-lg"
            style={{ backgroundColor: design.accentColor }}
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: design.bgColor }}>
      <div className="grid md:grid-cols-2 gap-0 min-h-[480px]">
        {/* Left column - intro */}
        <div className="p-8 flex flex-col justify-center border-r border-white/10">
          <span className="text-[10px] font-bold tracking-[0.2em] mb-3 block" style={{ color: design.accentColor }}>
            {design.eyebrow}
          </span>
          <h2 className="text-2xl font-extrabold text-white leading-tight mb-3">{design.title}</h2>
          <p className="text-sm text-white/60 mb-5">{design.description}</p>
          <ul className="space-y-2">
            {design.bullets.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: design.accentColor }} />
                {b}
              </li>
            ))}
          </ul>
        </div>
        {/* Right column - dynamic */}
        <div className="p-8 flex flex-col justify-center">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function QuizBuilder({ brandId, quizzes: rawQuizzes, questions: rawQuestions }: Props) {
  const [quizList, setQuizList] = useState<Quiz[]>(() => {
    if (rawQuizzes.length === 0) return [blankQuiz()];
    return rawQuizzes.map(q => hydrateQuiz(q, rawQuestions));
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState<"design" | "questions" | "emailGate" | "results">("design");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const quiz = quizList[activeIdx];

  const updateQuiz = useCallback((patch: Partial<Quiz>) => {
    setQuizList(prev => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], ...patch };
      return next;
    });
    setSaved(false);
  }, [activeIdx]);

  const addNewQuiz = () => {
    const nq = blankQuiz();
    setQuizList(prev => [...prev, nq]);
    setActiveIdx(quizList.length);
  };

  const saveQuiz = async () => {
    setSaving(true);
    try {
      await fetch("/api/apps/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          quiz: {
            id: quiz.id,
            name: quiz.name,
            design: quiz.design,
            emailGate: quiz.emailGate,
            results: quiz.results,
          },
          questions: quiz.questions,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail for now
    } finally {
      setSaving(false);
    }
  };

  const CONFIG_TABS = [
    { key: "design" as const, label: "Design", icon: Palette },
    { key: "questions" as const, label: "Questions", icon: ListChecks },
    { key: "emailGate" as const, label: "Email Gate", icon: Mail },
    { key: "results" as const, label: "Results", icon: FlaskConical },
  ];

  return (
    <div className="space-y-6">
      {/* Top bar: quiz selector + save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {quizList.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                i === activeIdx ? "bg-white shadow text-gray-900" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {q.name}
            </button>
          ))}
          <button onClick={addNewQuiz} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={quiz.name}
            onChange={e => updateQuiz({ name: e.target.value })}
            className="border rounded-lg px-3 py-1.5 text-sm font-medium bg-white w-48"
          />
          <button
            onClick={saveQuiz}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Quiz"}
          </button>
        </div>
      </div>

      {/* Main grid: preview left, config right */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Live preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Eye className="w-3.5 h-3.5" /> LIVE PREVIEW
          </div>
          <LivePreview quiz={quiz} activeTab={tab} />
        </div>

        {/* Config panel */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-1 p-2 border-b bg-gray-50/50">
            {CONFIG_TABS.map(t => (
              <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon} label={t.label} />
            ))}
          </div>

          {/* Panel content */}
          <div className="p-5 max-h-[600px] overflow-y-auto">
            {tab === "design" && (
              <DesignPanel design={quiz.design} onChange={d => updateQuiz({ design: d })} />
            )}
            {tab === "questions" && (
              <QuestionsPanel questions={quiz.questions} onChange={q => updateQuiz({ questions: q })} />
            )}
            {tab === "emailGate" && (
              <EmailGatePanel config={quiz.emailGate} onChange={c => updateQuiz({ emailGate: c })} />
            )}
            {tab === "results" && (
              <ResultsPanel rules={quiz.results} onChange={r => updateQuiz({ results: r })} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
