"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { useIsPlatformAdmin } from "@/lib/auth/use-view";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug harus kebab-case")
    .max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CollectionsSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useCollections(websiteId);
  const { can } = useCan(websiteId);
  const isPlatformAdmin = useIsPlatformAdmin();
  const [open, setOpen] = useState(false);

  // Defining the shape of content is a platform-admin job; clients fill it in.
  // `collections.manage` alone is not enough — an Owner has it, but the builder
  // is deliberately not part of the client's world.
  const manage = isPlatformAdmin && can("collections.manage");

  return (
    <div className="space-y-4">
      {!isPlatformAdmin && (
        <PageHeader
          title="Collection"
          description="Pilih collection untuk mengisi atau menyunting kontennya."
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {isPlatformAdmin
            ? "Collection mendefinisikan bentuk konten. Field-nya menentukan form editor entry."
            : "Bentuk setiap collection ditentukan ModernWeb — di sini Anda mengisi kontennya."}
        </p>
        {manage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Collection baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}

      {data?.length === 0 && (
        <EmptyState
          title="Belum ada collection"
          description="Buat collection seperti 'Tour Packages' atau 'Artikel'."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((collection) => (
          <CollectionCard
            key={collection.id}
            websiteId={websiteId}
            collection={collection}
            canManage={manage}
            // Clients go straight to the content; only staff see the builder.
            isPlatformAdmin={isPlatformAdmin}
          />
        ))}
      </div>

      <CreateCollectionModal
        websiteId={websiteId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function CollectionCard({
  websiteId,
  collection,
  canManage,
  isPlatformAdmin,
}: {
  websiteId: string;
  collection: { id: string; name: string; slug: string; description?: string | null };
  canManage: boolean;
  isPlatformAdmin: boolean;
}) {
  const remove = useDeleteCollection(websiteId);
  const base = `/websites/${websiteId}/collections/${collection.id}`;
  // Staff land on the field builder; clients land on the content itself.
  const href = isPlatformAdmin ? base : `${base}/entries`;

  return (
    <Card className="transition-shadow hover:shadow-pop">
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="font-medium hover:text-primary-700 hover:underline">
            {collection.name}
          </Link>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              loading={remove.isPending}
              onClick={() => {
                // Deleting a collection takes its entries with it, so make the
                // consequence explicit rather than trusting an undo that the
                // API does not offer.
                if (
                  confirm(
                    `Hapus collection "${collection.name}" beserta semua entry-nya? Tindakan ini tidak bisa dibatalkan.`,
                  )
                ) {
                  remove.mutate(collection.id);
                }
              }}
              aria-label="Hapus collection"
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          )}
        </div>
        <p className="font-mono text-xs text-muted">{collection.slug}</p>
        {collection.description && (
          <p className="text-sm text-slate-600">{collection.description}</p>
        )}
        {remove.error && <ErrorBlock error={remove.error} />}
      </CardBody>
    </Card>
  );
}

function CreateCollectionModal({
  websiteId,
  open,
  onClose,
}: {
  websiteId: string;
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateCollection(websiteId);
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
      description: values.description || undefined,
    });
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Collection baru"
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
          <Label htmlFor="c-name">Nama</Label>
          <Input
            id="c-name"
            placeholder="Tour Packages"
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
          <Label htmlFor="c-slug">Slug</Label>
          <Input
            id="c-slug"
            className="font-mono"
            aria-invalid={!!errors.slug}
            {...register("slug")}
          />
          <FieldError message={errors.slug?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-desc">Deskripsi (opsional)</Label>
          <Textarea id="c-desc" {...register("description")} />
          <FieldError message={errors.description?.message} />
        </div>
      </form>
    </Modal>
  );
}
