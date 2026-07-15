"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { FIELD_TYPES } from "@/lib/field-types";
import type { FieldType, FormField } from "@/lib/api/types";

/**
 * Form fields have the same shape as collection fields — the backend reuses
 * EntryValidator for both — so this reuses FIELD_TYPES rather than inventing a
 * second list that could drift.
 *
 * Unlike collection fields, these live inside one JSON column and have no ids,
 * so the drag key is the field `key`, which the backend already requires to be
 * unique-ish and stable.
 */
export function FormFieldEditor({
  fields,
  onChange,
  disabled,
}: {
  fields: FormField[];
  onChange: (next: FormField[]) => void;
  disabled?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.key === active.id);
    const to = fields.findIndex((f) => f.key === over.id);
    onChange(arrayMove(fields, from, to));
  };

  const update = (key: string, patch: Partial<FormField>) =>
    onChange(fields.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  const add = () => {
    // Keys are the identity here, so a new one must not collide with an
    // existing field or the drag keys (and the stored data) would clash.
    let index = fields.length + 1;
    while (fields.some((f) => f.key === `field_${index}`)) index++;
    onChange([
      ...fields,
      { key: `field_${index}`, name: "", type: "TEXT", required: false },
    ]);
  };

  return (
    <div className="space-y-2">
      {fields.length === 0 && (
        <EmptyState
          title="Belum ada field"
          description="Form wajib punya minimal satu field."
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.key)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field) => (
            <SortableFormField
              key={field.key}
              field={field}
              disabled={disabled}
              duplicateKey={
                fields.filter((f) => f.key === field.key).length > 1
              }
              onChange={(patch) => update(field.key, patch)}
              onRemove={() => onChange(fields.filter((f) => f.key !== field.key))}
            />
          ))}
        </SortableContext>
      </DndContext>

      {!disabled && (
        <Button variant="secondary" onClick={add} className="w-full">
          <Plus className="h-4 w-4" />
          Tambah field
        </Button>
      )}
    </div>
  );
}

function SortableFormField({
  field,
  disabled,
  duplicateKey,
  onChange,
  onRemove,
}: {
  field: FormField;
  disabled?: boolean;
  duplicateKey: boolean;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key, disabled });

  const showChoices = field.type === "SELECT";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`space-y-2 rounded-lg border border-border bg-surface p-3 ${
        isDragging ? "z-10 shadow-pop" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {!disabled && (
          <button
            type="button"
            className="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
            aria-label={`Ubah urutan ${field.name || field.key}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <Input
          className="h-8 flex-1"
          placeholder="Label, mis. Email"
          value={field.name}
          disabled={disabled}
          onChange={(e) => onChange({ name: e.target.value })}
        />

        <Input
          className="h-8 w-36 font-mono text-xs"
          placeholder="key"
          value={field.key}
          disabled={disabled}
          aria-invalid={duplicateKey}
          onChange={(e) => onChange({ key: e.target.value })}
        />

        <Select
          className="h-8 w-36"
          value={field.type}
          disabled={disabled}
          onChange={(e) => onChange({ type: e.target.value as FieldType })}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </Select>

        <label className="flex shrink-0 items-center gap-1.5 text-xs">
          <Checkbox
            checked={field.required ?? false}
            disabled={disabled}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          wajib
        </label>

        {!disabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Hapus ${field.name || field.key}`}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        )}
      </div>

      {duplicateKey && (
        <p className="text-xs text-danger">
          Key ini dipakai lebih dari sekali — nilai submission akan saling
          menimpa.
        </p>
      )}

      {showChoices && (
        <Input
          className="h-8 font-mono text-xs"
          placeholder="Pilihan dipisah koma, mis. umum, kerjasama"
          value={(field.options?.choices ?? []).join(", ")}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              options: {
                ...field.options,
                choices: e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      )}
    </div>
  );
}
