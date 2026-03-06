import { cn } from "@/lib/utils";

const statusMap = {
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Printing: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Paid: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Partially Paid": "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  Refunded: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Idle: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  Maintenance: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
};

export function Badge({ className, status, children }) {
  const statusClass = statusMap[status] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        statusClass,
        className
      )}
    >
      {children || status}
    </span>
  );
}
