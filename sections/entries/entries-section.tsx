"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  useCollection,
  useDeleteEntry,
  useEntries,
  useEntryPublish,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { EntryStatus } from "@/lib/api/types";

export function EntriesSection({
  websiteId,
  collectionId,
}: {
  websiteId: string;
  collectionId: string;
}) {
  const [status, setStatus] = useState<EntryStatus | "">("");
  const [page, setPage] = useState(1);

  const { data: collection } = useCollection(websiteId, collectionId);
  const { data, isLoading, error } = useEntries(websiteId, collectionId, {
    status,
    page,
    limit: 20,
    sort: "updatedAt:desc",
  });
  const { can } = useCan(websiteId);
  const publish = useEntryPublish(websiteId, collectionId);
  const remove = useDeleteEntry(websiteId, collectionId);

  const base = `/websites/${websiteId}/collections/${collectionId}/entries`;
  // Entries are free-form JSON, so preview the first few fields of the schema
  // rather than guessing at column names.
  const preview = [...(collection?.fields ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/websites/${websiteId}/collections/${collectionId}`}
            className="text-xs text-muted hover:underline"
          >
            ← Builder
          </Link>
          <Select
            className="h-8 w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EntryStatus | "");
              setPage(1);
            }}
          >
            <option value="">Semua status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </Select>
        </div>

        {can("entries.create") && (
          <Link href={`${base}/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Entry baru
            </Button>
          </Link>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {publish.error && <ErrorBlock error={publish.error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.items.length === 0 && (
        <EmptyState
          title="Belum ada entry"
          description="Entry yang dibuat di sini muncul di Content API publik setelah dipublish."
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
                  <tr>
                    {preview.map((field) => (
                      <th key={field.id} className="px-4 py-2 font-medium">
                        {field.name}
                      </th>
                    ))}
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Diperbarui</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      {preview.map((field) => (
                        <td key={field.id} className="px-4 py-2">
                          <Link
                            href={`${base}/${entry.id}`}
                            className="block max-w-xs truncate hover:underline"
                          >
                            {renderCell(entry.data[field.key])}
                          </Link>
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <Badge
                          tone={entry.status === "PUBLISHED" ? "success" : "info"}
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted">
                        {formatDate(entry.updatedAt)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          {can("entries.publish") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                publish.mutate({
                                  entryId: entry.id,
                                  publish: entry.status !== "PUBLISHED",
                                })
                              }
                            >
                              {entry.status === "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"}
                            </Button>
                          )}
                          {can("entries.delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Hapus entry"
                              onClick={() => {
                                if (confirm("Hapus entry ini?")) {
                                  remove.mutate(entry.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Halaman {data.meta.page} dari {data.meta.totalPages} · {data.meta.total}{" "}
            entry
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

function renderCell(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (Array.isArray(value)) return `${value.length} item`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
