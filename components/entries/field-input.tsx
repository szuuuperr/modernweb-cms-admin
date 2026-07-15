"use client";

import { useMedia, useEntries } from "@/lib/api/hooks";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Field } from "@/lib/api/types";
import type { FieldOptions } from "@/lib/field-types";

/**
 * Renders one input from a Field definition — the client-side mirror of the
 * backend's field-type strategies. Adding a type means a case here and a
 * strategy there; nothing else changes.
 */
export function FieldInput({
  websiteId,
  field,
  value,
  onChange,
  error,
}: {
  websiteId: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const options = (field.options ?? {}) as FieldOptions;
  const id = `field-${field.key}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {field.name}
        {field.required && <span className="ml-1 text-red-600">*</span>}
        <span className="ml-2 font-mono text-xs font-normal text-slate-400">
          {field.key}
        </span>
      </Label>

      <Control
        id={id}
        websiteId={websiteId}
        field={field}
        options={options}
        value={value}
        onChange={onChange}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Control({
  id,
  websiteId,
  field,
  options,
  value,
  onChange,
}: {
  id: string;
  websiteId: string;
  field: Field;
  options: FieldOptions;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "TEXTAREA":
    case "RICHTEXT":
      return (
        <Textarea
          id={id}
          value={(value as string) ?? ""}
          maxLength={options.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "NUMBER":
      return (
        <Input
          id={id}
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          min={options.min}
          max={options.max}
          // Empty must become undefined, not 0 — NumberStrategy rejects
          // non-numbers, and 0 would silently invent a value the user never typed.
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      );

    case "BOOLEAN":
      return (
        <label className="flex items-center gap-2">
          <input
            id={id}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm text-slate-600">Ya</span>
        </label>
      );

    case "DATE":
      return (
        <Input
          id={id}
          type="date"
          value={toDateInput(value)}
          // DateStrategy stores an ISO string; <input type="date"> speaks
          // yyyy-mm-dd, so convert on the way out.
          onChange={(e) =>
            onChange(
              e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined,
            )
          }
        />
      );

    case "SELECT":
      return (
        <Select
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">— pilih —</option>
          {(options.choices ?? []).map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </Select>
      );

    case "MEDIA":
      return (
        <MediaPicker
          id={id}
          websiteId={websiteId}
          multiple={options.multiple}
          value={value}
          onChange={onChange}
        />
      );

    case "RELATION":
      return (
        <RelationPicker
          id={id}
          websiteId={websiteId}
          collectionId={options.collectionId}
          multiple={options.multiple}
          value={value}
          onChange={onChange}
        />
      );

    case "JSON":
      return <JsonInput id={id} value={value} onChange={onChange} />;

    default:
      return (
        <Input
          id={id}
          value={(value as string) ?? ""}
          maxLength={options.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function MediaPicker({
  id,
  websiteId,
  multiple,
  value,
  onChange,
}: {
  id: string;
  websiteId: string;
  multiple?: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { data, isLoading } = useMedia(websiteId, 1);
  if (isLoading) return <p className="text-sm text-slate-500">Memuat media…</p>;

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Belum ada media. Unggah dulu di tab Media.
      </p>
    );
  }

  return (
    <MultiOrSingleSelect
      id={id}
      multiple={multiple}
      value={value}
      onChange={onChange}
      options={items.map((m) => ({ id: m.id, label: m.filename }))}
    />
  );
}

function RelationPicker({
  id,
  websiteId,
  collectionId,
  multiple,
  value,
  onChange,
}: {
  id: string;
  websiteId: string;
  collectionId?: string;
  multiple?: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { data, isLoading } = useEntries(websiteId, collectionId ?? "", {
    limit: 100,
  });

  if (!collectionId) {
    return (
      <p className="text-sm text-amber-700">
        Field ini belum punya collection tujuan. Atur di builder collection.
      </p>
    );
  }
  if (isLoading) return <p className="text-sm text-slate-500">Memuat entry…</p>;

  const items = data?.items ?? [];
  return (
    <MultiOrSingleSelect
      id={id}
      multiple={multiple}
      value={value}
      onChange={onChange}
      options={items.map((e) => ({ id: e.id, label: entryLabel(e.data, e.id) }))}
    />
  );
}

function MultiOrSingleSelect({
  id,
  multiple,
  value,
  onChange,
  options,
}: {
  id: string;
  multiple?: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
  options: { id: string; label: string }[];
}) {
  if (multiple) {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selected, option.id]
                    : selected.filter((v) => v !== option.id),
                )
              }
            />
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <Select
      id={id}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">— pilih —</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function JsonInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <>
      <Textarea
        id={id}
        className="font-mono text-xs"
        defaultValue={value === undefined ? "" : JSON.stringify(value, null, 2)}
        // Parsed on blur rather than per keystroke: half-typed JSON is invalid
        // JSON, and re-serialising it on every character fights the typist.
        onBlur={(e) => {
          const text = e.target.value.trim();
          if (!text) return onChange(undefined);
          try {
            onChange(JSON.parse(text));
          } catch {
            onChange(text);
          }
        }}
      />
      <p className="text-xs text-slate-500">
        JSON tidak valid akan dikirim sebagai string biasa.
      </p>
    </>
  );
}

function toDateInput(value: unknown) {
  if (typeof value !== "string") return "";
  const parsed = Date.parse(value);
  return Number.isNaN(parsed)
    ? ""
    : new Date(parsed).toISOString().slice(0, 10);
}

/** Entries have no title column, so fall back through likely keys then the id. */
function entryLabel(data: Record<string, unknown>, id: string) {
  for (const key of ["title", "name", "slug", "label"]) {
    if (typeof data[key] === "string" && data[key]) return data[key] as string;
  }
  return id;
}
