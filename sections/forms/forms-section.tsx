"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCreateForm,
  useDeleteForm,
  useForms,
  useUpdateForm,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Checkbox, FieldError, Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { FormFieldEditor } from "@/components/forms/form-field-editor";
import type { Form, FormField, FormInput } from "@/lib/api/types";

export function FormsSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useForms(websiteId);
  const { can } = useCan(websiteId);
  const remove = useDeleteForm(websiteId);
  const [editing, setEditing] = useState<Form | null>(null);
  const [open, setOpen] = useState(false);

  const manage = can("forms.manage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Form dikirim publik lewat Content API. Setiap submission bisa
          memicu notifikasi email.
        </p>
        {manage && (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Form baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.length === 0 && (
        <EmptyState
          title="Belum ada form"
          description="Misalnya form 'Kontak' atau 'Pemesanan'."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((form) => (
          <Card key={form.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{form.name}</h3>
                    <Badge tone={form.active ? "success" : "slate"}>
                      {form.active ? "AKTIF" : "NONAKTIF"}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-muted">{form.slug}</p>
                </div>

                {manage && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${form.name}`}
                      onClick={() => {
                        setEditing(form);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus ${form.name}`}
                      onClick={() => {
                        // FormSubmission cascades on delete in the schema.
                        if (
                          confirm(
                            `Hapus form "${form.name}" beserta semua submission-nya? Tindakan ini tidak bisa dibatalkan.`,
                          )
                        ) {
                          remove.mutate(form.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge tone="primary">{form.fields.length} field</Badge>
                {form.notifyEmails.length > 0 ? (
                  <Badge tone="violet">
                    {form.notifyEmails.length} penerima notifikasi
                  </Badge>
                ) : (
                  <Badge tone="slate">tanpa notifikasi</Badge>
                )}
              </div>

              {can("submissions.read") && (
                <Link href={`/websites/${websiteId}/forms/${form.id}`}>
                  <Button variant="secondary" size="sm">
                    <Inbox className="h-4 w-4" />
                    Lihat submission
                  </Button>
                </Link>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {open && (
        <FormModal
          key={editing?.id ?? "new"}
          websiteId={websiteId}
          editing={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function FormModal({
  websiteId,
  editing,
  onClose,
}: {
  websiteId: string;
  editing: Form | null;
  onClose: () => void;
}) {
  const create = useCreateForm(websiteId);
  const update = useUpdateForm(websiteId);

  const [name, setName] = useState(() => editing?.name ?? "");
  const [slug, setSlug] = useState(() => editing?.slug ?? "");
  const [active, setActive] = useState(() => editing?.active ?? true);
  const [emails, setEmails] = useState(() =>
    (editing?.notifyEmails ?? []).join(", "),
  );
  const [fields, setFields] = useState<FormField[]>(() => editing?.fields ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Nama wajib diisi";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) next.slug = "Slug harus kebab-case";
    // The API requires at least one field (@ArrayMinSize(1)).
    if (fields.length === 0) next.fields = "Form wajib punya minimal satu field";
    if (fields.some((f) => !f.name.trim())) next.fields = "Setiap field butuh label";
    if (new Set(fields.map((f) => f.key)).size !== fields.length) {
      next.fields = "Key field harus unik";
    }

    const notifyEmails = emails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    // @IsEmail({}, { each: true }) rejects the whole request on one bad address.
    const bad = notifyEmails.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (bad) next.emails = `Bukan email yang valid: ${bad}`;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body: FormInput = { name, slug, fields, notifyEmails, active };
    if (editing) await update.mutateAsync({ formId: editing.id, ...body });
    else await create.mutateAsync(body);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Edit form: ${editing.name}` : "Form baru"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={submit}
            loading={create.isPending || update.isPending}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {(create.error ?? update.error) != null && (
          <ErrorBlock error={create.error ?? update.error} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Nama</Label>
            <Input
              id="f-name"
              placeholder="Kontak"
              value={name}
              aria-invalid={!!errors.name}
              onChange={(e) => {
                setName(e.target.value);
                // The slug is the public identifier the frontend submits to, so
                // only derive it while the form is still new.
                if (!editing) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  );
                }
              }}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-slug">Slug</Label>
            <Input
              id="f-slug"
              className="font-mono"
              value={slug}
              aria-invalid={!!errors.slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <FieldError message={errors.slug} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-emails">Email notifikasi</Label>
          <Input
            id="f-emails"
            placeholder="sales@halwatravel.com, cs@halwatravel.com"
            value={emails}
            aria-invalid={!!errors.emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <FieldError message={errors.emails} />
          <p className="text-xs text-muted">
            Dipisah koma. Kosongkan untuk mematikan notifikasi. Pengiriman hanya
            jalan kalau SMTP dikonfigurasi di backend.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Field</Label>
          <FieldError message={errors.fields} />
          <FormFieldEditor fields={fields} onChange={setFields} />
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-border p-3">
          <Checkbox
            className="mt-0.5"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium">Aktif</span>
            <span className="block text-muted">
              Kalau dimatikan, pengiriman publik ditolak tapi submission lama
              tetap tersimpan.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
