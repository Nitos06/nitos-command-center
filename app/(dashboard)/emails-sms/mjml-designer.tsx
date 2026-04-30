"use client";

import { useState, useCallback, useRef } from "react";
import {
  Type, Image, MousePointer2, Minus, Space, Columns2, Columns3,
  Share2, Layers, ChevronDown, ChevronUp, Trash2, Eye, Save,
  Send, Plus, Code2, X, ChevronRight, Loader2, LayoutTemplate,
  Variable, ArrowUpFromLine,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  type: "text" | "image" | "button" | "divider" | "spacer" | "two-col" | "three-col" | "social" | "hero";
  props: Record<string, string>;
}

interface HeaderProps {
  previewText: string;
  bgColor: string;
  width: string;
  fontFamily: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  category: string;
  mjml_source: string;
  preview_html?: string;
  created_at: string;
}

export interface MjmlDesignerProps {
  brandId: string;
  onTemplateSelected?: (html: string, mjml: string, name: string) => void;
}

// ─── Block defaults ───────────────────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<Block["type"], Record<string, string>> = {
  text: {
    content: "<p>Edit this text to start writing your email copy.</p>",
    "font-size": "15px",
    color: "#333333",
    "font-weight": "normal",
    "text-align": "left",
    padding: "12px 24px",
  },
  image: {
    src: "https://placehold.co/600x200/e2e8f0/64748b?text=Image",
    alt: "Email image",
    width: "100%",
    href: "",
    "border-radius": "0px",
    padding: "12px 0px",
  },
  button: {
    text: "Shop Now",
    href: "https://",
    "background-color": "#6366f1",
    color: "#ffffff",
    "border-radius": "6px",
    padding: "14px 32px",
    "font-size": "15px",
    align: "center",
  },
  divider: {
    "border-color": "#e2e8f0",
    "border-width": "1px",
    "border-style": "solid",
    width: "100%",
    padding: "16px 24px",
  },
  spacer: {
    height: "24px",
  },
  "two-col": {
    "col1-content": "<p>Column 1 content</p>",
    "col2-content": "<p>Column 2 content</p>",
    "col1-width": "50%",
    "col2-width": "50%",
    padding: "12px 24px",
  },
  "three-col": {
    "col1-content": "<p>Col 1</p>",
    "col2-content": "<p>Col 2</p>",
    "col3-content": "<p>Col 3</p>",
    padding: "12px 24px",
  },
  social: {
    "icon-size": "24px",
    align: "center",
    padding: "16px 24px",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
  },
  hero: {
    "background-url": "https://placehold.co/600x300/6366f1/ffffff?text=Hero",
    "background-color": "#6366f1",
    "border-radius": "0px",
    height: "300px",
    title: "Your headline here",
    "title-color": "#ffffff",
    "title-font-size": "28px",
    subtitle: "Supporting copy for the hero section.",
    "subtitle-color": "#e0e7ff",
    padding: "40px 24px",
  },
};

const BLOCK_PALETTE = [
  { type: "text" as const, label: "Text", Icon: Type },
  { type: "image" as const, label: "Image", Icon: Image },
  { type: "button" as const, label: "Button", Icon: MousePointer2 },
  { type: "divider" as const, label: "Divider", Icon: Minus },
  { type: "spacer" as const, label: "Spacer", Icon: Space },
  { type: "two-col" as const, label: "2 Columns", Icon: Columns2 },
  { type: "three-col" as const, label: "3 Columns", Icon: Columns3 },
  { type: "social" as const, label: "Social Icons", Icon: Share2 },
  { type: "hero" as const, label: "Hero Section", Icon: Layers },
];

const VARIABLES = [
  { label: "First name", value: "{{contact.firstname}}" },
  { label: "Last name", value: "{{contact.lastname}}" },
  { label: "Order #", value: "{{order.number}}" },
  { label: "Order total", value: "{{order.total}}" },
  { label: "Shop name", value: "{{shop.name}}" },
];

const CATEGORIES = ["campaign", "flow", "transactional", "promotional"] as const;

// ─── MJML builder ─────────────────────────────────────────────────────────────

function buildMjml(blocks: Block[], header: HeaderProps): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const renderBlock = (block: Block): string => {
    const p = block.props;
    switch (block.type) {
      case "text":
        return `    <mj-section padding="0">
      <mj-column>
        <mj-text font-size="${p["font-size"]}" color="${p.color}" font-weight="${p["font-weight"]}" align="${p["text-align"]}" padding="${p.padding}">
          ${p.content}
        </mj-text>
      </mj-column>
    </mj-section>`;

      case "image":
        return `    <mj-section padding="0">
      <mj-column>
        <mj-image src="${p.src}" alt="${escape(p.alt)}" width="${p.width}" border-radius="${p["border-radius"]}" padding="${p.padding}"${p.href ? ` href="${p.href}"` : ""} />
      </mj-column>
    </mj-section>`;

      case "button":
        return `    <mj-section padding="0">
      <mj-column>
        <mj-button href="${p.href}" background-color="${p["background-color"]}" color="${p.color}" border-radius="${p["border-radius"]}" font-size="${p["font-size"]}" inner-padding="${p.padding}" align="${p.align}">
          ${escape(p.text)}
        </mj-button>
      </mj-column>
    </mj-section>`;

      case "divider":
        return `    <mj-section padding="0">
      <mj-column>
        <mj-divider border-color="${p["border-color"]}" border-width="${p["border-width"]}" border-style="${p["border-style"]}" width="${p.width}" padding="${p.padding}" />
      </mj-column>
    </mj-section>`;

      case "spacer":
        return `    <mj-section padding="0">
      <mj-column>
        <mj-spacer height="${p.height}" />
      </mj-column>
    </mj-section>`;

      case "two-col":
        return `    <mj-section padding="0">
      <mj-column width="${p["col1-width"]}">
        <mj-text padding="${p.padding}">${p["col1-content"]}</mj-text>
      </mj-column>
      <mj-column width="${p["col2-width"]}">
        <mj-text padding="${p.padding}">${p["col2-content"]}</mj-text>
      </mj-column>
    </mj-section>`;

      case "three-col":
        return `    <mj-section padding="0">
      <mj-column width="33.33%">
        <mj-text padding="${p.padding}">${p["col1-content"]}</mj-text>
      </mj-column>
      <mj-column width="33.33%">
        <mj-text padding="${p.padding}">${p["col2-content"]}</mj-text>
      </mj-column>
      <mj-column width="33.34%">
        <mj-text padding="${p.padding}">${p["col3-content"]}</mj-text>
      </mj-column>
    </mj-section>`;

      case "social":
        return `    <mj-section padding="0">
      <mj-column>
        <mj-social font-size="13px" icon-size="${p["icon-size"]}" align="${p.align}" padding="${p.padding}">
          ${p.facebook ? `<mj-social-element name="facebook" href="${p.facebook}">Facebook</mj-social-element>` : ""}
          ${p.instagram ? `<mj-social-element name="instagram" href="${p.instagram}">Instagram</mj-social-element>` : ""}
          ${p.twitter ? `<mj-social-element name="twitter" href="${p.twitter}">Twitter</mj-social-element>` : ""}
        </mj-social>
      </mj-column>
    </mj-section>`;

      case "hero":
        return `    <mj-hero mode="fixed-height" height="${p.height}" background-url="${p["background-url"]}" background-color="${p["background-color"]}" border-radius="${p["border-radius"]}" padding="${p.padding}">
      <mj-text align="center" color="${p["title-color"]}" font-size="${p["title-font-size"]}" font-weight="bold">
        ${escape(p.title)}
      </mj-text>
      <mj-text align="center" color="${p["subtitle-color"]}" font-size="15px">
        ${escape(p.subtitle)}
      </mj-text>
    </mj-hero>`;

      default:
        return "";
    }
  };

  return `<mjml>
  <mj-head>
    <mj-preview>${escape(header.previewText)}</mj-preview>
    <mj-attributes>
      <mj-all font-family="${header.fontFamily}, Arial, sans-serif" />
      <mj-body width="${header.width}" background-color="${header.bgColor}" />
    </mj-attributes>
  </mj-head>
  <mj-body width="${header.width}" background-color="${header.bgColor}">
${blocks.map(renderBlock).filter(Boolean).join("\n")}
  </mj-body>
</mjml>`;
}

// ─── Block canvas item ────────────────────────────────────────────────────────

function BlockItem({
  block, index, total, selected, onSelect, onDelete, onMoveUp, onMoveDown,
}: {
  block: Block; index: number; total: number; selected: boolean;
  onSelect: () => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const meta = BLOCK_PALETTE.find((b) => b.type === block.type);
  const Icon = meta?.Icon ?? Layers;

  const preview = () => {
    const p = block.props;
    switch (block.type) {
      case "text": return <div className="text-xs text-[var(--foreground)] opacity-70 line-clamp-2" dangerouslySetInnerHTML={{ __html: p.content }} />;
      case "image": return <div className="text-xs text-[var(--foreground)] opacity-60 truncate">🖼 {p.src}</div>;
      case "button": return <span className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold text-white" style={{ background: p["background-color"] }}>{p.text}</span>;
      case "divider": return <hr className="border-t my-1" style={{ borderColor: p["border-color"], borderStyle: p["border-style"] as any }} />;
      case "spacer": return <div className="text-xs text-[var(--foreground)] opacity-50">Height: {p.height}</div>;
      case "two-col": return <div className="flex gap-1 text-xs opacity-60"><span className="flex-1 bg-slate-100 dark:bg-slate-700 rounded p-1 text-center">Col 1</span><span className="flex-1 bg-slate-100 dark:bg-slate-700 rounded p-1 text-center">Col 2</span></div>;
      case "three-col": return <div className="flex gap-1 text-xs opacity-60"><span className="flex-1 bg-slate-100 dark:bg-slate-700 rounded p-1 text-center">1</span><span className="flex-1 bg-slate-100 dark:bg-slate-700 rounded p-1 text-center">2</span><span className="flex-1 bg-slate-100 dark:bg-slate-700 rounded p-1 text-center">3</span></div>;
      case "social": return <div className="text-xs opacity-60">FB / IG / TW</div>;
      case "hero": return <div className="text-xs font-semibold truncate">{p.title}</div>;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl border-2 p-3 cursor-pointer transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
          <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{meta?.label}</p>
          {preview()}
        </div>
        <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Properties panel ─────────────────────────────────────────────────────────

function PropInput({ label, value, onChange, type = "text", options }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: "text" | "color" | "select" | "textarea"; options?: string[];
}) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {type === "textarea" ? (
        <textarea
          className="input min-h-[80px] resize-y font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : type === "select" && options ? (
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : type === "color" ? (
        <div className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 rounded border border-slate-200 cursor-pointer bg-white" />
          <input type="text" className="input flex-1" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      ) : (
        <input type="text" className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function PropertiesPanel({ block, onChange }: {
  block: Block; onChange: (props: Record<string, string>) => void;
}) {
  const set = (key: string) => (val: string) => onChange({ ...block.props, [key]: val });
  const p = block.props;

  switch (block.type) {
    case "text":
      return (
        <>
          <PropInput label="Content (HTML)" value={p.content} onChange={set("content")} type="textarea" />
          <PropInput label="Font Size" value={p["font-size"]} onChange={set("font-size")} />
          <PropInput label="Color" value={p.color} onChange={set("color")} type="color" />
          <PropInput label="Font Weight" value={p["font-weight"]} onChange={set("font-weight")} type="select" options={["normal", "bold", "600", "700"]} />
          <PropInput label="Text Align" value={p["text-align"]} onChange={set("text-align")} type="select" options={["left", "center", "right"]} />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
        </>
      );
    case "image":
      return (
        <>
          <PropInput label="Image URL" value={p.src} onChange={set("src")} />
          <PropInput label="Alt Text" value={p.alt} onChange={set("alt")} />
          <PropInput label="Width" value={p.width} onChange={set("width")} />
          <PropInput label="Link (href)" value={p.href} onChange={set("href")} />
          <PropInput label="Border Radius" value={p["border-radius"]} onChange={set("border-radius")} />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
        </>
      );
    case "button":
      return (
        <>
          <PropInput label="Button Text" value={p.text} onChange={set("text")} />
          <PropInput label="Link (href)" value={p.href} onChange={set("href")} />
          <PropInput label="Background Color" value={p["background-color"]} onChange={set("background-color")} type="color" />
          <PropInput label="Text Color" value={p.color} onChange={set("color")} type="color" />
          <PropInput label="Border Radius" value={p["border-radius"]} onChange={set("border-radius")} />
          <PropInput label="Font Size" value={p["font-size"]} onChange={set("font-size")} />
          <PropInput label="Padding (inner)" value={p.padding} onChange={set("padding")} />
          <PropInput label="Align" value={p.align} onChange={set("align")} type="select" options={["left", "center", "right"]} />
        </>
      );
    case "divider":
      return (
        <>
          <PropInput label="Border Color" value={p["border-color"]} onChange={set("border-color")} type="color" />
          <PropInput label="Border Width" value={p["border-width"]} onChange={set("border-width")} />
          <PropInput label="Border Style" value={p["border-style"]} onChange={set("border-style")} type="select" options={["solid", "dashed", "dotted"]} />
          <PropInput label="Width" value={p.width} onChange={set("width")} />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
        </>
      );
    case "spacer":
      return <PropInput label="Height" value={p.height} onChange={set("height")} />;
    case "two-col":
      return (
        <>
          <PropInput label="Column 1 Width" value={p["col1-width"]} onChange={set("col1-width")} />
          <PropInput label="Column 1 Content (HTML)" value={p["col1-content"]} onChange={set("col1-content")} type="textarea" />
          <PropInput label="Column 2 Width" value={p["col2-width"]} onChange={set("col2-width")} />
          <PropInput label="Column 2 Content (HTML)" value={p["col2-content"]} onChange={set("col2-content")} type="textarea" />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
        </>
      );
    case "three-col":
      return (
        <>
          <PropInput label="Column 1 (HTML)" value={p["col1-content"]} onChange={set("col1-content")} type="textarea" />
          <PropInput label="Column 2 (HTML)" value={p["col2-content"]} onChange={set("col2-content")} type="textarea" />
          <PropInput label="Column 3 (HTML)" value={p["col3-content"]} onChange={set("col3-content")} type="textarea" />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
        </>
      );
    case "social":
      return (
        <>
          <PropInput label="Facebook URL" value={p.facebook} onChange={set("facebook")} />
          <PropInput label="Instagram URL" value={p.instagram} onChange={set("instagram")} />
          <PropInput label="Twitter URL" value={p.twitter} onChange={set("twitter")} />
          <PropInput label="Icon Size" value={p["icon-size"]} onChange={set("icon-size")} />
          <PropInput label="Align" value={p.align} onChange={set("align")} type="select" options={["left", "center", "right"]} />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
        </>
      );
    case "hero":
      return (
        <>
          <PropInput label="Background Image URL" value={p["background-url"]} onChange={set("background-url")} />
          <PropInput label="Background Color" value={p["background-color"]} onChange={set("background-color")} type="color" />
          <PropInput label="Height" value={p.height} onChange={set("height")} />
          <PropInput label="Heading Text" value={p.title} onChange={set("title")} />
          <PropInput label="Heading Color" value={p["title-color"]} onChange={set("title-color")} type="color" />
          <PropInput label="Heading Font Size" value={p["title-font-size"]} onChange={set("title-font-size")} />
          <PropInput label="Subtitle Text" value={p.subtitle} onChange={set("subtitle")} type="textarea" />
          <PropInput label="Subtitle Color" value={p["subtitle-color"]} onChange={set("subtitle-color")} type="color" />
          <PropInput label="Padding" value={p.padding} onChange={set("padding")} />
          <PropInput label="Border Radius" value={p["border-radius"]} onChange={set("border-radius")} />
        </>
      );
    default:
      return null;
  }
}

// ─── Send test modal ──────────────────────────────────────────────────────────

function SendTestModal({ mjml, onClose }: { mjml: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const send = async () => {
    if (!email) return;
    setSending(true);
    try {
      const compileRes = await fetch("/api/email/mjml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mjml }),
      });
      const { html } = await compileRes.json();
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject: "[Test Email]", html }),
      });
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Send Test Email</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        {done ? (
          <p className="text-sm text-emerald-600 font-medium">Test email sent to {email}!</p>
        ) : (
          <>
            <label className="label">Recipient Email</label>
            <input
              type="email" className="input mb-4" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={send} disabled={sending || !email} className="btn-primary w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send Test"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Template gallery ─────────────────────────────────────────────────────────

function TemplateGallery({
  brandId, onLoad,
}: {
  brandId: string;
  onLoad: (mjml: string, name: string) => void;
}) {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ brand_id: brandId, category: filter });
      const res = await fetch(`/api/email/mjml?${params}`);
      const { templates: tpls } = await res.json();
      setTemplates(tpls ?? []);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <LayoutTemplate className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">Browse your saved templates</p>
        <button onClick={load} className="btn-outline text-sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Load Templates
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <select className="input flex-1" value={filter} onChange={(e) => { setFilter(e.target.value); setLoaded(false); }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={load} className="btn-outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </button>
      </div>
      {templates.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No templates saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 hover:border-indigo-400 transition-colors">
              <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <LayoutTemplate className="h-8 w-8 text-slate-400" />
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{t.name}</p>
                <p className="text-[10px] text-slate-500 mb-2">{t.category}</p>
                <button
                  onClick={() => onLoad(t.mjml_source, t.name)}
                  className="w-full btn-primary py-1 text-xs"
                >
                  Use template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MjmlDesigner({ brandId, onTemplateSelected }: MjmlDesignerProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [header, setHeader] = useState<HeaderProps>({
    previewText: "",
    bgColor: "#ffffff",
    width: "600px",
    fontFamily: "Inter",
  });
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [category, setCategory] = useState<string>("campaign");
  const [showCode, setShowCode] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showVarPicker, setShowVarPicker] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const varPickerRef = useRef<HTMLDivElement>(null);

  const mjml = buildMjml(blocks, header);
  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const uid = () => Math.random().toString(36).slice(2, 9);

  const addBlock = (type: Block["type"]) => {
    const block: Block = { id: uid(), type, props: { ...BLOCK_DEFAULTS[type] } };
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
    setShowGallery(false);
  };

  const updateBlock = (id: string, props: Record<string, string>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const preview = async () => {
    setPreviewing(true);
    setPreviewHtml(null);
    try {
      const res = await fetch("/api/email/mjml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mjml }),
      });
      const { html } = await res.json();
      setPreviewHtml(html);
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/email/mjml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          save: true,
          name: templateName,
          category,
          mjml_source: mjml,
          brand_id: brandId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMsg("Saved!");
        if (onTemplateSelected) {
          const compileRes = await fetch("/api/email/mjml", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mjml }),
          });
          const { html } = await compileRes.json();
          onTemplateSelected(html, mjml, templateName);
        }
      } else {
        setSaveMsg(data.error ?? "Error saving");
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const loadTemplate = useCallback((mjmlSource: string, name: string) => {
    setTemplateName(name);
    setBlocks([]);
    setSelectedId(null);
    setShowGallery(false);
    // Parse blocks from MJML is complex — instead, store raw source in a special block
    // For gallery load we just show the MJML as a readonly "raw" block + notify parent
    const block: Block = {
      id: uid(),
      type: "text",
      props: {
        ...BLOCK_DEFAULTS.text,
        content: `<em>Template loaded: <strong>${name}</strong>. Edit the MJML code directly below or add blocks above.</em>`,
      },
    };
    setBlocks([block]);
    if (onTemplateSelected) {
      fetch("/api/email/mjml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mjml: mjmlSource }),
      }).then((r) => r.json()).then(({ html }) => {
        onTemplateSelected(html, mjmlSource, name);
      });
    }
  }, [onTemplateSelected]);

  const insertVariable = (variable: string) => {
    if (!selectedBlock || selectedBlock.type !== "text") return;
    const updated = { ...selectedBlock.props, content: selectedBlock.props.content + variable };
    updateBlock(selectedBlock.id, updated);
    setShowVarPicker(false);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[var(--background)]">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
        <input
          className="input h-8 w-52 text-sm"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Template name"
        />
        <select
          className="input h-8 w-40 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {/* Variable picker */}
          <div className="relative" ref={varPickerRef}>
            <button
              onClick={() => setShowVarPicker((v) => !v)}
              className="btn-ghost h-8 gap-1 text-xs"
              title="Insert variable"
            >
              <Variable className="h-3.5 w-3.5" /> Variables
            </button>
            {showVarPicker && (
              <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                {VARIABLES.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => insertVariable(v.value)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{v.label}</span>
                    <code className="text-indigo-600 dark:text-indigo-400">{v.value}</code>
                  </button>
                ))}
                {!selectedBlock || selectedBlock.type !== "text" ? (
                  <p className="px-3 py-2 text-[10px] text-slate-400">Select a text block first</p>
                ) : null}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowGallery((v) => !v)}
            className={`h-8 gap-1 text-xs ${showGallery ? "btn-primary" : "btn-ghost"}`}
          >
            <LayoutTemplate className="h-3.5 w-3.5" /> Gallery
          </button>

          <button
            onClick={preview}
            disabled={previewing || blocks.length === 0}
            className="btn-ghost h-8 gap-1 text-xs"
          >
            {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Preview
          </button>

          <button
            onClick={() => setShowTest(true)}
            disabled={blocks.length === 0}
            className="btn-ghost h-8 gap-1 text-xs"
          >
            <Send className="h-3.5 w-3.5" /> Send Test
          </button>

          <button
            onClick={save}
            disabled={saving || blocks.length === 0}
            className="btn-primary h-8 gap-1 text-xs"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save Template"}
          </button>

          {saveMsg && (
            <span className={`text-xs font-medium ${saveMsg === "Saved!" ? "text-emerald-600" : "text-red-500"}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: palette + header settings ── */}
        <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="label mb-2">Add Blocks</p>
            <div className="flex flex-col gap-1">
              {BLOCK_PALETTE.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  <Plus className="h-3 w-3 ml-auto opacity-40" />
                </button>
              ))}
            </div>
          </div>

          {/* Header / global settings */}
          <div className="p-3">
            <p className="label mb-2">Email Settings</p>
            <div className="mb-2">
              <label className="label">Preview Text</label>
              <input className="input text-xs" value={header.previewText} onChange={(e) => setHeader((h) => ({ ...h, previewText: e.target.value }))} placeholder="Shown in inbox…" />
            </div>
            <div className="mb-2">
              <label className="label">Background Color</label>
              <div className="flex gap-1 items-center">
                <input type="color" value={header.bgColor} onChange={(e) => setHeader((h) => ({ ...h, bgColor: e.target.value }))} className="h-7 w-9 rounded border cursor-pointer" />
                <input className="input flex-1 text-xs" value={header.bgColor} onChange={(e) => setHeader((h) => ({ ...h, bgColor: e.target.value }))} />
              </div>
            </div>
            <div className="mb-2">
              <label className="label">Email Width</label>
              <input className="input text-xs" value={header.width} onChange={(e) => setHeader((h) => ({ ...h, width: e.target.value }))} />
            </div>
            <div className="mb-2">
              <label className="label">Font Family</label>
              <select className="input text-xs" value={header.fontFamily} onChange={(e) => setHeader((h) => ({ ...h, fontFamily: e.target.value }))}>
                {["Inter", "Georgia", "Arial", "Helvetica", "Trebuchet MS", "Verdana"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* ── Center: canvas ── */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {/* Gallery overlay */}
          {showGallery && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Template Gallery</h3>
                <button onClick={() => setShowGallery(false)} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
              </div>
              <TemplateGallery brandId={brandId} onLoad={loadTemplate} />
            </div>
          )}

          {/* Preview iframe */}
          {previewHtml && (
            <div className="relative border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Preview</span>
                <button onClick={() => setPreviewHtml(null)} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full border-0"
                style={{ height: 480 }}
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          )}

          {/* Block list */}
          <div className="flex-1 p-4">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                <Layers className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Add blocks from the left panel</p>
                <p className="text-xs text-slate-400 dark:text-slate-600">or load a template from the Gallery</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                {blocks.map((block, i) => (
                  <BlockItem
                    key={block.id}
                    block={block}
                    index={i}
                    total={blocks.length}
                    selected={selectedId === block.id}
                    onSelect={() => setSelectedId(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => move(block.id, -1)}
                    onMoveDown={() => move(block.id, 1)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Collapsible MJML code panel */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Code2 className="h-3.5 w-3.5" />
              Generated MJML
              {showCode ? <ChevronDown className="h-3.5 w-3.5 ml-auto" /> : <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </button>
            {showCode && (
              <pre className="overflow-x-auto bg-slate-950 px-4 py-3 text-[11px] leading-relaxed text-slate-300 max-h-72 overflow-y-auto">
                {mjml}
              </pre>
            )}
          </div>
        </main>

        {/* ── Right: properties ── */}
        <aside className="flex w-60 shrink-0 flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          {selectedBlock ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {BLOCK_PALETTE.find((b) => b.type === selectedBlock.type)?.label ?? "Block"} Properties
                </p>
                <button onClick={() => setSelectedId(null)} className="rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
              <PropertiesPanel
                block={selectedBlock}
                onChange={(props) => updateBlock(selectedBlock.id, props)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4 opacity-50">
              <ArrowUpFromLine className="h-6 w-6 text-slate-400 rotate-90" />
              <p className="text-xs text-slate-500 text-center">Click a block to edit its properties</p>
            </div>
          )}
        </aside>
      </div>

      {/* Send test modal */}
      {showTest && <SendTestModal mjml={mjml} onClose={() => setShowTest(false)} />}
    </div>
  );
}
