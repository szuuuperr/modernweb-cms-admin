"use client";

import { useState } from "react";
import { useSeo, useSeoDefaults, useUpsertSeo } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Input, Label, Textarea } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import type { Seo, SeoInput, SeoTarget } from "@/lib/api/types";

/**
 * SEO is one polymorphic table keyed by (targetType, targetId), so the same
 * panel serves pages and entries. Only rendered once the target exists — there
 * is no id to attach SEO to before the first save.
 */
export function SeoPanel({
  websiteId,
  targetType,
  targetId,
}: {
  websiteId: string;
  targetType: SeoTarget;
  targetId: string;
}) {
  const { can } = useCan(websiteId);
  const { data, isLoading, error } = useSeo(websiteId, targetType, targetId);
  const { data: defaults } = useSeoDefaults(websiteId);

  if (!can("seo.read")) return null;
  if (isLoading) return <LoadingBlock label="Memuat SEO…" />;
  if (error) return <ErrorBlock error={error} />;

  return (
    <SeoForm
      // Keyed by target, not by the row id: the first save turns `data` from
      // null into a row, and keying on its id would remount the form at that
      // exact moment — throwing away the "Tersimpan" confirmation the user
      // just earned. Data is already settled here, so seeding once is enough.
      key={targetId}
      websiteId={websiteId}
      targetType={targetType}
      targetId={targetId}
      initial={data ?? null}
      titleTemplate={defaults?.titleTemplate ?? null}
      editable={can("seo.manage")}
    />
  );
}

function SeoForm({
  websiteId,
  targetType,
  targetId,
  initial,
  titleTemplate,
  editable,
}: {
  websiteId: string;
  targetType: SeoTarget;
  targetId: string;
  /** The stored row uses null for "unset"; the form works in empty strings. */
  initial: Seo | null;
  titleTemplate: string | null;
  editable: boolean;
}) {
  const upsert = useUpsertSeo(websiteId, targetType, targetId);
  const [form, setForm] = useState<SeoInput>(() => ({
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    ogImageUrl: initial?.ogImageUrl ?? "",
    canonicalUrl: initial?.canonicalUrl ?? "",
    noIndex: initial?.noIndex ?? false,
  }));

  const set = <K extends keyof SeoInput>(key: K, value: SeoInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    // Empty strings are dropped rather than sent: the API validates ogImageUrl
    // and canonicalUrl with @IsUrl, and "" is not a URL.
    upsert.mutate({
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      ogImageUrl: form.ogImageUrl || undefined,
      canonicalUrl: form.canonicalUrl || undefined,
      noIndex: form.noIndex,
    });

  const preview =
    titleTemplate && form.metaTitle
      ? titleTemplate.replace("%s", form.metaTitle)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO</CardTitle>
        {upsert.isSuccess && !upsert.isPending && (
          <span className="text-xs text-emerald-700">Tersimpan</span>
        )}
      </CardHeader>
      <CardBody className="space-y-4">
        {upsert.error && <ErrorBlock error={upsert.error} />}

        <div className="space-y-1.5">
          <Label htmlFor="seo-title">Meta title</Label>
          <Input
            id="seo-title"
            maxLength={200}
            disabled={!editable}
            value={form.metaTitle ?? ""}
            onChange={(e) => set("metaTitle", e.target.value)}
          />
          {preview && (
            <p className="text-xs text-muted">
              Hasil dengan template website:{" "}
              <span className="font-medium text-foreground">{preview}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seo-desc">Meta description</Label>
          <Textarea
            id="seo-desc"
            maxLength={500}
            disabled={!editable}
            value={form.metaDescription ?? ""}
            onChange={(e) => set("metaDescription", e.target.value)}
          />
          <p className="text-xs text-muted">
            {(form.metaDescription ?? "").length}/500 karakter
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seo-og">OG image URL</Label>
            <Input
              id="seo-og"
              placeholder="https://…"
              disabled={!editable}
              value={form.ogImageUrl ?? ""}
              onChange={(e) => set("ogImageUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo-canonical">Canonical URL</Label>
            <Input
              id="seo-canonical"
              placeholder="https://…"
              disabled={!editable}
              value={form.canonicalUrl ?? ""}
              onChange={(e) => set("canonicalUrl", e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-border p-3">
          <Checkbox
            className="mt-0.5"
            disabled={!editable}
            checked={form.noIndex ?? false}
            onChange={(e) => set("noIndex", e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium">noindex</span>
            <span className="block text-muted">
              Minta mesin pencari tidak mengindeks halaman ini di website publik.
            </span>
          </span>
        </label>

        {editable && (
          <Button onClick={save} loading={upsert.isPending}>
            Simpan SEO
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
