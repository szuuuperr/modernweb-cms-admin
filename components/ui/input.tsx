"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1 text-sm text-foreground transition-colors placeholder:text-faint focus-visible:outline-none focus-visible:border-primary-700 focus-visible:ring-2 focus-visible:ring-primary-700/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(base, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(base, "h-auto min-h-24 py-2", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(base, "pr-8", className)} {...props} />;
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[13px] font-medium text-slate-700", className)}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-danger">{message}</p>;
}

/** Checkbox styled to the primary token — `accent-color` keeps it native. */
export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-border accent-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40",
        className,
      )}
      {...props}
    />
  );
}
