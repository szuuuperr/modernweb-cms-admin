"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useDeleteUser, useUpdateUser, useUsers } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { PlatformRole } from "@/lib/api/types";

const ROLES: PlatformRole[] = [
  "NONE",
  "SUPPORT",
  "PLATFORM_ADMIN",
  "SUPER_ADMIN",
];

export function UsersSection() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useUsers(page);
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const { user } = useAuth();

  // Both mutations are RequirePlatformRole(SUPER_ADMIN); listing only needs
  // SUPPORT, so a SUPPORT user gets a read-only table rather than dead buttons.
  const canEdit = user?.platformRole === "SUPER_ADMIN";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengguna"
        description="Platform role berlaku lintas website. Akses per-website diatur lewat role di masing-masing website."
      />

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {update.error && <ErrorBlock error={update.error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data && (
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Platform role</th>
                  <th className="px-4 py-2 font-medium">Dibuat</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const isSelf = item.id === user?.id;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-2 font-medium">
                        {item.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-faint">
                            (Anda)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{item.email}</td>
                      <td className="px-4 py-2">
                        {canEdit ? (
                          <Select
                            className="h-8 w-44"
                            value={item.platformRole}
                            // Demoting yourself would revoke this very screen
                            // mid-session; make it impossible rather than
                            // confusing.
                            disabled={isSelf}
                            onChange={(e) =>
                              update.mutate({
                                id: item.id,
                                platformRole: e.target.value as PlatformRole,
                              })
                            }
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          item.platformRole
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {canEdit && !isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Hapus pengguna"
                            onClick={() => {
                              if (
                                confirm(
                                  `Hapus pengguna ${item.email}? Keanggotaan website-nya ikut hilang.`,
                                )
                              ) {
                                remove.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-end gap-2">
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
      )}
    </div>
  );
}
