"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useWebhookDeliveries, useWebhooks } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { WebhookDelivery, WebhookDeliveryStatus } from "@/lib/api/types";

const STATUS_TONE: Record<WebhookDeliveryStatus, "success" | "danger" | "warning"> =
  {
    SUCCESS: "success",
    FAILED: "danger",
    PENDING: "warning",
  };

export function WebhookDeliveriesSection({
  websiteId,
  webhookId,
}: {
  websiteId: string;
  webhookId: string;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useWebhookDeliveries(
    websiteId,
    webhookId,
    page,
  );
  // The list is already cached, so naming the webhook costs no extra request.
  const { data: webhooks } = useWebhooks(websiteId);
  const webhook = webhooks?.find((w) => w.id === webhookId);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/websites/${websiteId}/webhooks`}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-700"
        >
          <ChevronLeft className="h-3 w-3" />
          Semua webhook
        </Link>
        <h2 className="mt-1 font-medium">
          Riwayat kiriman{webhook ? ` — ${webhook.name}` : ""}
        </h2>
        {webhook && (
          <p className="break-all font-mono text-xs text-muted">{webhook.url}</p>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}

      {data?.items.length === 0 && (
        <EmptyState
          title="Belum ada kiriman"
          description="Riwayat terisi setelah ada perubahan konten yang cocok dengan event yang dilanggan."
        />
      )}

      <div className="space-y-2">
        {data?.items.map((delivery) => (
          <DeliveryRow key={delivery.id} delivery={delivery} />
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Halaman {data.meta.page} dari {data.meta.totalPages} ·{" "}
            {data.meta.total} kiriman
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryRow({ delivery }: { delivery: WebhookDelivery }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardBody className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-faint" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
          )}

          <Badge tone={STATUS_TONE[delivery.status]}>{delivery.status}</Badge>

          <span className="font-mono text-xs">{delivery.event}</span>

          {delivery.responseStatus != null && (
            <span className="font-mono text-xs text-muted">
              HTTP {delivery.responseStatus}
            </span>
          )}

          {/* Attempts only matter when there was more than one — the backend
              retries 3x with backoff, so >1 means the receiver wobbled. */}
          {delivery.attempts > 1 && (
            <span className="text-xs text-amber-700">
              {delivery.attempts}x percobaan
            </span>
          )}

          <span className="ml-auto shrink-0 text-xs text-muted">
            {formatDate(delivery.createdAt)}
          </span>
        </button>

        {open && (
          <div className="space-y-3 border-t border-border px-4 py-3">
            {delivery.lastError && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Error terakhir</p>
                <pre className="overflow-x-auto rounded-lg border border-rose-200 bg-danger-soft p-3 font-mono text-xs text-rose-800">
                  {delivery.lastError}
                </pre>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-700">Payload</p>
              <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                {JSON.stringify(delivery.payload, null, 2)}
              </pre>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <span>Percobaan: {delivery.attempts}</span>
              <span>
                Terkirim:{" "}
                {delivery.deliveredAt ? formatDate(delivery.deliveredAt) : "—"}
              </span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
