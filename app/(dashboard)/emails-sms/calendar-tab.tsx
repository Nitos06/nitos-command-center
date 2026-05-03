"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Sparkles, Clock, CheckCircle2, Send, XCircle } from "lucide-react";

interface CalendarEntry {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  status: string;
  brief?: any;
  generated_by?: string;
  campaign_id?: string;
  segment_id?: string;
}

export function CalendarTab({ brandId }: { brandId: string }) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [currentMonth, brandId]);

  async function fetchEntries() {
    setLoading(true);
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    const res = await fetch(`/api/email/calendar?brandId=${brandId}&month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries ?? []);
    }
    setLoading(false);
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  function getEntriesForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries.filter((e) => e.scheduled_date === dateStr);
  }

  const statusIcon: Record<string, any> = {
    planned: Clock,
    brief_ready: Sparkles,
    content_ready: CheckCircle2,
    scheduled: Calendar,
    sent: Send,
    cancelled: XCircle,
  };

  const statusColor: Record<string, string> = {
    planned: "bg-gray-100 text-gray-600",
    brief_ready: "bg-purple-100 text-purple-700",
    content_ready: "bg-blue-100 text-blue-700",
    scheduled: "bg-amber-100 text-amber-700",
    sent: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  };

  const monthName = currentMonth.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--surface-tint)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{monthName}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--surface-tint)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {entries.length} campaign{entries.length !== 1 ? "s" : ""} this month
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-lg hover:opacity-90">
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-[var(--text-secondary)] text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {blanks.map((i) => (
            <div key={`blank-${i}`} className="min-h-[80px] border-b border-r border-[var(--border)] bg-gray-50/50" />
          ))}
          {days.map((day) => {
            const dayEntries = getEntriesForDay(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`min-h-[80px] border-b border-r border-[var(--border)] p-1 ${isToday ? "bg-indigo-50/50" : ""}`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? "text-indigo-600" : "text-[var(--text-secondary)]"}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEntries.map((entry) => {
                    const Icon = statusIcon[entry.status] ?? Clock;
                    const color = statusColor[entry.status] ?? "bg-gray-100 text-gray-600";
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${color} cursor-pointer hover:opacity-80`}
                        title={`${entry.title}\n${entry.status}${entry.description ? "\n" + entry.description : ""}`}
                      >
                        <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{entry.title}</span>
                        {entry.generated_by === "ai" && (
                          <Sparkles className="w-2.5 h-2.5 flex-shrink-0 text-purple-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        {Object.entries(statusColor).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${color}`} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
