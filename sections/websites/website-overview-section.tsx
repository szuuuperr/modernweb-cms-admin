"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdateWebsite, useWebsite } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Input, Label, Select } from "@/components/ui/input";
import { ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import type { WebsiteStatus } from "@/lib/api/types";

interface FormValues {
  name: string;
  slug: string;
  domain: string;
  status: WebsiteStatus;
  requireApiKey: boolean;
}

export function WebsiteOverviewSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useWebsite(websiteId);
  const update = useUpdateWebsite(websiteId);
  const { can } = useCan(websiteId);
  const editable = can("websites.update");

  const { register, handleSubmit, reset, formState } = useForm<FormValues>();

  // The form is only populated once the website arrives, so reset when it does.
  useEffect(() => {
    if (!data) return;
    reset({
      name: data.name,
      slug: data.slug,
      domain: data.domain ?? "",
      status: data.status,
      requireApiKey: data.requireApiKey,
    });
  }, [data, reset]);

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;

  const onSubmit = handleSubmit(async (values) => {
    await update.mutateAsync({
      name: values.name,
      slug: values.slug,
      domain: values.domain || undefined,
      status: values.status,
      requireApiKey: values.requireApiKey,
    });
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Pengaturan website</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            {update.error && <ErrorBlock error={update.error} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" disabled={!editable} {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  className="font-mono"
                  disabled={!editable}
                  {...register("slug")}
                />
                <p className="text-xs text-muted">
                  Dipakai di URL Content API publik.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  disabled={!editable}
                  {...register("domain")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" disabled={!editable} {...register("status")}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Checkbox
                className="mt-0.5"
                disabled={!editable}
                {...register("requireApiKey")}
              />
              <span className="text-sm">
                <span className="font-medium">Wajibkan API key</span>
                <span className="block text-muted">
                  Content API publik menolak permintaan tanpa x-api-key yang
                  valid. Frontend yang belum dikonfigurasi akan langsung gagal.
                </span>
              </span>
            </label>

            {editable && (
              <Button
                type="submit"
                loading={update.isPending}
                disabled={!formState.isDirty}
              >
                Simpan perubahan
              </Button>
            )}
          </form>
        </CardBody>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Stat label="Collections" value={data.collections.length} />
          <Stat label="Entries" value={data._count.entries} />
          <Stat label="Media" value={data._count.media} />
          <Stat label="Anggota" value={data._count.members} />
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
