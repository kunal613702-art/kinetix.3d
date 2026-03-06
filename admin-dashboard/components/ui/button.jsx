import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white hover:opacity-90",
        ghost: "hover:bg-[var(--primary-soft)]",
        outline: "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--primary-soft)]"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
