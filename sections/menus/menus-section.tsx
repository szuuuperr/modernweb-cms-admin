"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useCreateMenu, useDeleteMenu, useMenus } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug harus kebab-case")
    .max(100),
});

type FormValues = z.infer<typeof schema>;

export function MenusSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useMenus(websiteId);
  const { can } = useCan(websiteId);
  const remove = useDeleteMenu(websiteId);
  const [open, setOpen] = useState(false);
  const manage = can("menus.manage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Menu dibaca frontend lewat Content API publik untuk merender navigasi.
        </p>
        {manage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Menu baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.length === 0 && (
        <EmptyState
          title="Belum ada menu"
          description="Misalnya 'Main Navigation' atau 'Footer'."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((menu) => (
          <Card key={menu.id} className="transition-shadow hover:shadow-pop">
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/websites/${websiteId}/menus/${menu.id}`}
                  className="font-medium hover:text-primary-700 hover:underline"
                >
                  {menu.name}
                </Link>
                {manage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus menu"
                    onClick={() => {
                      // MenuItem cascades on delete in the schema, so the whole
                      // tree goes with it.
                      if (
                        confirm(
                          `Hapus menu "${menu.name}" beserta semua itemnya?`,
                        )
                      ) {
                        remove.mutate(menu.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </div>
              <p className="font-mono text-xs text-muted">{menu.slug}</p>
              <Badge tone="primary">{menu._count?.items ?? 0} item</Badge>
            </CardBody>
          </Card>
        ))}
      </div>

      {open && (
        <CreateMenuModal websiteId={websiteId} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function CreateMenuModal({
  websiteId,
  onClose,
}: {
  websiteId: string;
  onClose: () => void;
}) {
  const create = useCreateMenu(websiteId);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync(values);
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Menu baru"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSubmit} loading={create.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {create.error && <ErrorBlock error={create.error} />}

        <div className="space-y-1.5">
          <Label htmlFor="menu-name">Nama</Label>
          <Input
            id="menu-name"
            placeholder="Main Navigation"
            aria-invalid={!!errors.name}
            {...register("name", {
              onChange: (e) =>
                setValue(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                  { shouldValidate: true },
                ),
            })}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="menu-slug">Slug</Label>
          <Input
            id="menu-slug"
            className="font-mono"
            placeholder="main-nav"
            aria-invalid={!!errors.slug}
            {...register("slug")}
          />
          <FieldError message={errors.slug?.message} />
          <p className="text-xs text-muted">
            Dipakai frontend untuk memanggil menu ini.
          </p>
        </div>
      </form>
    </Modal>
  );
}
