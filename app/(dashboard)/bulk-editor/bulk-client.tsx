"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Download, Link2, Table, FileSpreadsheet, RefreshCw,
  Plus, Trash2, CheckCircle2, XCircle, AlertCircle, Clock,
  ChevronDown, ChevronRight, Play, StopCircle, Eye,
  Calendar, Filter, Layers, Settings, Copy, FileText,
  ToggleLeft, ToggleRight, Database, Zap,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  brandId: string;
  jobs: any[];
}

const TABS = ["Import", "Export", "Jobs", "Templates"] as const;
type Tab = typeof TABS[number];

const ENTITY_TYPES = [
  "Products", "Variants", "Customers", "Orders", "Collections",
  "Pages", "Blog Posts", "Redirects", "Discounts", "Metafields",
  "Metaobjects", "Files", "Menus",
] as const;
type EntityType = typeof ENTITY_TYPES[number];

const UPDATE_MODES = [
  {
    value: "MERGE",
    label: "MERGE",
    description: "Update existing records or create new ones (recommended default)",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    value: "NEW",
    label: "NEW",
    description: "Create only — fail if record already exists",
    color: "text-blue-600 bg-blue-50",
  },
  {
    value: "UPDATE",
    label: "UPDATE",
    description: "Update only — skip rows for records that don't exist",
    color: "text-violet-600 bg-violet-50",
  },
  {
    value: "REPLACE",
    label: "REPLACE",
    description: "Delete and recreate — destructive, use with caution",
    color: "text-orange-600 bg-orange-50",
  },
  {
    value: "DELETE",
    label: "DELETE",
    description: "Remove matching items from Shopify",
    color: "text-red-600 bg-red-50",
  },
  {
    value: "IGNORE",
    label: "IGNORE",
    description: "Skip rows — useful for dry-run validation",
    color: "text-ink-muted bg-surface-tint",
  },
] as const;

const FIELDS_BY_ENTITY: Record<string, string[]> = {
  Products: ["ID", "Handle", "Title", "Body HTML", "Vendor", "Type", "Tags", "Status", "Price", "Compare At Price", "SKU", "Inventory", "Weight", "Images", "SEO Title", "SEO Description", "Metafields"],
  Variants: ["Product ID", "Title", "SKU", "Barcode", "Price", "Compare At Price", "Weight", "Inventory Policy", "Inventory Quantity", "Option1", "Option2", "Option3", "Image"],
  Customers: ["ID", "Email", "First Name", "Last Name", "Phone", "Tags", "Note", "Accepts Marketing", "Tax Exempt", "Addresses"],
  Orders: ["ID", "Email", "Financial Status", "Fulfillment Status", "Tags", "Note", "Total Price", "Created At", "Line Items"],
  Collections: ["ID", "Handle", "Title", "Body HTML", "Sort Order", "Published", "Image", "Rules"],
  Pages: ["ID", "Handle", "Title", "Body HTML", "Author", "Published", "Metafields"],
  "Blog Posts": ["ID", "Handle", "Title", "Body HTML", "Author", "Tags", "Published At", "Image"],
  Redirects: ["ID", "Path", "Target"],
  Discounts: ["ID", "Code", "Type", "Value", "Starts At", "Ends At", "Usage Limit", "Applies To"],
  Metafields: ["Resource Type", "Resource ID", "Namespace", "Key", "Value", "Type"],
  Metaobjects: ["ID", "Handle", "Type", "Fields"],
  Files: ["URL", "Alt", "Filename"],
  Menus: ["Handle", "Title", "Items"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { cls: string; icon: React.ElementType }> = {
    completed: { cls: "badge-success", icon: CheckCircle2 },
    failed: { cls: "badge-crit", icon: XCircle },
    processing: { cls: "badge-primary", icon: RefreshCw },
    pending: { cls: "badge-warn", icon: Clock },
    cancelled: { cls: "badge-neutral", icon: StopCircle },
  };
  const { cls, icon: Icon } = map[status] ?? { cls: "badge-neutral", icon: AlertCircle };
  return (
    <span className={`${cls} flex items-center gap-1`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
}

function ProgressBar({ value, total, color = "bg-primary" }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-surface-border overflow-hidden w-24">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Import Tab ───────────────────────────────────────────────────────────────

function ImportTab({ brandId, runningJob }: { brandId: string; runningJob: any }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [ftpUrl, setFtpUrl] = useState("");
  const [sourceTab, setSourceTab] = useState<"file" | "sheets" | "ftp">("file");
  const [entityType, setEntityType] = useState<EntityType>("Products");
  const [updateMode, setUpdateMode] = useState("MERGE");
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [jobStarted, setJobStarted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  function handleFile(f: File) {
    setFile(f);
    // Simulate column detection — in production this would parse CSV headers
    setDetectedColumns(["Title", "SKU", "Price", "Inventory", "Tags", "Vendor"]);
    setColumnMap({});
  }

  async function startImport() {
    setLoading(true);
    const file_url = sheetsUrl || ftpUrl || (file ? `upload://${file.name}` : "");
    await fetch("/api/bulk/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, entity_type: entityType.toLowerCase().replace(" ", "_"), update_mode: updateMode, file_url, column_map: columnMap }),
    });
    setLoading(false);
    setJobStarted(true);
  }

  const availableFields = FIELDS_BY_ENTITY[entityType] ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* How-to info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-4">
        <div className="text-2xl">💡</div>
        <div>
          <div className="font-semibold text-amber-800 text-sm mb-1">How to bulk edit with Claude</div>
          <div className="text-amber-700 text-xs leading-relaxed">
            Download your products CSV from Shopify Admin → Products → Export.
            Then open a new Claude conversation, upload the CSV, and describe
            what you want changed — e.g. "increase all prices by 15%" or
            "add 'Sale' to all product titles in the Summer collection".
            Claude will return a modified CSV. Upload it here with mode: <strong>MERGE</strong>.
          </div>
          <div className="mt-2 flex gap-2">
            <a href="https://admin.shopify.com/products" target="_blank" rel="noreferrer"
               className="text-xs text-amber-700 underline font-medium">Open Shopify Admin →</a>
            <a href="https://claude.ai" target="_blank" rel="noreferrer"
               className="text-xs text-amber-700 underline font-medium">Open Claude →</a>
          </div>
        </div>
      </div>

      {/* Source selector */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Data Source</h3>
        <div className="flex gap-2">
          {(["file", "sheets", "ftp"] as const).map(t => (
            <button key={t} onClick={() => setSourceTab(t)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${sourceTab === t ? "bg-primary text-white" : "bg-surface-tint text-ink-muted hover:text-ink"}`}>
              {t === "file" ? "CSV / XLSX Upload" : t === "sheets" ? "Google Sheets" : "FTP / URL"}
            </button>
          ))}
        </div>

        {sourceTab === "file" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary-50" : "border-surface-border hover:border-primary hover:bg-primary-50"}`}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <p className="font-semibold text-ink">{file.name}</p>
                <p className="text-xs text-ink-muted">{(file.size / 1024).toFixed(1)} KB — ready to import</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-ink-muted" />
                <p className="font-semibold text-ink">Drag & drop CSV or XLSX here</p>
                <p className="text-xs text-ink-muted">or click to browse. Max 50 MB.</p>
              </div>
            )}
          </div>
        )}

        {sourceTab === "sheets" && (
          <div>
            <label className="label">Google Sheets URL</label>
            <input className="input" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" />
            <p className="text-xs text-ink-muted mt-1">Sheet must be publicly readable or shared with the service account.</p>
          </div>
        )}

        {sourceTab === "ftp" && (
          <div>
            <label className="label">FTP / HTTP URL</label>
            <input className="input" value={ftpUrl} onChange={e => setFtpUrl(e.target.value)} placeholder="ftp://files.example.com/products.csv" />
          </div>
        )}
      </div>

      {/* Entity + mode */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Entity Type</label>
            <select className="input" value={entityType} onChange={e => { setEntityType(e.target.value as EntityType); setColumnMap({}); }}>
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Update Mode</label>
            <select className="input" value={updateMode} onChange={e => setUpdateMode(e.target.value)}>
              {UPDATE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <div className={`rounded-xl px-3 py-2 text-xs ${UPDATE_MODES.find(m => m.value === updateMode)?.color ?? "bg-surface-tint text-ink-muted"}`}>
          {UPDATE_MODES.find(m => m.value === updateMode)?.description}
        </div>
      </div>

      {/* Column mapping */}
      {detectedColumns.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Table className="w-4 h-4 text-primary" /> Column Mapping</h3>
          <p className="text-xs text-ink-muted">Map your file columns to Shopify fields.</p>
          <div className="grid gap-2">
            {detectedColumns.map(col => (
              <div key={col} className="flex items-center gap-3">
                <code className="text-xs font-mono bg-surface-tint px-2 py-1 rounded w-32 truncate border border-surface-border">{col}</code>
                <span className="text-ink-muted text-xs">→</span>
                <select
                  className="input text-xs flex-1"
                  value={columnMap[col] ?? ""}
                  onChange={e => setColumnMap(m => ({ ...m, [col]: e.target.value }))}
                >
                  <option value="">(skip)</option>
                  {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running job progress */}
      {runningJob && (
        <div className="card border-l-4 border-l-primary bg-primary-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary">Import in progress…</span>
            <span className="text-xs text-ink-muted">{runningJob.processed ?? 0} / {runningJob.total_rows ?? 0} rows</span>
          </div>
          <div className="h-2 rounded-full bg-primary-100 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${runningJob.total_rows > 0 ? (runningJob.processed / runningJob.total_rows) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-ink-muted">
            <span className="text-emerald-600">✓ {runningJob.created ?? 0} created</span>
            <span className="text-blue-600">↻ {runningJob.updated ?? 0} updated</span>
            <span className="text-red-600">✗ {runningJob.failed ?? 0} failed</span>
          </div>
        </div>
      )}

      {jobStarted && !runningJob && (
        <div className="card border-l-4 border-l-emerald-500 bg-emerald-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">Import job started! Check the Jobs tab for progress.</span>
          </div>
        </div>
      )}

      <button
        onClick={startImport}
        disabled={loading || (!file && !sheetsUrl && !ftpUrl)}
        className="btn-primary gap-2"
      >
        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting…</> : <><Play className="w-4 h-4" /> Start Import</>}
      </button>
    </div>
  );
}

// ─── Export Tab ───────────────────────────────────────────────────────────────

function ExportTab({ brandId }: { brandId: string }) {
  const [entityType, setEntityType] = useState<EntityType>("Products");
  const [format, setFormat] = useState("csv");
  const [schedule, setSchedule] = useState("once");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDay, setScheduleDay] = useState("monday");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fields = FIELDS_BY_ENTITY[entityType] ?? [];

  function toggleField(f: string) {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  function selectAll() { setSelectedFields(new Set(fields)); }
  function selectNone() { setSelectedFields(new Set()); }

  async function startExport() {
    setLoading(true);
    await fetch("/api/bulk/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        entity_type: entityType.toLowerCase().replace(" ", "_"),
        format,
        fields: Array.from(selectedFields),
        schedule,
        schedule_time: scheduleTime,
        schedule_day: scheduleDay,
        filters: { date_from: dateFrom, date_to: dateTo, status: statusFilter, tag: tagFilter },
      }),
    });
    setLoading(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Entity Type</label>
            <select className="input" value={entityType} onChange={e => { setEntityType(e.target.value as EntityType); setSelectedFields(new Set()); }}>
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <div className="flex gap-2">
              {["csv", "excel", "sheets"].map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${format === f ? "border-primary bg-primary-50 text-primary" : "border-surface-border text-ink-muted hover:border-primary"}`}>
                  {f === "csv" ? "CSV" : f === "excel" ? "Excel" : "Google Sheets"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Field selector */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Fields to Export</h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-primary hover:underline">Select all</button>
            <span className="text-ink-subtle">·</span>
            <button onClick={selectNone} className="text-xs text-ink-muted hover:underline">None</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {fields.map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer text-sm hover:text-ink text-ink-muted">
              <input type="checkbox" checked={selectedFields.has(f)} onChange={() => toggleField(f)} className="rounded" />
              {f}
            </label>
          ))}
        </div>
        <p className="text-xs text-ink-muted">{selectedFields.size} fields selected</p>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Filters</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date From</label>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Date To</label>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <input className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} placeholder="active, draft, archived…" />
          </div>
          <div>
            <label className="label">Tag</label>
            <input className="input" value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="sale, featured…" />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-ink flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Schedule</h3>
        <div className="flex gap-2">
          {["once", "daily", "weekly"].map(s => (
            <button key={s} onClick={() => setSchedule(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${schedule === s ? "bg-primary text-white" : "bg-surface-tint text-ink-muted hover:text-ink"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {schedule !== "once" && (
          <div className="flex gap-3">
            {schedule === "weekly" && (
              <div className="flex-1">
                <label className="label">Day of Week</label>
                <select className="input" value={scheduleDay} onChange={e => setScheduleDay(e.target.value)}>
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1">
              <label className="label">Time</label>
              <input className="input" type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {done && (
        <div className="card border-l-4 border-l-emerald-500 bg-emerald-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">Export job queued! Check Jobs tab for download link.</span>
          </div>
        </div>
      )}

      <button onClick={startExport} disabled={loading || selectedFields.size === 0} className="btn-primary gap-2">
        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting…</> : <><Download className="w-4 h-4" /> Start Export</>}
      </button>
    </div>
  );
}

// ─── Jobs Tab ─────────────────────────────────────────────────────────────────

function JobsTab({ jobs, brandId }: { jobs: any[]; brandId: string }) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localJobs, setLocalJobs] = useState(jobs);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/bulk/import?brandId=${brandId}&list=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) setLocalJobs(data.jobs);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, brandId]);

  async function cancelJob(id: string) {
    await fetch("/api/bulk/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", job_id: id, brandId }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{localJobs.length} jobs total</p>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-muted">
          <span>Auto-refresh</span>
          <button onClick={() => setAutoRefresh(r => !r)}>
            {autoRefresh ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </label>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-tint text-xs text-ink-muted border-b border-surface-border">
            <tr>
              <th className="p-3 w-6" />
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Entity</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Created</th>
              <th className="p-3 text-right">Updated</th>
              <th className="p-3 text-right">Failed</th>
              <th className="p-3 text-left">Progress</th>
              <th className="p-3 text-left">Started</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {localJobs.map(job => {
              const isExpanded = expanded === job.id;
              const isActive = ["processing", "pending"].includes(job.status);
              return (
                <>
                  <tr key={job.id} className="table-row-hover">
                    <td className="p-3">
                      <button onClick={() => setExpanded(isExpanded ? null : job.id)} className="text-ink-muted hover:text-ink">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${job.type === "import" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                        {job.type?.toUpperCase() ?? "IMPORT"}
                      </span>
                    </td>
                    <td className="p-3 text-xs capitalize">{(job.entity_type ?? "—").replace("_", " ")}</td>
                    <td className="p-3">{statusBadge(job.status ?? "pending")}</td>
                    <td className="p-3 text-right text-xs">{formatNumber(job.total_rows)}</td>
                    <td className="p-3 text-right text-xs text-emerald-600 font-medium">{job.created_count ?? 0}</td>
                    <td className="p-3 text-right text-xs text-blue-600 font-medium">{job.updated_count ?? 0}</td>
                    <td className="p-3 text-right text-xs text-red-600 font-medium">{job.failed_count ?? 0}</td>
                    <td className="p-3">
                      {isActive && job.total_rows > 0 && (
                        <ProgressBar value={job.processed_rows ?? 0} total={job.total_rows} />
                      )}
                    </td>
                    <td className="p-3 text-xs text-ink-muted">{job.started_at ? (job.started_at ?? "").slice(0, 16).replace("T", " ") : "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {job.status === "completed" && job.download_url && (
                          <a href={job.download_url} className="btn-outline text-xs py-1 px-2 gap-1 inline-flex items-center">
                            <Download className="w-3 h-3" /> Download
                          </a>
                        )}
                        {isActive && (
                          <button onClick={() => cancelJob(job.id)} className="btn-danger text-xs py-1 px-2 gap-1 inline-flex items-center">
                            <StopCircle className="w-3 h-3" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${job.id}-exp`} className="bg-surface-tint">
                      <td colSpan={11} className="p-4">
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-3 text-xs">
                            <div><span className="text-ink-muted">Update Mode:</span> <b>{job.update_mode ?? "MERGE"}</b></div>
                            <div><span className="text-ink-muted">File:</span> <code className="font-mono text-[10px]">{job.file_url ?? "—"}</code></div>
                            <div><span className="text-ink-muted">Completed:</span> <b>{job.completed_at ? (job.completed_at ?? "").slice(0, 16).replace("T", " ") : "—"}</b></div>
                            <div><span className="text-ink-muted">Job ID:</span> <code className="font-mono text-[10px]">{job.id}</code></div>
                          </div>
                          {job.errors && job.errors.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-600 mb-1">Errors ({job.errors.length})</p>
                              <div className="bg-red-50 border border-red-100 rounded-xl p-3 max-h-32 overflow-y-auto">
                                {(job.errors as any[]).map((err: any, i: number) => (
                                  <div key={i} className="text-[11px] text-red-700 font-mono border-b border-red-100 py-0.5 last:border-0">
                                    Row {err.row ?? i + 1}: {err.message ?? String(err)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {localJobs.length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">No jobs yet. Run an import or export to get started.</div>
        )}
      </div>
    </div>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab({ brandId }: { brandId: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", entity_type: "Products", update_mode: "MERGE", type: "import", fields: "", notes: "" });
  const [loading, setLoading] = useState(false);

  async function saveTemplate() {
    setLoading(true);
    const res = await fetch("/api/bulk/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_template", brandId, ...form }),
    });
    const data = await res.json();
    if (data.template) setTemplates(t => [data.template, ...t]);
    setLoading(false);
    setShowCreate(false);
    setForm({ name: "", entity_type: "Products", update_mode: "MERGE", type: "import", fields: "", notes: "" });
  }

  async function applyTemplate(tmpl: any) {
    // Pre-fill the import/export tab — in a real app this would navigate + inject
    window.location.hash = tmpl.type;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Save Template
        </button>
      </div>

      {templates.length === 0 && (
        <div className="card text-center py-16">
          <Layers className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <p className="font-semibold text-ink">No templates yet</p>
          <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">Save your column mapping and settings as a template to reuse for recurring imports or exports.</p>
        </div>
      )}

      <div className="grid gap-3">
        {templates.map(tmpl => (
          <div key={tmpl.id} className="card flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-ink">{tmpl.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${tmpl.type === "import" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                  {tmpl.type?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <span>Entity: <b className="text-ink">{tmpl.entity_type}</b></span>
                <span>Mode: <b className="text-ink">{tmpl.update_mode}</b></span>
                {tmpl.notes && <span>{tmpl.notes}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => applyTemplate(tmpl)} className="btn-outline text-xs gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Apply
              </button>
              <button onClick={() => setTemplates(t => t.filter(x => x.id !== tmpl.id))} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-surface-border">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h3 className="font-bold text-ink">Save Template</h3>
              <button onClick={() => setShowCreate(false)} className="text-ink-muted hover:text-ink text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Template Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Monthly Product Sync" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="import">Import</option>
                    <option value="export">Export</option>
                  </select>
                </div>
                <div>
                  <label className="label">Entity</label>
                  <select className="input" value={form.entity_type} onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}>
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Update Mode</label>
                <select className="input" value={form.update_mode} onChange={e => setForm(f => ({ ...f, update_mode: e.target.value }))}>
                  {UPDATE_MODES.map(m => <option key={m.value} value={m.value}>{m.label} — {m.description}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Used for weekly price updates…" />
              </div>
              <button className="btn-primary w-full" onClick={saveTemplate} disabled={loading || !form.name}>
                {loading ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function BulkClient({ brandId, jobs }: Props) {
  const [tab, setTab] = useState<Tab>("Import");

  const runningJob = jobs.find(j => j.status === "processing" || j.status === "pending");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-surface-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t}
            {t === "Jobs" && jobs.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5">{jobs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Import" && <ImportTab brandId={brandId} runningJob={runningJob} />}
      {tab === "Export" && <ExportTab brandId={brandId} />}
      {tab === "Jobs" && <JobsTab jobs={jobs} brandId={brandId} />}
      {tab === "Templates" && <TemplatesTab brandId={brandId} />}
    </div>
  );
}
