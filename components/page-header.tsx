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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[1.6rem] font-bold text-ink tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-semibold text-ink text-base">{title}</div>
      {hint && <div className="text-sm text-ink-muted mt-1.5 max-w-md leading-relaxed">{hint}</div>}
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
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta && (
        <div className={isUp ? "kpi-delta-up" : isDown ? "kpi-delta-down" : "text-xs text-ink-muted font-semibold mt-1"}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {delta}
        </div>
      )}
      {sub && <div className="text-xs text-ink-muted mt-1">{sub}</div>}
      {hint && <div className="text-xs text-ink-subtle mt-1">{hint}</div>}
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
      <h2 className="font-bold text-ink text-base">{title}</h2>
      {action}
    </div>
  );
}
