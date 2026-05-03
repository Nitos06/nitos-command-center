"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet, ChevronDown, ChevronRight, RefreshCw, Loader2,
  CheckCircle2, AlertTriangle, Clock, RotateCcw,
} from "lucide-react";

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

export default function BulkJobsPage() {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apps/bulk-editor/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      console.error("Failed to fetch jobs", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleRerun = async (job: BulkJob) => {
    setRerunningId(job.id);
    try {
      const res = await fetch("/api/apps/bulk-editor/jobs/rerun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      const newJob = await res.json();
      setJobs((prev) => [newJob, ...prev]);
    } catch (e) {
      console.error("Rerun failed", e);
    } finally {
      setRerunningId(null);
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    queued: { bg: "bg-gray-100", text: "text-gray-600", icon: Clock },
    processing: { bg: "bg-blue-100", text: "text-blue-700", icon: Loader2 },
    done: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
    error: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Job History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View past import and export jobs
          </p>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3 w-8"></th>
              <th className="px-5 py-3">Job ID</th>
              <th className="px-5 py-3">Entity Type</th>
              <th className="px-5 py-3">Operation</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Total Rows</th>
              <th className="px-5 py-3 text-right">Processed</th>
              <th className="px-5 py-3 text-right">Errors</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && jobs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading jobs...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-gray-400">
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isExpanded = expandedId === job.id;
                const sc = statusConfig[job.status] || statusConfig.queued;
                const StatusIcon = sc.icon;

                return (
                  <>
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : job.id)}
                    >
                      <td className="px-5 py-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800 capitalize">
                        {job.entity_type.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3 text-gray-600 capitalize">{job.operation}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}
                        >
                          <StatusIcon
                            className={`w-3 h-3 ${
                              job.status === "processing" ? "animate-spin" : ""
                            }`}
                          />
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">{job.total_rows}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{job.processed_rows}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={job.errors > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                          {job.errors}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        {job.status === "error" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRerun(job);
                            }}
                            disabled={rerunningId === job.id}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Re-run job"
                          >
                            {rerunningId === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Error Details */}
                    {isExpanded && (
                      <tr key={`${job.id}-details`}>
                        <td colSpan={10} className="bg-gray-50 px-8 py-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Full Job ID:</span>
                                <span className="ml-2 font-mono text-gray-700">{job.id}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Progress:</span>
                                <span className="ml-2 text-gray-700">
                                  {job.total_rows > 0
                                    ? `${((job.processed_rows / job.total_rows) * 100).toFixed(1)}%`
                                    : "N/A"}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {job.total_rows > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    job.status === "error" ? "bg-red-500" : "bg-indigo-600"
                                  }`}
                                  style={{
                                    width: `${(job.processed_rows / job.total_rows) * 100}%`,
                                  }}
                                />
                              </div>
                            )}

                            {/* Error details */}
                            {job.error_details && (
                              <div>
                                <p className="text-xs font-semibold text-red-600 mb-1">
                                  Error Details:
                                </p>
                                <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 overflow-x-auto max-h-48">
                                  {typeof job.error_details === "string"
                                    ? job.error_details
                                    : JSON.stringify(job.error_details, null, 2)}
                                </pre>
                              </div>
                            )}

                            {job.status === "error" && (
                              <button
                                onClick={() => handleRerun(job)}
                                disabled={rerunningId === job.id}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                              >
                                {rerunningId === job.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                Re-run Failed Job
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
