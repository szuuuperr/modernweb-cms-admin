"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import {
  useAddMember,
  useMembers,
  useRemoveMember,
  useRoles,
  useUpdateMemberRole,
} from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";

export function MembersSection({ websiteId }: { websiteId: string }) {
  const { data: members, isLoading, error } = useMembers(websiteId);
  const { data: roles } = useRoles(websiteId);
  const { can } = useCan(websiteId);
  const { user } = useAuth();
  const updateRole = useUpdateMemberRole(websiteId);
  const removeMember = useRemoveMember(websiteId);
  const [open, setOpen] = useState(false);

  const manage = can("members.manage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Anggota mengakses website ini lewat role yang menentukan permission-nya.
        </p>
        {manage && (
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Tambah anggota
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {updateRole.error && <ErrorBlock error={updateRole.error} />}
      {removeMember.error && <ErrorBlock error={removeMember.error} />}

      {members?.length === 0 && <EmptyState title="Belum ada anggota" />}

      {members && members.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-2 font-medium">{member.user.name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {member.user.email}
                      {member.userId === user?.id && (
                        <span className="ml-2 text-xs text-faint">(Anda)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {manage ? (
                        <Select
                          className="h-8 w-40"
                          value={member.roleId}
                          onChange={(e) =>
                            updateRole.mutate({
                              memberId: member.id,
                              roleId: e.target.value,
                            })
                          }
                        >
                          {roles?.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        member.role.name
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {manage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Keluarkan anggota"
                          onClick={() => {
                            if (
                              confirm(
                                `Keluarkan ${member.user.name} dari website ini?`,
                              )
                            ) {
                              removeMember.mutate(member.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <AddMemberModal
        websiteId={websiteId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function AddMemberModal({
  websiteId,
  open,
  onClose,
}: {
  websiteId: string;
  open: boolean;
  onClose: () => void;
}) {
  const add = useAddMember(websiteId);
  const { data: roles } = useRoles(websiteId);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  const submit = async () => {
    await add.mutateAsync({ email, roleId: roleId || roles?.[0]?.id || "" });
    setEmail("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah anggota"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={add.isPending}>
            Tambah
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {add.error && <ErrorBlock error={add.error} />}

        <div className="space-y-1.5">
          <Label htmlFor="m-email">Email</Label>
          <Input
            id="m-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="editor@contoh.com"
          />
          <p className="text-xs text-muted">
            Pengguna harus sudah terdaftar — backend mencari akun dengan email ini.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="m-role">Role</Label>
          <Select
            id="m-role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
