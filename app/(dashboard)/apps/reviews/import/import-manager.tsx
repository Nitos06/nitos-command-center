"use client";

import { useState, useRef } from "react";
import {
  Upload, FileText, Download, Loader2, CheckCircle2, AlertCircle,
  X, Clock, ArrowRight, Key,
} from "lucide-react";

interface ImportRecord {
  id: string;
  source: string;
  file_name?: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_count: number;
  imported_count: number;
  failed_count: number;
  created_at: string;
  completed_at?: string;
  brand_id: string;
}

interface Props {
  brandId: string;
  imports: ImportRecord[];
}

const SOURCES = [
  { id: "judgeme", name: "Judge.me", icon: "JM", color: "bg-green-100 text-green-700" },
  { id: "csv", name: "CSV File", icon: "CSV", color: "bg-blue-100 text-blue-700" },
  { id: "amazon", name: "Amazon", icon: "AZ", color: "bg-amber-100 text-amber-700" },
  { id: "etsy", name: "Etsy", icon: "ET", color: "bg-orange-100 text-orange-700" },
  { id: "aliexpress", name: "AliExpress", icon: "AE", color: "bg-red-100 text-red-700" },
] as const;

function StatusBadge({ status }: { status: ImportRecord["status"] }) {
  const cls = {
    pending: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  }[status];
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

export default function ImportManager({ brandId, imports }: Props) {
  const [selectedSource, setSelectedSource] = useState<string>("csv");
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [localImports, setLocalImports] = useState(imports);
  const fileRef = useRef<HTMLInputElement>(null);

  async function startImport() {
    setImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("brandId", brandId);
      formData.append("source", selectedSource);
      if (selectedSource === "judgeme" && apiKey) {
        formData.append("apiKey", apiKey);
      }
      if (file) {
        formData.append("file", file);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + Math.random() * 15;
        });
      }, 500);

      const res = await fetch("/api/apps/reviews/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (data.import) {
        setLocalImports(prev => [data.import, ...prev]);
        setImportResult({ success: true, message: `Successfully imported ${data.import.imported_count} reviews.` });
      } else {
        setImportResult({ success: true, message: data.message || "Import started successfully." });
      }

      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setImportResult({ success: false, message: "Import failed. Please try again." });
    } finally {
      setImporting(false);
    }
  }

  const selectedSourceInfo = SOURCES.find(s => s.id === selectedSource);

  return (
    <div className="space-y-4">
      {/* Source selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">Import Source</div>
        <div className="grid grid-cols-5 gap-2">
          {SOURCES.map(src => (
            <button
              key={src.id}
              onClick={() => { setSelectedSource(src.id); setFile(null); setApiKey(""); setImportResult(null); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                selectedSource === src.id
                  ? "bg-indigo-50 border-indigo-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${src.color}`}>{src.icon}</span>
              <span className="text-xs text-gray-700">{src.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Import config */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {selectedSource === "judgeme" && (
          <div>
            <label className="text-xs text-gray-600 block mb-1">Judge.me API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter your Judge.me API key"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Find your API key in Judge.me Settings &gt; API</div>
          </div>
        )}

        {selectedSource !== "judgeme" && (
          <div>
            <label className="text-xs text-gray-600 block mb-1">Upload File</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-400" />
              {file ? (
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs text-gray-700">{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="p-0.5 rounded hover:bg-gray-200">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500">Click to upload or drag & drop</div>
                  <div className="text-[10px] text-gray-400">CSV, JSON, or XML files supported</div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,.xml"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {/* Progress */}
        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Importing from {selectedSourceInfo?.name}...</span>
              <span className="text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result message */}
        {importResult && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
            importResult.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {importResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {importResult.message}
          </div>
        )}

        <button
          onClick={startImport}
          disabled={importing || (selectedSource === "judgeme" ? !apiKey : selectedSource !== "judgeme" && !file)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {importing ? "Importing..." : "Start Import"}
        </button>
      </div>

      {/* Import history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Import History</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 text-xs border-b border-gray-200">
              <tr>
                <th className="py-2 px-4">Source</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Imported</th>
                <th className="py-2 px-3">Failed</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {localImports.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-xs">No imports yet.</td></tr>
              )}
              {localImports.map(imp => {
                const src = SOURCES.find(s => s.id === imp.source);
                return (
                  <tr key={imp.id} className="border-t border-gray-100 hover:bg-gray-50/40">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${src?.color || "bg-gray-100 text-gray-600"}`}>
                          {src?.icon || imp.source}
                        </span>
                        <span className="text-xs text-gray-700">{src?.name || imp.source}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-500 whitespace-nowrap">{new Date(imp.created_at).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-xs text-gray-900">{imp.total_count}</td>
                    <td className="py-2 px-3 text-xs text-green-600">{imp.imported_count}</td>
                    <td className="py-2 px-3 text-xs text-red-500">{imp.failed_count}</td>
                    <td className="py-2 px-3"><StatusBadge status={imp.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
