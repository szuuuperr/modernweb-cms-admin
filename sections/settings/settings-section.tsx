"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDeleteSetting, useSettings, useUpsertSetting } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import type { Setting } from "@/lib/api/types";

export function SettingsSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useSettings(websiteId);
  const { can } = useCan(websiteId);
  const remove = useDeleteSetting(websiteId);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [open, setOpen] = useState(false);

  const manage = can("settings.manage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Setting adalah pasangan key dan nilai JSON bebas — mis. kontak, jam
          buka, atau tautan sosial. Frontend membacanya lewat Content API.
        </p>
        {manage && (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Setting baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      {data?.length === 0 && <EmptyState title="Belum ada setting" />}

      <div className="space-y-3">
        {data?.map((setting) => (
          <Card key={setting.id}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <code className="font-mono text-sm font-medium text-primary-700">
                  {setting.key}
                </code>
                {manage && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${setting.key}`}
                      onClick={() => {
                        setEditing(setting);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus ${setting.key}`}
                      onClick={() => {
                        if (confirm(`Hapus setting "${setting.key}"?`)) {
                          remove.mutate(setting.key);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              </div>
              <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                {JSON.stringify(setting.value, null, 2)}
              </pre>
            </CardBody>
          </Card>
        ))}
      </div>

      {open && (
        <SettingModal
          key={editing?.key ?? "new"}
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

function SettingModal({
  websiteId,
  editing,
  onClose,
}: {
  websiteId: string;
  editing: Setting | null;
  onClose: () => void;
}) {
  const upsert = useUpsertSetting(websiteId);
  const [key, setKey] = useState(() => editing?.key ?? "");
  const [text, setText] = useState(() =>
    editing ? JSON.stringify(editing.value, null, 2) : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!/^[a-z0-9]+([._-][a-z0-9]+)*$/.test(key)) {
      next.key = "Key harus huruf kecil/angka, dipisah titik, garis bawah, atau strip";
    }

    let value: unknown;
    try {
      // The API accepts any JSON value, so a bare string must be quoted.
      // Rejecting it here is clearer than letting "abc" 400 from the server.
      value = JSON.parse(text);
    } catch {
      next.value = 'JSON tidak valid. Teks biasa harus diapit kutip, mis. "buka"';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await upsert.mutateAsync({ key, value });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Edit setting: ${editing.key}` : "Setting baru"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={upsert.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {upsert.error && <ErrorBlock error={upsert.error} />}

        <div className="space-y-1.5">
          <Label htmlFor="s-key">Key</Label>
          <Input
            id="s-key"
            className="font-mono"
            placeholder="contact"
            value={key}
            // The key is the identity of the row; changing it would create a
            // second setting rather than rename this one.
            disabled={!!editing}
            aria-invalid={!!errors.key}
            onChange={(e) => setKey(e.target.value)}
          />
          <FieldError message={errors.key} />
          {editing && (
            <p className="text-xs text-muted">
              Key tidak bisa diubah. Hapus lalu buat baru kalau perlu berganti.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-value">Nilai (JSON)</Label>
          <Textarea
            id="s-value"
            className="min-h-40 font-mono text-xs"
            placeholder={'{\n  "phone": "+62 812 0000 0000"\n}'}
            value={text}
            aria-invalid={!!errors.value}
            onChange={(e) => setText(e.target.value)}
          />
          <FieldError message={errors.value} />
          <p className="text-xs text-muted">
            Boleh object, array, angka, boolean, atau string berkutip.
          </p>
        </div>
      </div>
    </Modal>
  );
}
