"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { groupedPermissions, type Permission } from "@/lib/permissions";
import type { Role } from "@/lib/api/types";

export function RolesSection({ websiteId }: { websiteId: string }) {
  const { data: roles, isLoading, error } = useRoles(websiteId);
  const { can } = useCan(websiteId);
  const remove = useDeleteRole(websiteId);
  const [editing, setEditing] = useState<Role | null>(null);
  const [open, setOpen] = useState(false);

  // roles.manage is Owner-only on the backend: it mints capability.
  const manage = can("roles.manage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Role adalah sekumpulan permission. Perubahan langsung berlaku bagi
          semua anggota yang memakainya.
        </p>
        {manage && (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Role baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {remove.error && <ErrorBlock error={remove.error} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {roles?.map((role) => (
          <Card key={role.id}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{role.name}</h3>
                {manage && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit role"
                      onClick={() => {
                        setEditing(role);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Hapus role"
                      onClick={() => {
                        if (
                          confirm(
                            `Hapus role "${role.name}"? Anggota yang memakainya harus dipindah ke role lain.`,
                          )
                        ) {
                          remove.mutate(role.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge>{role.permissions.length} permission</Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {open && (
        <RoleModal
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

/**
 * Mounted only while open and keyed by the role being edited, so its state
 * seeds from the right role without an effect copying props into state.
 */
function RoleModal({
  websiteId,
  editing,
  onClose,
}: {
  websiteId: string;
  editing: Role | null;
  onClose: () => void;
}) {
  const create = useCreateRole(websiteId);
  const update = useUpdateRole(websiteId);
  const [name, setName] = useState(() => editing?.name ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(editing?.permissions ?? []),
  );

  const toggle = (permission: Permission) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });

  const submit = async () => {
    const permissions = [...selected];
    if (editing) {
      await update.mutateAsync({ roleId: editing.id, name, permissions });
    } else {
      await create.mutateAsync({ name, permissions });
    }
    onClose();
  };

  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Edit role: ${editing.name}` : "Role baru"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={submit}
            loading={pending}
            // The API rejects an empty permission list (@ArrayNotEmpty).
            disabled={!name || selected.size === 0}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error != null && <ErrorBlock error={error} />}

        <div className="space-y-1.5">
          <Label htmlFor="r-name">Nama role</Label>
          <Input
            id="r-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Content Editor"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Permission ({selected.size})</Label>
          </div>

          <div className="max-h-72 space-y-4 overflow-y-auto rounded-md border border-slate-200 p-3">
            {groupedPermissions().map((group) => (
              <div key={group.resource} className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {group.label}
                </p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {group.permissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(permission)}
                        onChange={() => toggle(permission)}
                      />
                      <span className="font-mono text-xs">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
