"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  useCreatePage,
  usePage,
  usePagePublish,
  useUpdatePage,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Badge, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import {
  BlockEditor,
  fromDrafts,
  toDrafts,
  type BlockDraft,
} from "@/components/pages/block-editor";
import { SeoPanel } from "@/components/seo/seo-panel";
import type { Page } from "@/lib/api/types";

export function PageEditorSection({
  websiteId,
  pageId,
}: {
  websiteId: string;
  /** "new" renders an empty form instead of loading a page. */
  pageId: string;
}) {
  const isNew = pageId === "new";
  const { data, isLoading, error } = usePage(websiteId, isNew ? "" : pageId);

  if (!isNew && isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;

  return (
    <PageForm
      // Nothing renders until the page is in hand, so the form seeds its state
      // straight from it — no effect copying server data into state.
      key={data?.id ?? "new"}
      websiteId={websiteId}
      page={data ?? null}
      isNew={isNew}
    />
  );
}

function PageForm({
  websiteId,
  page,
  isNew,
}: {
  websiteId: string;
  page: Page | null;
  isNew: boolean;
}) {
  const router = useRouter();
  const { can } = useCan(websiteId);
  const create = useCreatePage(websiteId);
  const update = useUpdatePage(websiteId);
  const publish = usePagePublish(websiteId);

  const [title, setTitle] = useState(() => page?.title ?? "");
  const [slug, setSlug] = useState(() => page?.slug ?? "");
  const [blocks, setBlocks] = useState<BlockDraft[]>(() => toDrafts(page?.blocks));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canSave = isNew ? can("pages.create") : can("pages.update");
  const editable = canSave;
  const listHref = `/websites/${websiteId}/pages`;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Judul wajib diisi";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      next.slug = "Slug harus kebab-case (huruf kecil, angka, tanda hubung)";
    }
    // The API requires every block to carry a non-empty type (@MinLength(1)).
    if (blocks.some((b) => !b.type.trim())) {
      next.blocks = "Setiap block harus punya tipe";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const body = { title, slug, blocks: fromDrafts(blocks) };
    if (isNew) {
      const created = await create.mutateAsync(body);
      router.replace(`/websites/${websiteId}/pages/${created.id}`);
    } else {
      await update.mutateAsync({ pageId: page!.id, ...body });
    }
  };

  const mutationError = create.error ?? update.error ?? publish.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={listHref}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-700"
          >
            <ChevronLeft className="h-3 w-3" />
            Semua page
          </Link>
          <h2 className="mt-1 font-medium">
            {isNew ? "Page baru" : "Edit page"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {page && (
            <Badge tone={page.status === "PUBLISHED" ? "success" : "info"}>
              {page.status}
            </Badge>
          )}
          {page && can("pages.publish") && (
            <Button
              variant="secondary"
              loading={publish.isPending}
              onClick={() =>
                publish.mutate({
                  pageId: page.id,
                  publish: page.status !== "PUBLISHED",
                })
              }
            >
              {page.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </Button>
          )}
          {canSave && (
            <Button loading={create.isPending || update.isPending} onClick={save}>
              Simpan
            </Button>
          )}
        </div>
      </div>

      {mutationError != null && <ErrorBlock error={mutationError} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Halaman</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-title">Judul</Label>
                <Input
                  id="p-title"
                  value={title}
                  disabled={!editable}
                  aria-invalid={!!errors.title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    // Slug is part of the public URL, so only derive it while
                    // the page is still new — never silently on an edit.
                    if (isNew) setSlug(slugify(e.target.value));
                  }}
                />
                <FieldError message={errors.title} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-slug">Slug</Label>
                <Input
                  id="p-slug"
                  className="font-mono"
                  value={slug}
                  disabled={!editable}
                  aria-invalid={!!errors.slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <FieldError message={errors.slug} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Block</CardTitle>
              <span className="text-xs text-muted">
                Tipe block ditentukan frontend, bukan CMS
              </span>
            </CardHeader>
            <CardBody className="space-y-3">
              <FieldError message={errors.blocks} />
              <BlockEditor
                blocks={blocks}
                onChange={setBlocks}
                disabled={!editable}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          {page ? (
            <SeoPanel
              websiteId={websiteId}
              targetType="PAGE"
              targetId={page.id}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-muted">
                  Simpan page ini dulu — data SEO menempel pada id-nya, yang baru
                  ada setelah penyimpanan pertama.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
