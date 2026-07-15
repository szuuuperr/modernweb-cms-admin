"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAuditLogs } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/lib/api/types";

/** Mirrors what the backend actually emits — content + security actions. */
const RESOURCES = [
  "entry",
  "page",
  "menu",
  "setting",
  "seo",
  "apikey",
  "webhook",
  "role",
  "member",
];

/** Colour carries meaning: destructive red, creative green, the rest neutral. */
function actionTone(action: string): "success" | "danger" | "warning" | "slate" {
  if (action.includes("deleted") || action.includes("revoked")) return "danger";
  if (action.includes("created") || action.includes("published")) return "success";
  if (action.includes("rotated") || action.includes("unpublished")) return "warning";
  return "slate";
}

export function AuditSection({ websiteId }: { websiteId: string }) {
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAuditLogs(websiteId, {
    resource: resource || undefined,
    action: action || undefined,
    // The API wants a full ISO timestamp, not just a date.
    from: from ? new Date(from).toISOString() : undefined,
    page,
    limit: 20,
  });

  const resetTo = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Catatan append-only tentang siapa mengubah apa. Tidak bisa diedit atau
        dihapus dari panel — memang begitu desainnya.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="al-resource">Resource</Label>
          <Select
            id="al-resource"
            className="w-40"
            value={resource}
            onChange={(e) => resetTo(() => setResource(e.target.value))}
          >
            <option value="">Semua</option>
            {RESOURCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="al-action">Action</Label>
          <Input
            id="al-action"
            className="w-40 font-mono text-xs"
            placeholder="published"
            value={action}
            onChange={(e) => resetTo(() => setAction(e.target.value))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="al-from">Sejak</Label>
          <Input
            id="al-from"
            type="date"
            className="w-40"
            value={from}
            onChange={(e) => resetTo(() => setFrom(e.target.value))}
          />
        </div>

        {(resource || action || from) && (
          <Button
            variant="secondary"
            onClick={() =>
              resetTo(() => {
                setResource("");
                setAction("");
                setFrom("");
              })
            }
          >
            Hapus filter
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}

      {data?.items.length === 0 && (
        <EmptyState
          title="Tidak ada catatan"
          description={
            resource || action || from
              ? "Coba longgarkan filternya."
              : "Aksi pada konten dan keamanan akan tercatat di sini."
          }
        />
      )}

      <div className="space-y-2">
        {data?.items.map((log) => <AuditRow key={log.id} log={log} />)}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Halaman {data.meta.page} dari {data.meta.totalPages} ·{" "}
            {data.meta.total} catatan
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!log.meta || !!log.targetId || !!log.ip;

  return (
    <Card>
      <CardBody className="p-0">
        <button
          type="button"
          onClick={() => hasDetail && setOpen((v) => !v)}
          aria-expanded={hasDetail ? open : undefined}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-default"
          disabled={!hasDetail}
        >
          {hasDetail ? (
            open ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-faint" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <Badge tone={actionTone(log.action)}>{log.action}</Badge>
          <span className="font-mono text-xs text-slate-700">{log.resource}</span>

          <span className="min-w-0 flex-1 truncate text-sm text-muted">
            {/* actorEmail is denormalised, so the log stays readable even after
                the user row is deleted. */}
            {log.actorEmail ?? (
              <span className="italic">sistem (seed/cron)</span>
            )}
          </span>

          <span className="shrink-0 text-xs text-muted">
            {formatDate(log.createdAt)}
          </span>
        </button>

        {open && (
          <div className="space-y-2 border-t border-border px-4 py-3 text-xs">
            <div className="flex flex-wrap gap-4 text-muted">
              {log.targetId && (
                <span>
                  Target: <span className="font-mono">{log.targetId}</span>
                </span>
              )}
              {log.ip && (
                <span>
                  IP: <span className="font-mono">{log.ip}</span>
                </span>
              )}
            </div>
            {log.meta && (
              <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-slate-700">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
