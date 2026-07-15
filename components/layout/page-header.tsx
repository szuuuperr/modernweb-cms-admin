import { cn } from "@/lib/utils";

/**
 * The white bar at the top of every screen (title left, actions right).
 * Negative margins bleed it to the edges of <main>'s padding so it reads as
 * part of the chrome rather than a card floating on the canvas.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  /** Rendered flush under the title — used for the per-website tab bar. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // These negative margins must mirror <main>'s padding in AppShell,
        // or the bar stops reaching the edges.
        "-mx-5 -mt-6 mb-6 border-b border-border bg-surface px-5 lg:-mx-8 lg:px-8",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <div className="min-w-0">
          {breadcrumb}
          <h1 className="truncate text-xl font-semibold">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
