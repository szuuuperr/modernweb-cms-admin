"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Trash2 } from "lucide-react";
import { useDeleteSubmission, useForm, useSubmissions } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { Form, FormSubmission } from "@/lib/api/types";

export function FormSubmissionsSection({
  websiteId,
  formId,
}: {
  websiteId: string;
  formId: string;
}) {
  const [page, setPage] = useState(1);
  const { data: form } = useForm(websiteId, formId);
  const { data, isLoading, error } = useSubmissions(websiteId, formId, page);
  const { can } = useCan(websiteId);
  const remove = useDeleteSubmission(websiteId, formId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/websites/${websiteId}/forms`}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-700"
          >
            <ChevronLeft className="h-3 w-3" />
            Semua form
          </Link>
          <h2 className="mt-1 font-medium">
            Submission{form ? ` — ${form.name}` : ""}
          </h2>
        </div>

        {form && data && data.items.length > 0 && (
          <Button variant="secondary" onClick={() => exportCsv(form, data.items)}>
            <Download className="h-4 w-4" />
            Ekspor CSV halaman ini
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.items.length === 0 && (
        <EmptyState
          title="Belum ada submission"
          description="Kiriman dari form publik akan muncul di sini."
        />
      )}

      {form && data && data.items.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Waktu</th>
                    {form.fields.map((field) => (
                      <th key={field.key} className="px-4 py-2.5 font-medium">
                        {field.name}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 font-medium">IP</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">
                        {formatDate(submission.createdAt)}
                      </td>
                      {form.fields.map((field) => (
                        <td key={field.key} className="px-4 py-2.5">
                          <span
                            className="block max-w-xs truncate"
                            title={renderCell(submission.data[field.key])}
                          >
                            {renderCell(submission.data[field.key])}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">
                        {submission.ip ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {can("submissions.delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Hapus submission"
                            onClick={() => {
                              if (confirm("Hapus submission ini?")) {
                                remove.mutate(submission.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        )}
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
            Halaman {data.meta.page} dari {data.meta.totalPages} ·{" "}
            {data.meta.total} submission
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
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Exports what is on screen, not the whole table: the API paginates and there
 * is no bulk export endpoint, so pretending to export everything would either
 * lie or hammer the server with sequential page requests.
 */
function exportCsv(form: Form, submissions: FormSubmission[]) {
  const headers = ["waktu", ...form.fields.map((f) => f.key), "ip"];
  const rows = submissions.map((s) => [
    s.createdAt,
    ...form.fields.map((f) => renderCell(s.data[f.key])),
    s.ip ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  // BOM so Excel reads UTF-8 rather than mangling accented characters.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${form.slug}-submissions.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  const text = String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}
