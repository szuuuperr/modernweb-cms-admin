"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin text-faint", className)}
      aria-label="Memuat"
    />
  );
}

export function LoadingBlock({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
      <Spinner />
      {label}
    </div>
  );
}

/**
 * Errors are shown verbatim from the API: the backend already explains itself
 * ("Missing permissions: entries.publish"), and rewriting that into a generic
 * "something went wrong" would throw away the only useful part.
 */
export function ErrorBlock({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Terjadi kesalahan tidak terduga";
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-danger-soft px-4 py-3 text-sm text-rose-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Tones map to the fixed meanings in design.md — not decoration. */
const TONES = {
  slate: "bg-slate-100 text-slate-700",
  success: "bg-success-soft text-emerald-700",
  warning: "bg-warning-soft text-amber-700",
  danger: "bg-danger-soft text-rose-700",
  info: "bg-info-soft text-sky-700",
  violet: "bg-violet-soft text-violet-700",
  primary: "bg-primary-50 text-primary-700",
} as const;

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
