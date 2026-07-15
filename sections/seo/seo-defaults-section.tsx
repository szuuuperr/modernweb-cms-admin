"use client";

import { useState } from "react";
import { useSeoDefaults, useUpsertSeoDefaults } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import type { SeoDefaults } from "@/lib/api/types";

export function SeoDefaultsSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useSeoDefaults(websiteId);

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;

  return (
    <SeoDefaultsForm
      key={data ? "loaded" : "empty"}
      websiteId={websiteId}
      initial={data ?? null}
    />
  );
}

function SeoDefaultsForm({
  websiteId,
  initial,
}: {
  websiteId: string;
  initial: SeoDefaults | null;
}) {
  const { can } = useCan(websiteId);
  const upsert = useUpsertSeoDefaults(websiteId);
  const editable = can("seo.manage");

  const [form, setForm] = useState<SeoDefaults>(() => ({
    titleTemplate: initial?.titleTemplate ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    ogImageUrl: initial?.ogImageUrl ?? "",
  }));

  const set = <K extends keyof SeoDefaults>(key: K, value: SeoDefaults[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    // "" would fail @IsUrl on ogImageUrl, so empty fields are omitted entirely.
    upsert.mutate({
      titleTemplate: form.titleTemplate || undefined,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      ogImageUrl: form.ogImageUrl || undefined,
    });

  const preview = (form.titleTemplate ?? "").includes("%s")
    ? (form.titleTemplate ?? "").replace("%s", "Paket Wisata Bromo")
    : null;

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted">
        Nilai ini dipakai sebagai cadangan ketika sebuah page atau entry tidak
        punya SEO sendiri. Content API publik mengirimkan hasil gabungannya.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Default SEO website</CardTitle>
          {upsert.isSuccess && !upsert.isPending && (
            <span className="text-xs text-emerald-700">Tersimpan</span>
          )}
        </CardHeader>
        <CardBody className="space-y-4">
          {upsert.error && <ErrorBlock error={upsert.error} />}

          <div className="space-y-1.5">
            <Label htmlFor="sd-template">Title template</Label>
            <Input
              id="sd-template"
              className="font-mono"
              placeholder="%s | Halwa Travel"
              disabled={!editable}
              value={form.titleTemplate ?? ""}
              onChange={(e) => set("titleTemplate", e.target.value)}
            />
            <p className="text-xs text-muted">
              <code className="font-mono">%s</code> diganti dengan meta title
              target.
              {preview && (
                <>
                  {" "}
                  Contoh:{" "}
                  <span className="font-medium text-foreground">{preview}</span>
                </>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sd-title">Meta title cadangan</Label>
            <Input
              id="sd-title"
              disabled={!editable}
              value={form.metaTitle ?? ""}
              onChange={(e) => set("metaTitle", e.target.value)}
            />
            <p className="text-xs text-muted">
              Dipakai kalau target tidak punya meta title sendiri.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sd-desc">Meta description cadangan</Label>
            <Textarea
              id="sd-desc"
              maxLength={500}
              disabled={!editable}
              value={form.metaDescription ?? ""}
              onChange={(e) => set("metaDescription", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sd-og">OG image URL cadangan</Label>
            <Input
              id="sd-og"
              placeholder="https://…"
              disabled={!editable}
              value={form.ogImageUrl ?? ""}
              onChange={(e) => set("ogImageUrl", e.target.value)}
            />
          </div>

          {editable && (
            <Button onClick={save} loading={upsert.isPending}>
              Simpan default
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
