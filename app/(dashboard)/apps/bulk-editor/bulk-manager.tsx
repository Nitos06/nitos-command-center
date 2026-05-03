"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload, Download, FileSpreadsheet, ArrowRight, Play, Loader2,
  CheckCircle2, AlertTriangle, X, ChevronDown, ToggleLeft, ToggleRight,
  Package, Users, ShoppingCart, Tag, FileText, Layers, CreditCard,
  Globe, BookOpen, CornerUpRight, Database, Gift, Columns,
} from "lucide-react";

/* ─── types ─── */
interface BulkJob {
  id: string;
  brand_id: string;
  entity_type: string;
  operation: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  errors: number;
  error_details: any;
  created_at: string;
}

interface Props {
  brandId: string;
  recentJobs: BulkJob[];
}

type Tab = "import" | "export";

const ENTITY_TYPES = [
  { value: "products", label: "Products", icon: Package },
  { value: "variants", label: "Variants", icon: Layers },
  { value: "collections", label: "Collections", icon: Columns },
  { value: "customers", label: "Customers", icon: Users },
  { value: "orders", label: "Orders", icon: ShoppingCart },
  { value: "inventory", label: "Inventory", icon: Database },
  { value: "price_rules", label: "Price Rules", icon: Tag },
  { value: "discounts", label: "Discounts", icon: CreditCard },
  { value: "pages", label: "Pages", icon: FileText },
  { value: "blog_posts", label: "Blog Posts", icon: BookOpen },
  { value: "redirects", label: "Redirects", icon: CornerUpRight },
  { value: "metafields", label: "Metafields", icon: Globe },
  { value: "gift_cards", label: "Gift Cards", icon: Gift },
];

const UPDATE_MODES = [
  { value: "MERGE", label: "Merge", desc: "Update existing, create new" },
  { value: "NEW", label: "New Only", desc: "Create only, skip existing" },
  { value: "UPDATE", label: "Update Only", desc: "Update existing, skip new" },
  { value: "REPLACE", label: "Replace", desc: "Delete all and re-create" },
  { value: "DELETE", label: "Delete", desc: "Delete matching records" },
  { value: "IGNORE", label: "Ignore Existing", desc: "Skip duplicates silently" },
];

const EXPORT_FIELDS: Record<string, string[]> = {
  products: ["title", "body_html", "vendor", "product_type", "tags", "handle", "status", "published_at", "images", "variants"],
  variants: ["title", "sku", "price", "compare_at_price", "inventory_quantity", "weight", "barcode", "option1", "option2", "option3"],
  collections: ["title", "body_html", "handle", "sort_order", "published", "image"],
  customers: ["first_name", "last_name", "email", "phone", "orders_count", "total_spent", "tags", "accepts_marketing"],
  orders: ["name", "email", "financial_status", "fulfillment_status", "total_price", "subtotal_price", "line_items", "created_at"],
  inventory: ["sku", "location", "available", "incoming", "committed"],
  price_rules: ["title", "value", "value_type", "target_type", "starts_at", "ends_at"],
  discounts: ["code", "value", "value_type", "usage_count", "starts_at", "ends_at"],
  pages: ["title", "body_html", "handle", "published_at"],
  blog_posts: ["title", "body_html", "author", "tags", "published_at"],
  redirects: ["path", "target"],
  metafields: ["namespace", "key", "value", "type", "owner_resource", "owner_id"],
  gift_cards: ["code", "initial_value", "balance", "customer_id", "expires_on"],
};

/* ─── component ─── */
export default function BulkManager({ brandId, recentJobs: initialJobs }: Props) {
  const [tab, setTab] = useState<Tab>("import");
  const [entityType, setEntityType] = useState("products");
  const [jobs, setJobs] = useState<BulkJob[]>(initialJobs);

  /* Import state */
  const [file, setFile] = useState<File | null>(null);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [updateMode, setUpdateMode] = useState("MERGE");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [dryRun, setDryRun] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Export state */
  const [exportFields, setExportFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [exporting, setExporting] = useState(false);

  /* Active job tracking */
  const activeJob = jobs.find((j) => j.status === "processing");

  /* ─── File handling ─── */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    // Parse first row for column headers
    const text = await f.text();
    const firstLine = text.split("\n")[0];
    let cols: string[] = [];
    if (f.name.endsWith(".csv")) {
      cols = firstLine.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    } else if (f.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        const firstItem = Array.isArray(parsed) ? parsed[0] : parsed;
        cols = Object.keys(firstItem || {});
      } catch {
        cols = [];
      }
    } else {
      cols = firstLine.split("\t").map((c) => c.trim());
    }
    setFileColumns(cols);

    // Auto-map columns matching target fields
    const targetFields = EXPORT_FIELDS[entityType] || [];
    const autoMap: Record<string, string> = {};
    cols.forEach((col) => {
      const norm = col.toLowerCase().replace(/[\s_-]/g, "");
      const match = targetFields.find(
        (tf) => tf.toLowerCase().replace(/[\s_-]/g, "") === norm
      );
      if (match) autoMap[col] = match;
    });
    setColumnMapping(autoMap);
  }, [entityType]);

  /* ─── Import ─── */
  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity_type", entityType);
      formData.append("update_mode", updateMode);
      formData.append("column_mapping", JSON.stringify(columnMapping));
      formData.append("dry_run", String(dryRun));
      formData.append("brand_id", brandId);

      const res = await fetch("/api/apps/bulk-editor/import", {
        method: "POST",
        body: formData,
      });
      const job = await res.json();
      setJobs((prev) => [job, ...prev]);
      setFile(null);
      setFileColumns([]);
      setColumnMapping({});
    } catch (e) {
      console.error("Import failed", e);
    } finally {
      setImporting(false);
    }
  }, [file, entityType, updateMode, columnMapping, dryRun, brandId]);

  /* ─── Export ─── */
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/apps/bulk-editor/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          entity_type: entityType,
          fields: exportFields,
          format: exportFormat,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityType}-export.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  }, [brandId, entityType, exportFields, exportFormat]);

  const targetFields = EXPORT_FIELDS[entityType] || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
          Bulk Editor
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Import and export Shopify data in bulk
        </p>
      </div>

      {/* Entity Type Selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Entity Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {ENTITY_TYPES.map((et) => {
            const Icon = et.icon;
            return (
              <button
                key={et.value}
                onClick={() => {
                  setEntityType(et.value);
                  setExportFields([]);
                  setFileColumns([]);
                  setColumnMapping({});
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                  entityType === et.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {et.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("import")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "import"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={() => setTab("export")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "export"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* ─── Import Flow ─── */}
      {tab === "import" && (
        <div className="space-y-6">
          {/* File Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              file ? "border-indigo-300 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) {
                const syntheticEvent = { target: { files: [f] } } as any;
                handleFileSelect(syntheticEvent);
              }
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB &middot; {fileColumns.length} columns detected
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileColumns([]);
                    setColumnMapping({});
                  }}
                  className="ml-3 p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports CSV, XLSX, JSON</p>
              </div>
            )}
          </div>

          {/* Update Mode */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Update Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {UPDATE_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setUpdateMode(m.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    updateMode === m.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      updateMode === m.value ? "text-indigo-700" : "text-gray-700"
                    }`}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Column Mapping */}
          {fileColumns.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Column Mapping</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {fileColumns.map((col) => (
                  <div
                    key={col}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 font-mono w-1/3 truncate">
                      {col}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <select
                      value={columnMapping[col] || ""}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [col]: e.target.value,
                        }))
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                    >
                      <option value="">-- Skip --</option>
                      {targetFields.map((tf) => (
                        <option key={tf} value={tf}>
                          {tf}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dry Run + Start */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDryRun(!dryRun)}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              {dryRun ? (
                <ToggleRight className="w-5 h-5 text-indigo-600" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
              <span className={dryRun ? "font-medium text-indigo-700" : ""}>
                Dry Run {dryRun && "(no changes will be made)"}
              </span>
            </button>

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {importing ? "Importing..." : "Start Import"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Export Flow ─── */}
      {tab === "export" && (
        <div className="space-y-6">
          {/* Field Selector */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Select Fields to Export</h3>
              <button
                onClick={() =>
                  setExportFields(
                    exportFields.length === targetFields.length ? [] : [...targetFields]
                  )
                }
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {exportFields.length === targetFields.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {targetFields.map((field) => {
                const selected = exportFields.includes(field);
                return (
                  <button
                    key={field}
                    onClick={() =>
                      setExportFields((prev) =>
                        selected ? prev.filter((f) => f !== field) : [...prev, field]
                      )
                    }
                    className={`px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {field}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format + Export Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Format:</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={exportFields.length === 0 || exporting}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? "Exporting..." : "Export Data"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Active Job Progress ─── */}
      {activeJob && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing: {activeJob.entity_type} {activeJob.operation}
            </h3>
            <span className="text-xs text-indigo-600">
              {activeJob.processed_rows} / {activeJob.total_rows} rows
            </span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{
                width: `${activeJob.total_rows ? (activeJob.processed_rows / activeJob.total_rows) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-indigo-500 mt-2">
            {activeJob.total_rows
              ? `${((activeJob.processed_rows / activeJob.total_rows) * 100).toFixed(0)}% complete`
              : "Starting..."}
            {activeJob.errors > 0 && ` - ${activeJob.errors} errors`}
          </p>
        </div>
      )}

      {/* ─── Recent Jobs ─── */}
      {jobs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Recent Jobs</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {job.entity_type} &middot; {job.operation}
                    </p>
                    <p className="text-xs text-gray-400">
                      {job.processed_rows}/{job.total_rows} rows &middot;{" "}
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {job.errors > 0 && (
                  <span className="text-xs text-red-500 font-medium">{job.errors} errors</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const icons: Record<string, any> = {
    queued: ChevronDown,
    processing: Loader2,
    done: CheckCircle2,
    error: AlertTriangle,
  };
  const Icon = icons[status] || ChevronDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
        styles[status] || styles.queued
      }`}
    >
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}
