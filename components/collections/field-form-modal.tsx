"use client";

import { useState } from "react";
import { useCollections } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ErrorBlock } from "@/components/ui/feedback";
import { FIELD_TYPES, optionKeysFor, type FieldOptions } from "@/lib/field-types";
import type { Field, FieldType } from "@/lib/api/types";

export interface FieldDraft {
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  options: FieldOptions;
}

/**
 * Mounted only while open, and keyed by the field being edited, so the draft
 * starts from the right values without an effect copying props into state.
 */
export function FieldFormModal({
  websiteId,
  onClose,
  onSubmit,
  editing,
  pending,
  error,
}: {
  websiteId: string;
  onClose: () => void;
  onSubmit: (draft: FieldDraft) => Promise<void>;
  editing?: Field | null;
  pending?: boolean;
  error?: unknown;
}) {
  const [draft, setDraft] = useState<FieldDraft>(() =>
    editing
      ? {
          name: editing.name,
          key: editing.key,
          type: editing.type,
          required: editing.required,
          options: editing.options ?? {},
        }
      : emptyDraft(),
  );
  const [choicesText, setChoicesText] = useState(() =>
    (editing?.options?.choices ?? []).join("\n"),
  );
  const { data: collections } = useCollections(websiteId);

  const optionKeys = optionKeysFor(draft.type);
  const set = <K extends keyof FieldDraft>(key: K, value: FieldDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setOption = <K extends keyof FieldOptions>(
    key: K,
    value: FieldOptions[K],
  ) => setDraft((d) => ({ ...d, options: { ...d.options, [key]: value } }));

  const submit = async () => {
    const choices = choicesText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    // Only keep options the chosen type actually reads, so switching type
    // twice does not leave a stale maxLength on a BOOLEAN.
    const options: FieldOptions = {};
    for (const key of optionKeys) {
      if (key === "choices") {
        if (choices.length) options.choices = choices;
      } else if (draft.options[key] !== undefined && draft.options[key] !== "") {
        Object.assign(options, { [key]: draft.options[key] });
      }
    }
    await onSubmit({ ...draft, options });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Edit field: ${editing.name}` : "Field baru"}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Nama</Label>
            <Input
              id="f-name"
              value={draft.name}
              placeholder="Harga"
              onChange={(e) => {
                const name = e.target.value;
                setDraft((d) => ({
                  ...d,
                  name,
                  // The key is part of every stored entry's JSON, so renaming it
                  // later would orphan existing data — derive it only while the
                  // field is still new.
                  key: editing ? d.key : toKey(name),
                }));
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-key">Key</Label>
            <Input
              id="f-key"
              className="font-mono"
              value={draft.key}
              placeholder="harga"
              onChange={(e) => set("key", e.target.value)}
            />
            <p className="text-xs text-muted">
              Kunci di JSON entry. Diawali huruf, hanya huruf/angka/underscore.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-type">Tipe</Label>
          <Select
            id="f-type"
            value={draft.type}
            onChange={(e) => set("type", e.target.value as FieldType)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label} — {t.hint}
              </option>
            ))}
          </Select>
          {editing && (
            <p className="text-xs text-amber-700">
              Mengubah tipe tidak memvalidasi ulang entry yang sudah tersimpan.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2">
          <Checkbox
            checked={draft.required}
            onChange={(e) => set("required", e.target.checked)}
          />
          <span className="text-sm">Wajib diisi</span>
        </label>

        {optionKeys.includes("maxLength") && (
          <NumberOption
            id="f-maxlen"
            label="Panjang maksimum"
            value={draft.options.maxLength}
            onChange={(v) => setOption("maxLength", v)}
          />
        )}

        {optionKeys.includes("min") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberOption
              id="f-min"
              label="Minimum"
              value={draft.options.min}
              onChange={(v) => setOption("min", v)}
            />
            <NumberOption
              id="f-max"
              label="Maksimum"
              value={draft.options.max}
              onChange={(v) => setOption("max", v)}
            />
          </div>
        )}

        {optionKeys.includes("choices") && (
          <div className="space-y-1.5">
            <Label htmlFor="f-choices">Pilihan (satu per baris)</Label>
            <textarea
              id="f-choices"
              className="min-h-24 w-full rounded-md border border-border px-3 py-2 font-mono text-sm"
              value={choicesText}
              onChange={(e) => setChoicesText(e.target.value)}
              placeholder={"reguler\npremium"}
            />
          </div>
        )}

        {optionKeys.includes("collectionId") && (
          <div className="space-y-1.5">
            <Label htmlFor="f-collection">Collection tujuan</Label>
            <Select
              id="f-collection"
              value={draft.options.collectionId ?? ""}
              onChange={(e) => setOption("collectionId", e.target.value)}
            >
              <option value="">— pilih —</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted">
              Dipakai editor untuk menampilkan pilihan. Backend menerima id
              entry mana pun.
            </p>
          </div>
        )}

        {optionKeys.includes("multiple") && (
          <label className="flex items-center gap-2">
            <Checkbox
              checked={draft.options.multiple ?? false}
              onChange={(e) => setOption("multiple", e.target.checked)}
            />
            <span className="text-sm">Boleh lebih dari satu</span>
          </label>
        )}
      </div>
    </Modal>
  );
}

function NumberOption({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </div>
  );
}

function emptyDraft(): FieldDraft {
  return { name: "", key: "", type: "TEXT", required: false, options: {} };
}

function toKey(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "f$1");
}
