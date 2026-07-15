"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCollection,
  useCreateField,
  useDeleteField,
  useUpdateField,
} from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  Spinner,
} from "@/components/ui/feedback";
import {
  FieldFormModal,
  type FieldDraft,
} from "@/components/collections/field-form-modal";
import { FIELD_TYPE_LABEL } from "@/lib/field-types";
import type { Field } from "@/lib/api/types";

export function CollectionBuilderSection({
  websiteId,
  collectionId,
}: {
  websiteId: string;
  collectionId: string;
}) {
  const { data, isLoading, error } = useCollection(websiteId, collectionId);
  const { can } = useCan(websiteId);
  const createField = useCreateField(websiteId, collectionId);
  const updateField = useUpdateField(websiteId, collectionId);
  const deleteField = useDeleteField(websiteId, collectionId);

  const [editing, setEditing] = useState<Field | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const manage = can("collections.manage");

  const sorted = useMemo(
    () => [...(data?.fields ?? [])].sort((a, b) => a.order - b.order),
    [data?.fields],
  );

  /**
   * Fields have no bulk reorder endpoint (unlike menu items), so each field
   * whose index actually moved is PATCHed individually.
   */
  const persistOrder = async (next: Field[]) => {
    setReordering(true);
    try {
      await Promise.all(
        next
          .map((field, index) => ({ field, index }))
          .filter(({ field, index }) => field.order !== index)
          .map(({ field, index }) =>
            updateField.mutateAsync({ fieldId: field.id, order: index }),
          ),
      );
    } finally {
      setReordering(false);
    }
  };

  const submitField = async (draft: FieldDraft) => {
    if (editing) {
      await updateField.mutateAsync({ fieldId: editing.id, ...draft });
    } else {
      await createField.mutateAsync({ ...draft, order: sorted.length });
    }
    setModalOpen(false);
    setEditing(null);
  };

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">{data.name}</h2>
          <p className="font-mono text-xs text-muted">{data.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {reordering && <Spinner />}
          <Link href={`/websites/${websiteId}/collections/${collectionId}/entries`}>
            <Button variant="secondary">Lihat entries</Button>
          </Link>
          {manage && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Field baru
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field</CardTitle>
          {manage && sorted.length > 1 && (
            <span className="text-xs text-muted">
              Seret untuk mengubah urutan form editor
            </span>
          )}
        </CardHeader>
        <CardBody className="space-y-2">
          {updateField.error && <ErrorBlock error={updateField.error} />}
          {deleteField.error && <ErrorBlock error={deleteField.error} />}

          {sorted.length === 0 && (
            <EmptyState
              title="Belum ada field"
              description="Field menentukan form yang dipakai untuk mengisi entry."
            />
          )}

          <SortableFieldList
            // Remounting on the server's order resets the local drag state to
            // whatever actually persisted, so a failed PATCH cannot leave the
            // list showing an order the database never accepted.
            key={sorted.map((f) => f.id).join(",")}
            fields={sorted}
            canManage={manage}
            onReorder={persistOrder}
            onEdit={(field) => {
              setEditing(field);
              setModalOpen(true);
            }}
            onDelete={(field) => {
              if (
                confirm(
                  `Hapus field "${field.name}"? Nilai "${field.key}" pada entry yang sudah ada tidak ikut terhapus, tapi berhenti divalidasi.`,
                )
              ) {
                deleteField.mutate(field.id);
              }
            }}
          />
        </CardBody>
      </Card>

      {modalOpen && (
        <FieldFormModal
          // Remounts per field, so the draft initialises from the right one.
          key={editing?.id ?? "new"}
          websiteId={websiteId}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={submitField}
          editing={editing}
          pending={createField.isPending || updateField.isPending}
          error={createField.error ?? updateField.error}
        />
      )}
    </div>
  );
}

/**
 * Owns the drag order locally so a drop lands instantly instead of waiting on
 * the round-trip. Seeded from the server list at mount; the parent's `key`
 * re-seeds it whenever that list changes.
 */
function SortableFieldList({
  fields,
  canManage,
  onReorder,
  onEdit,
  onDelete,
}: {
  fields: Field[];
  canManage: boolean;
  onReorder: (next: Field[]) => Promise<void>;
  onEdit: (field: Field) => void;
  onDelete: (field: Field) => void;
}) {
  const [order, setOrder] = useState(fields);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Without a small threshold, a click on Edit/Delete registers as a drag
      // and the button never fires.
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = order.findIndex((f) => f.id === active.id);
    const to = order.findIndex((f) => f.id === over.id);
    const next = arrayMove(order, from, to);
    setOrder(next);
    void onReorder(next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={order.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {order.map((field) => (
          <SortableFieldRow
            key={field.id}
            field={field}
            canManage={canManage}
            onEdit={() => onEdit(field)}
            onDelete={() => onDelete(field)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableFieldRow({
  field,
  canManage,
  onEdit,
  onDelete,
}: {
  field: Field;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id, disabled: !canManage });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 ${
        isDragging ? "z-10 shadow-lg" : ""
      }`}
    >
      {canManage && (
        <button
          type="button"
          className="cursor-grab text-faint hover:text-slate-600 active:cursor-grabbing"
          aria-label={`Ubah urutan ${field.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{field.name}</span>
          {field.required && <Badge tone="warning">wajib</Badge>}
        </div>
        <span className="font-mono text-xs text-muted">{field.key}</span>
      </div>

      {/* Violet is the category accent in design.md: it reads as "what kind of
          field", kept distinct from the status colours used elsewhere. */}
      <Badge tone="violet">{FIELD_TYPE_LABEL[field.type]}</Badge>

      {canManage && (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit field">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Hapus field"
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      )}
    </div>
  );
}
