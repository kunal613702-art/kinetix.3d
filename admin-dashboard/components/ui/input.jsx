import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60",
        className
      )}
      {...props}
    />
  );
}
