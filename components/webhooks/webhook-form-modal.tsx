"use client";

import { useState } from "react";
import { useWebhookEvents } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Checkbox, FieldError, Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ErrorBlock, Spinner } from "@/components/ui/feedback";
import type { Webhook, WebhookInput } from "@/lib/api/types";

/**
 * Mounted only while open and keyed by the webhook being edited, so its state
 * seeds from the right one without an effect copying props into state.
 */
export function WebhookFormModal({
  websiteId,
  editing,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  websiteId: string;
  editing: Webhook | null;
  onClose: () => void;
  onSubmit: (input: WebhookInput) => Promise<void>;
  pending?: boolean;
  error?: unknown;
}) {
  const { data, isLoading } = useWebhookEvents(websiteId);
  const [name, setName] = useState(() => editing?.name ?? "");
  const [url, setUrl] = useState(() => editing?.url ?? "");
  const [active, setActive] = useState(() => editing?.active ?? true);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(editing?.events ?? []),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (event: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Nama wajib diisi";
    // The API validates with @IsUrl({ require_protocol: true }), so a bare
    // host would 400 — say so here instead of round-tripping for it.
    if (!/^https?:\/\/.+/.test(url)) {
      next.url = "URL harus lengkap dengan http:// atau https://";
    }
    if (selected.size === 0) next.events = "Pilih minimal satu event";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({ name, url, events: [...selected], active });
  };

  // Group by resource so 15 checkboxes read as a few short lists.
  const groups = new Map<string, string[]>();
  for (const event of data?.events ?? []) {
    const resource = event.split(".")[0];
    groups.set(resource, [...(groups.get(resource) ?? []), event]);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Edit webhook: ${editing.name}` : "Webhook baru"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={pending}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error != null && <ErrorBlock error={error} />}

        <div className="space-y-1.5">
          <Label htmlFor="w-name">Nama</Label>
          <Input
            id="w-name"
            placeholder="Next.js ISR revalidate"
            value={name}
            aria-invalid={!!errors.name}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="w-url">URL tujuan</Label>
          <Input
            id="w-url"
            className="font-mono text-xs"
            placeholder="https://halwatravel.com/api/revalidate"
            value={url}
            aria-invalid={!!errors.url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <FieldError message={errors.url} />
        </div>

        <div className="space-y-2">
          <Label>Event ({selected.size})</Label>
          <FieldError message={errors.events} />

          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted">
              <Spinner />
              Memuat daftar event…
            </div>
          ) : (
            <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
              {[...groups.entries()].map(([resource, events]) => (
                <div key={resource} className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted">
                    {resource}
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {events.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={selected.has(event)}
                          onChange={() => toggle(event)}
                        />
                        <span className="font-mono text-xs">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Kalau dimatikan, webhook berhenti dikirim tapi riwayatnya tetap
              tersimpan.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
