import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-snug">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-4 border-b border-gray-200" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-semibold text-gray-800 text-sm">{title}</div>
      {hint && <div className="text-sm text-gray-400 mt-1.5 max-w-md leading-relaxed">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kpi({
  label,
  value,
  delta,
  hint,
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  sub?: string;
}) {
  const isUp = delta?.startsWith("+");
  const isDown = delta?.startsWith("-");

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow duration-200"
      style={{ borderLeft: "3px solid #5c6bc0" }}
    >
      <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">{value}</div>
      {delta && (
        <div
          className={
            isUp
              ? "text-xs text-emerald-600 font-semibold flex items-center gap-0.5 mt-1.5"
              : isDown
              ? "text-xs text-red-500 font-semibold flex items-center gap-0.5 mt-1.5"
              : "text-xs text-gray-400 font-semibold flex items-center gap-0.5 mt-1.5"
          }
        >
          {isUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : isDown ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {delta}
        </div>
      )}
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      {hint && <div className="text-xs text-gray-300 mt-1">{hint}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      {action}
    </div>
  );
}
