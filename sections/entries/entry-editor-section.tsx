"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCollection,
  useCreateEntry,
  useEntry,
  useEntryPublish,
  useUpdateEntry,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { FieldInput } from "@/components/entries/field-input";
import { SeoPanel } from "@/components/seo/seo-panel";
import type { Entry, Field } from "@/lib/api/types";

export function EntryEditorSection({
  websiteId,
  collectionId,
  entryId,
}: {
  websiteId: string;
  collectionId: string;
  /** "new" renders an empty form instead of loading an entry. */
  entryId: string;
}) {
  const isNew = entryId === "new";

  const { data: collection, isLoading: loadingCollection } = useCollection(
    websiteId,
    collectionId,
  );
  const { data: entry, isLoading: loadingEntry } = useEntry(
    websiteId,
    collectionId,
    isNew ? "" : entryId,
  );

  const fields: Field[] = [...(collection?.fields ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  if (loadingCollection || (!isNew && loadingEntry)) return <LoadingBlock />;
  if (!collection) return null;

  return (
    <EntryForm
      // Nothing renders until the entry is in hand, so the form can seed its
      // state directly from it — no effect copying server data into state.
      key={entry?.id ?? "new"}
      websiteId={websiteId}
      collectionId={collectionId}
      collectionName={collection.name}
      fields={fields}
      entry={entry ?? null}
      isNew={isNew}
    />
  );
}

function EntryForm({
  websiteId,
  collectionId,
  collectionName,
  fields,
  entry,
  isNew,
}: {
  websiteId: string;
  collectionId: string;
  collectionName: string;
  fields: Field[];
  entry: Entry | null;
  isNew: boolean;
}) {
  const router = useRouter();
  const { can } = useCan(websiteId);
  const create = useCreateEntry(websiteId, collectionId);
  const update = useUpdateEntry(websiteId, collectionId);
  const publish = useEntryPublish(websiteId, collectionId);

  const [data, setData] = useState<Record<string, unknown>>(
    () => entry?.data ?? {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const entryId = entry?.id ?? "";
  const canSave = isNew ? can("entries.create") : can("entries.update");
  const canPublish = can("entries.publish");

  /**
   * A cheap required-check only. Everything else — types, ranges, choices — is
   * left to the backend's strategies: duplicating those rules here would mean
   * two validators drifting apart, and the server's is the one that counts.
   */
  const validate = () => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = data[field.key];
      if (
        field.required &&
        (value === undefined || value === null || value === "")
      ) {
        next[field.key] = "Wajib diisi";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    if (isNew) {
      const created = await create.mutateAsync({ data });
      router.replace(
        `/websites/${websiteId}/collections/${collectionId}/entries/${created.id}`,
      );
    } else {
      await update.mutateAsync({ entryId, data });
    }
  };

  const listHref = `/websites/${websiteId}/collections/${collectionId}/entries`;
  const mutationError = create.error ?? update.error ?? publish.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={listHref} className="text-xs text-muted hover:underline">
            ← {collectionName}
          </Link>
          <h2 className="mt-1 font-medium">
            {isNew ? "Entry baru" : "Edit entry"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {entry && (
            <Badge tone={entry.status === "PUBLISHED" ? "success" : "info"}>
              {entry.status}
            </Badge>
          )}
          {!isNew && entry && canPublish && (
            <Button
              variant="secondary"
              loading={publish.isPending}
              onClick={() =>
                publish.mutate({
                  entryId,
                  publish: entry.status !== "PUBLISHED",
                })
              }
            >
              {entry.status === "PUBLISHED" ? "Unpublish" : "Publish"}
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Konten</CardTitle>
            <span className="text-xs text-muted">
              Form ini dirender dari {fields.length} field collection
            </span>
          </CardHeader>
          <CardBody className="space-y-5">
            {fields.length === 0 && (
              <p className="text-sm text-muted">
                Collection ini belum punya field. Tambahkan dulu di builder.
              </p>
            )}

            {fields.map((field) => (
              <FieldInput
                key={field.id}
                websiteId={websiteId}
                field={field}
                value={data[field.key]}
                error={errors[field.key]}
                onChange={(value) =>
                  setData((prev) => ({ ...prev, [field.key]: value }))
                }
              />
            ))}
          </CardBody>
        </Card>

        <div>
          {/* SEO is one polymorphic table, so an entry uses the same panel a
              page does — only the targetType differs. */}
          {entry ? (
            <SeoPanel
              websiteId={websiteId}
              targetType="ENTRY"
              targetId={entry.id}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-muted">
                  Simpan entry ini dulu — data SEO menempel pada id-nya, yang
                  baru ada setelah penyimpanan pertama.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
