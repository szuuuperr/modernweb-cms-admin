"use client";

import { useState } from "react";
import { usePages } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ErrorBlock } from "@/components/ui/feedback";
import type { MenuItemInput, MenuItemNode } from "@/lib/api/types";

export interface MenuItemDraft {
  label: string;
  linkType: "url" | "page" | "none";
  url: string;
  pageId: string;
  target: string;
  parentId: string;
}

/**
 * Mounted only while open and keyed by the item being edited, so its state
 * seeds from the right item without an effect copying props into state.
 */
export function MenuItemModal({
  websiteId,
  editing,
  parentOptions,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  websiteId: string;
  editing: MenuItemNode | null;
  /** Already excludes the item itself and its descendants — no cycles offered. */
  parentOptions: { id: string; label: string; depth: number }[];
  onClose: () => void;
  onSubmit: (input: MenuItemInput) => Promise<void>;
  pending?: boolean;
  error?: unknown;
}) {
  const { data: pages } = usePages(websiteId, { limit: 100 });
  const [draft, setDraft] = useState<MenuItemDraft>(() => ({
    label: editing?.label ?? "",
    linkType: editing?.pageId ? "page" : editing?.url ? "url" : "none",
    url: editing?.url ?? "",
    pageId: editing?.pageId ?? "",
    target: editing?.target ?? "",
    parentId: "",
  }));
  const [invalid, setInvalid] = useState<string | null>(null);

  const set = <K extends keyof MenuItemDraft>(key: K, value: MenuItemDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = async () => {
    if (!draft.label.trim()) {
      setInvalid("Label wajib diisi");
      return;
    }
    setInvalid(null);
    // url/pageId are mutually exclusive in practice; send only the chosen one
    // so switching link type actually clears the other.
    await onSubmit({
      label: draft.label,
      url: draft.linkType === "url" ? draft.url || undefined : undefined,
      pageId: draft.linkType === "page" ? draft.pageId || undefined : undefined,
      target: draft.target || undefined,
      parentId: draft.parentId || undefined,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Edit item: ${editing.label}` : "Item menu baru"}
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
          <Label htmlFor="mi-label">Label</Label>
          <Input
            id="mi-label"
            placeholder="Paket Wisata"
            value={draft.label}
            aria-invalid={!!invalid}
            onChange={(e) => set("label", e.target.value)}
          />
          <FieldError message={invalid ?? undefined} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mi-linktype">Tautan ke</Label>
          <Select
            id="mi-linktype"
            value={draft.linkType}
            onChange={(e) =>
              set("linkType", e.target.value as MenuItemDraft["linkType"])
            }
          >
            <option value="none">Tanpa tautan (hanya judul grup)</option>
            <option value="page">Page di website ini</option>
            <option value="url">URL manual</option>
          </Select>
        </div>

        {draft.linkType === "page" && (
          <div className="space-y-1.5">
            <Label htmlFor="mi-page">Page</Label>
            <Select
              id="mi-page"
              value={draft.pageId}
              onChange={(e) => set("pageId", e.target.value)}
            >
              <option value="">— pilih —</option>
              {pages?.items.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title} (/{page.slug})
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted">
              CMS hanya menyimpan id-nya; frontend yang menerjemahkan jadi URL.
            </p>
          </div>
        )}

        {draft.linkType === "url" && (
          <div className="space-y-1.5">
            <Label htmlFor="mi-url">URL</Label>
            <Input
              id="mi-url"
              placeholder="/tour-packages"
              value={draft.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="mi-parent">Induk</Label>
            <Select
              id="mi-parent"
              value={draft.parentId}
              onChange={(e) => set("parentId", e.target.value)}
            >
              <option value="">— item tingkat atas —</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {"— ".repeat(option.depth)}
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mi-target">Target</Label>
            <Select
              id="mi-target"
              value={draft.target}
              onChange={(e) => set("target", e.target.value)}
            >
              <option value="">Sama seperti tab ini</option>
              <option value="_blank">Tab baru (_blank)</option>
            </Select>
          </div>
        </div>

        {editing && (
          <p className="text-xs text-muted">
            Urutan antar item diatur dengan menyeretnya di daftar, bukan di sini.
          </p>
        )}
      </div>
    </Modal>
  );
}
