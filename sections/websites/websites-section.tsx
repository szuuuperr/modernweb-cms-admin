"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useCreateWebsite, useWebsites } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
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
import { formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug harus kebab-case (huruf kecil, angka, tanda hubung)",
    )
    .max(100),
  domain: z.string().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

export function WebsitesSection() {
  const { user } = useAuth();
  const { data, isLoading, error } = useWebsites();
  const [open, setOpen] = useState(false);

  // POST /websites is RequirePlatformRole(PLATFORM_ADMIN); SUPPORT and plain
  // members would only earn a 403 from the button.
  const canCreate =
    user?.platformRole === "PLATFORM_ADMIN" ||
    user?.platformRole === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Websites</h1>
          <p className="text-sm text-slate-500">
            Setiap website punya collection, konten, dan anggotanya sendiri.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Website baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}

      {data && data.items.length === 0 && (
        <EmptyState
          title="Belum ada website"
          description={
            canCreate
              ? "Buat website pertama untuk mulai mengelola konten."
              : "Anda belum menjadi anggota website mana pun."
          }
        />
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((website) => (
            <Link key={website.id} href={`/websites/${website.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-medium">{website.name}</h2>
                    <Badge tone={website.status === "ACTIVE" ? "green" : "slate"}>
                      {website.status}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-slate-500">
                    {website.slug}
                  </p>
                  {website.domain && (
                    <p className="text-sm text-slate-600">{website.domain}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Dibuat {formatDate(website.createdAt)}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateWebsiteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function CreateWebsiteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateWebsite();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      ...values,
      domain: values.domain || undefined,
    });
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Website baru"
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
          <Label htmlFor="name">Nama</Label>
          <Input
            id="name"
            placeholder="Halwa Travel"
            aria-invalid={!!errors.name}
            {...register("name", {
              // Slug is derivable from the name, but stays editable: it is part
              // of the public Content API URL and outlives display-name edits.
              onChange: (e) =>
                setValue("slug", slugify(e.target.value), {
                  shouldValidate: true,
                }),
            })}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="halwa-travel"
            className="font-mono"
            aria-invalid={!!errors.slug}
            {...register("slug")}
          />
          <FieldError message={errors.slug?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="domain">Domain (opsional)</Label>
          <Input
            id="domain"
            placeholder="halwatravel.com"
            aria-invalid={!!errors.domain}
            {...register("domain")}
          />
          <FieldError message={errors.domain?.message} />
        </div>
      </form>
    </Modal>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
