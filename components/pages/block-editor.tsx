"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import type { PageBlock } from "@/lib/api/types";

/**
 * Blocks are opaque to the CMS — it only guarantees a `type`, and `props` are
 * free-form so the frontend can add block types without a backend change.
 * A per-type form is therefore impossible here: the editor offers a type name
 * and a JSON props editor, which is exactly the contract the API defines.
 *
 * Each block gets a client-side id purely so drag-and-drop has a stable key;
 * blocks have no identity of their own in the database (they live inside one
 * JSON column), and array index would break the moment two blocks swap.
 */
export interface BlockDraft extends PageBlock {
  _id: string;
}

export function toDrafts(blocks: PageBlock[] | undefined): BlockDraft[] {
  return (blocks ?? []).map((block, i) => ({
    ...block,
    _id: `${i}-${Math.random().toString(36).slice(2, 9)}`,
  }));
}

/** Strips the client-side id — the API only knows `type` and `props`. */
export function fromDrafts(drafts: BlockDraft[]): PageBlock[] {
  return drafts.map((draft) => ({ type: draft.type, props: draft.props }));
}

export function BlockEditor({
  blocks,
  onChange,
  disabled,
}: {
  blocks: BlockDraft[];
  onChange: (next: BlockDraft[]) => void;
  disabled?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Without a threshold, clicking a field inside a block starts a drag.
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b._id === active.id);
    const to = blocks.findIndex((b) => b._id === over.id);
    onChange(arrayMove(blocks, from, to));
  };

  const update = (id: string, patch: Partial<BlockDraft>) =>
    onChange(blocks.map((b) => (b._id === id ? { ...b, ...patch } : b)));

  const add = () =>
    onChange([
      ...blocks,
      { _id: Math.random().toString(36).slice(2, 9), type: "", props: {} },
    ]);

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <EmptyState
          title="Belum ada block"
          description="Block adalah potongan konten yang dirender frontend Anda, misalnya hero atau cta."
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b._id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block, index) => (
            <SortableBlock
              key={block._id}
              block={block}
              index={index}
              disabled={disabled}
              onChange={(patch) => update(block._id, patch)}
              onRemove={() =>
                onChange(blocks.filter((b) => b._id !== block._id))
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      {!disabled && (
        <Button variant="secondary" onClick={add} className="w-full">
          <Plus className="h-4 w-4" />
          Tambah block
        </Button>
      )}
    </div>
  );
}

function SortableBlock({
  block,
  index,
  disabled,
  onChange,
  onRemove,
}: {
  block: BlockDraft;
  index: number;
  disabled?: boolean;
  onChange: (patch: Partial<BlockDraft>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block._id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-border bg-surface ${
        isDragging ? "z-10 shadow-pop" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {!disabled && (
          <button
            type="button"
            className="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
            aria-label={`Ubah urutan block ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup block" : "Buka block"}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <span className="w-6 text-xs text-faint tabular-nums">{index + 1}</span>

        <Input
          className="h-8 max-w-[220px] font-mono text-xs"
          placeholder="tipe block, mis. hero"
          value={block.type}
          disabled={disabled}
          onChange={(e) => onChange({ type: e.target.value })}
        />

        <span className="ml-auto text-xs text-muted">
          {Object.keys(block.props ?? {}).length} props
        </span>

        {!disabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Hapus block ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        )}
      </div>

      {open && (
        <div className="space-y-1.5 border-t border-border px-3 py-3">
          <Label htmlFor={`props-${block._id}`}>Props (JSON)</Label>
          <Textarea
            id={`props-${block._id}`}
            className="font-mono text-xs"
            disabled={disabled}
            defaultValue={JSON.stringify(block.props ?? {}, null, 2)}
            // Parsed on blur, not per keystroke: half-typed JSON is invalid
            // JSON, and reformatting mid-edit fights the typist.
            onBlur={(e) => {
              const text = e.target.value.trim();
              if (!text) {
                setJsonError(null);
                return onChange({ props: {} });
              }
              try {
                const parsed: unknown = JSON.parse(text);
                if (
                  typeof parsed !== "object" ||
                  parsed === null ||
                  Array.isArray(parsed)
                ) {
                  // The API requires props to be an object (@IsObject).
                  setJsonError("Props harus berupa object JSON, bukan array atau nilai tunggal");
                  return;
                }
                setJsonError(null);
                onChange({ props: parsed as Record<string, unknown> });
              } catch {
                setJsonError("JSON tidak valid — perubahan terakhir tidak disimpan");
              }
            }}
          />
          {jsonError && <p className="text-xs text-danger">{jsonError}</p>}
        </div>
      )}
    </div>
  );
}
