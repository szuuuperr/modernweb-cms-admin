"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { useDeletePage, usePagePublish, usePages } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { PageStatus } from "@/lib/api/types";

export function PagesSection({ websiteId }: { websiteId: string }) {
  const [status, setStatus] = useState<PageStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = usePages(websiteId, {
    status,
    search,
    page,
    limit: 20,
  });
  const { can } = useCan(websiteId);
  const publish = usePagePublish(websiteId);
  const remove = useDeletePage(websiteId);

  const base = `/websites/${websiteId}/pages`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              className="w-56 pl-9"
              placeholder="Cari judul atau slug…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            className="w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PageStatus | "");
              setPage(1);
            }}
          >
            <option value="">Semua status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </Select>
        </div>

        {can("pages.create") && (
          <Link href={`${base}/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Page baru
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
          title={search ? "Tidak ada page yang cocok" : "Belum ada page"}
          description={
            search
              ? undefined
              : "Page berisi susunan block yang dirender frontend Anda."
          }
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Judul</th>
                    <th className="px-4 py-2.5 font-medium">Slug</th>
                    <th className="px-4 py-2.5 font-medium">Block</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Diperbarui</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`${base}/${item.id}`}
                          className="block max-w-xs truncate font-medium hover:text-primary-700 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">
                        /{item.slug}
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {item.blocks?.length ?? 0}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          tone={item.status === "PUBLISHED" ? "success" : "info"}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          {can("pages.publish") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                publish.mutate({
                                  pageId: item.id,
                                  publish: item.status !== "PUBLISHED",
                                })
                              }
                            >
                              {item.status === "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"}
                            </Button>
                          )}
                          {can("pages.delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Hapus page"
                              onClick={() => {
                                // Deleting a page also drops its SEO row on the
                                // backend, and neither comes back.
                                if (
                                  confirm(
                                    `Hapus page "${item.title}" beserta data SEO-nya?`,
                                  )
                                ) {
                                  remove.mutate(item.id);
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
            Halaman {data.meta.page} dari {data.meta.totalPages} ·{" "}
            {data.meta.total} page
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
