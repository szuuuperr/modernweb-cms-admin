"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Plus, Trash2 } from "lucide-react";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useRevokeApiKey,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { useWebsite } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
} from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { ApiKeyCreated } from "@/lib/api/types";

export function ApiKeysSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useApiKeys(websiteId);
  const { data: website } = useWebsite(websiteId);
  const { can } = useCan(websiteId);
  const revoke = useRevokeApiKey(websiteId);
  const remove = useDeleteApiKey(websiteId);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);

  // apikeys.manage is Owner-only on the backend: it mints a credential.
  const manage = can("apikeys.manage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          API key dipakai frontend untuk memanggil Content API publik website ini.
        </p>
        {manage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            API key baru
          </Button>
        )}
      </div>

      {website && !website.requireApiKey && (
        <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-info-soft px-4 py-3 text-sm text-sky-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Website ini belum mewajibkan API key, jadi Content API-nya tetap bisa
            dibaca tanpa key. Aktifkan <strong>Wajibkan API key</strong> di tab
            Ringkasan setelah semua frontend memakai key.
          </span>
        </div>
      )}

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {revoke.error && <ErrorBlock error={revoke.error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.length === 0 && <EmptyState title="Belum ada API key" />}

      {data && data.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Nama</th>
                    <th className="px-4 py-2.5 font-medium">Prefix</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Terakhir dipakai</th>
                    <th className="px-4 py-2.5 font-medium">Dibuat</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-2.5 font-medium">{key.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">
                        {key.prefix}…
                      </td>
                      <td className="px-4 py-2.5">
                        {key.revokedAt ? (
                          <Badge tone="danger">DICABUT</Badge>
                        ) : (
                          <Badge tone="success">AKTIF</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : "belum pernah"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {formatDate(key.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          {manage && !key.revokedAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Cabut "${key.name}"? Frontend yang memakainya langsung ditolak.`,
                                  )
                                ) {
                                  revoke.mutate(key.id);
                                }
                              }}
                            >
                              Cabut
                            </Button>
                          )}
                          {manage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Hapus ${key.name}`}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Hapus "${key.name}" permanen? Mencabut lebih aman kalau hanya ingin menonaktifkan.`,
                                  )
                                ) {
                                  remove.mutate(key.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {open && (
        <CreateKeyModal
          websiteId={websiteId}
          onClose={() => setOpen(false)}
          onCreated={setCreated}
        />
      )}

      {created && (
        <RevealKeyModal apiKey={created} onClose={() => setCreated(null)} />
      )}
    </div>
  );
}

function CreateKeyModal({
  websiteId,
  onClose,
  onCreated,
}: {
  websiteId: string;
  onClose: () => void;
  onCreated: (key: ApiKeyCreated) => void;
}) {
  const create = useCreateApiKey(websiteId);
  const [name, setName] = useState("");

  const submit = async () => {
    const key = await create.mutateAsync({ name });
    onClose();
    // Handed straight to the reveal modal: this is the only moment the
    // plaintext exists outside the client's own storage.
    onCreated(key);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="API key baru"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={!name}>
            Buat key
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {create.error && <ErrorBlock error={create.error} />}

        <div className="space-y-1.5">
          <Label htmlFor="k-name">Nama</Label>
          <Input
            id="k-name"
            placeholder="Vercel production"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted">
            Nama untuk mengenali key ini nanti — mis. nama environment yang
            memakainya.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-warning-soft px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Key hanya ditampilkan sekali, tepat setelah dibuat. Backend menyimpan
            hash-nya saja, jadi key itu tidak bisa dilihat lagi setelah dialog
            ditutup.
          </span>
        </div>
      </div>
    </Modal>
  );
}

function RevealKeyModal({
  apiKey,
  onClose,
}: {
  apiKey: ApiKeyCreated;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked outside a secure context; the key is selectable
      // on screen either way, so this is not worth an error dialog.
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Key "${apiKey.name}" dibuat`}
      footer={
        <Button onClick={onClose}>Sudah saya simpan</Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-warning-soft px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Salin sekarang. Setelah dialog ini ditutup, key-nya tidak bisa
            ditampilkan lagi — hanya hash-nya yang tersimpan.
          </span>
        </div>

        <div className="space-y-1.5">
          <Label>API key</Label>
          <div className="flex gap-2">
            <code className="flex-1 select-all break-all rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs">
              {apiKey.key}
            </code>
            <Button variant="secondary" onClick={copy} aria-label="Salin key">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Cara memakainya</Label>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
            {`curl -H "x-api-key: ${apiKey.key}" \\\n  <API_URL>/content/<slug>/pages`}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
