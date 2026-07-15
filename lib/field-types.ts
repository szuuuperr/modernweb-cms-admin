import type { FieldOptions, FieldType } from "@/lib/api/types";

export type { FieldOptions };

/**
 * Mirrors the option keys each strategy in
 * src/modules/entries/domain/field-types/ actually reads. Anything else the UI
 * sends would just sit in the JSON column, unvalidated and unused.
 */
export const FIELD_TYPES: {
  type: FieldType;
  label: string;
  hint: string;
}[] = [
  { type: "TEXT", label: "Text", hint: "Satu baris teks" },
  { type: "TEXTAREA", label: "Textarea", hint: "Teks panjang" },
  { type: "RICHTEXT", label: "Rich text", hint: "Teks panjang, spasi dipertahankan" },
  { type: "NUMBER", label: "Number", hint: "Angka" },
  { type: "BOOLEAN", label: "Boolean", hint: "Ya / tidak" },
  { type: "DATE", label: "Date", hint: "Tanggal ISO 8601" },
  { type: "SELECT", label: "Select", hint: "Pilihan dari daftar" },
  { type: "MEDIA", label: "Media", hint: "Referensi ke media library" },
  { type: "RELATION", label: "Relation", hint: "Referensi ke entry lain" },
  { type: "JSON", label: "JSON", hint: "Nilai JSON bebas" },
];

export const FIELD_TYPE_LABEL: Record<FieldType, string> = Object.fromEntries(
  FIELD_TYPES.map((f) => [f.type, f.label]),
) as Record<FieldType, string>;

export function optionKeysFor(type: FieldType): (keyof FieldOptions)[] {
  switch (type) {
    case "TEXT":
    case "TEXTAREA":
    case "RICHTEXT":
      return ["maxLength"];
    case "NUMBER":
      return ["min", "max"];
    case "SELECT":
      return ["choices"];
    case "MEDIA":
      return ["multiple"];
    case "RELATION":
      return ["multiple", "collectionId"];
    default:
      return [];
  }
}
