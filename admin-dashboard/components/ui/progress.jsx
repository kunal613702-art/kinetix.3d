import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700", className)}>
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
