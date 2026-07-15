"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCreateWebhook,
  useDeleteWebhook,
  useRotateWebhookSecret,
  useUpdateWebhook,
  useWebhooks,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { WebhookFormModal } from "@/components/webhooks/webhook-form-modal";
import { SecretModal } from "@/components/webhooks/secret-modal";
import { formatDate } from "@/lib/utils";
import type { Webhook, WebhookInput } from "@/lib/api/types";

export function WebhooksSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useWebhooks(websiteId);
  const { can } = useCan(websiteId);
  const create = useCreateWebhook(websiteId);
  const update = useUpdateWebhook(websiteId);
  const rotate = useRotateWebhookSecret(websiteId);
  const remove = useDeleteWebhook(websiteId);

  const [editing, setEditing] = useState<Webhook | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [revealed, setRevealed] = useState<{
    name: string;
    secret: string;
    rotated?: boolean;
  } | null>(null);

  // webhooks.manage is Owner-only on the backend: a webhook ships content to
  // an arbitrary URL and carries its own secret.
  const manage = can("webhooks.manage");

  const submit = async (input: WebhookInput) => {
    if (editing) {
      await update.mutateAsync({ webhookId: editing.id, ...input });
      setFormOpen(false);
      setEditing(null);
    } else {
      const created = await create.mutateAsync(input);
      setFormOpen(false);
      // Handed straight on: this is the only moment the secret exists outside
      // the database.
      setRevealed({ name: created.name, secret: created.secret });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Webhook memberi tahu sistem lain saat konten berubah — misalnya memicu
          revalidasi ISR di frontend Next.js.
        </p>
        {manage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Webhook baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {rotate.error && <ErrorBlock error={rotate.error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.length === 0 && (
        <EmptyState
          title="Belum ada webhook"
          description="Kirim event konten ke URL Anda sendiri, ditandatangani HMAC."
        />
      )}

      <div className="space-y-3">
        {data?.map((webhook) => (
          <Card key={webhook.id}>
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{webhook.name}</h3>
                    <Badge tone={webhook.active ? "success" : "slate"}>
                      {webhook.active ? "AKTIF" : "NONAKTIF"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 break-all font-mono text-xs text-muted">
                    {webhook.url}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/websites/${websiteId}/webhooks/${webhook.id}`}
                  >
                    <Button variant="secondary" size="sm">
                      Riwayat kiriman
                    </Button>
                  </Link>
                  {manage && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Putar secret ${webhook.name}`}
                        loading={rotate.isPending}
                        onClick={async () => {
                          if (
                            !confirm(
                              `Putar secret "${webhook.name}"? Secret lama langsung berhenti berlaku dan receiver akan menolak kiriman sampai yang baru dipasang.`,
                            )
                          ) {
                            return;
                          }
                          const result = await rotate.mutateAsync(webhook.id);
                          setRevealed({
                            name: webhook.name,
                            secret: result.secret,
                            rotated: true,
                          });
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${webhook.name}`}
                        onClick={() => {
                          setEditing(webhook);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus ${webhook.name}`}
                        onClick={() => {
                          if (
                            confirm(
                              `Hapus webhook "${webhook.name}" beserta riwayat kirimannya?`,
                            )
                          ) {
                            remove.mutate(webhook.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {webhook.events.map((event) => (
                  <Badge key={event} tone="violet">
                    {event}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-faint">
                Dibuat {formatDate(webhook.createdAt)}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {formOpen && (
        <WebhookFormModal
          key={editing?.id ?? "new"}
          websiteId={websiteId}
          editing={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={submit}
          pending={create.isPending || update.isPending}
          error={create.error ?? update.error}
        />
      )}

      {revealed && (
        <SecretModal
          name={revealed.name}
          secret={revealed.secret}
          rotated={revealed.rotated}
          onClose={() => setRevealed(null)}
        />
      )}
    </div>
  );
}
