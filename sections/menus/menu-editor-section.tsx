"use client";

import { useState } from "react";
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
import {
  ChevronLeft,
  ExternalLink,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useAddMenuItem,
  useDeleteMenuItem,
  useMenu,
  useReorderMenu,
  useUpdateMenuItem,
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
import { MenuItemModal } from "@/components/menus/menu-item-modal";
import type {
  MenuDetail,
  MenuItemInput,
  MenuItemNode,
  ReorderMenuItem,
} from "@/lib/api/types";

export function MenuEditorSection({
  websiteId,
  menuId,
}: {
  websiteId: string;
  menuId: string;
}) {
  const { data, isLoading, error } = useMenu(websiteId, menuId);

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <MenuTreeEditor
      // Re-seeds the local drag state whenever the server tree changes.
      key={JSON.stringify(data.items.map((i) => i.id))}
      websiteId={websiteId}
      menu={data}
    />
  );
}

function MenuTreeEditor({
  websiteId,
  menu,
}: {
  websiteId: string;
  menu: MenuDetail;
}) {
  const { can } = useCan(websiteId);
  const addItem = useAddMenuItem(websiteId, menu.id);
  const updateItem = useUpdateMenuItem(websiteId, menu.id);
  const deleteItem = useDeleteMenuItem(websiteId, menu.id);
  const reorder = useReorderMenu(websiteId, menu.id);

  const [tree, setTree] = useState<MenuItemNode[]>(menu.items);
  const [editing, setEditing] = useState<MenuItemNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const manage = can("menus.manage");

  /**
   * Menus have a whole-tree reorder endpoint, so one drag is one PUT — unlike
   * collection fields, which have to be PATCHed one by one.
   */
  const persist = (next: MenuItemNode[]) => {
    setTree(next);
    reorder.mutate(flatten(next));
  };

  const submitItem = async (input: MenuItemInput) => {
    if (editing) await updateItem.mutateAsync({ itemId: editing.id, ...input });
    else await addItem.mutateAsync(input);
    setModalOpen(false);
    setEditing(null);
  };

  const mutationError =
    addItem.error ?? updateItem.error ?? deleteItem.error ?? reorder.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/websites/${websiteId}/menus`}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-700"
          >
            <ChevronLeft className="h-3 w-3" />
            Semua menu
          </Link>
          <h2 className="mt-1 font-medium">{menu.name}</h2>
          <p className="font-mono text-xs text-muted">{menu.slug}</p>
        </div>

        <div className="flex items-center gap-2">
          {reorder.isPending && <Spinner />}
          {manage && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Item baru
            </Button>
          )}
        </div>
      </div>

      {mutationError != null && <ErrorBlock error={mutationError} />}

      <Card>
        <CardHeader>
          <CardTitle>Struktur menu</CardTitle>
          {manage && tree.length > 0 && (
            <span className="text-xs text-muted">
              Seret untuk mengurutkan; pindah induk lewat tombol edit
            </span>
          )}
        </CardHeader>
        <CardBody className="space-y-2">
          {tree.length === 0 && (
            <EmptyState
              title="Menu masih kosong"
              description="Tambahkan item untuk menyusun navigasi."
            />
          )}

          <TreeLevel
            nodes={tree}
            depth={0}
            canManage={manage}
            onReorder={(siblings) => persist(replaceLevel(tree, siblings, null))}
            onEdit={(node) => {
              setEditing(node);
              setModalOpen(true);
            }}
            onDelete={(node) => {
              const count = countDescendants(node);
              if (
                confirm(
                  count > 0
                    ? `Hapus "${node.label}" beserta ${count} sub-item di bawahnya?`
                    : `Hapus item "${node.label}"?`,
                )
              ) {
                deleteItem.mutate(node.id);
              }
            }}
            onReorderChildren={(parentId, siblings) =>
              persist(replaceLevel(tree, siblings, parentId))
            }
          />
        </CardBody>
      </Card>

      {modalOpen && (
        <MenuItemModal
          key={editing?.id ?? "new"}
          websiteId={websiteId}
          editing={editing}
          // Offering an item its own descendant as parent would create a cycle;
          // the backend rejects it, so never present it.
          parentOptions={parentOptions(tree, editing?.id)}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={submitItem}
          pending={addItem.isPending || updateItem.isPending}
          error={addItem.error ?? updateItem.error}
        />
      )}
    </div>
  );
}

/**
 * One DndContext per sibling group: dragging reorders within a level only.
 * Changing an item's parent is an explicit edit rather than a drop target —
 * cross-level dragging is easy to do badly and easy to trigger by accident.
 */
function TreeLevel({
  nodes,
  depth,
  canManage,
  onReorder,
  onReorderChildren,
  onEdit,
  onDelete,
}: {
  nodes: MenuItemNode[];
  depth: number;
  canManage: boolean;
  onReorder: (siblings: MenuItemNode[]) => void;
  onReorderChildren: (parentId: string, siblings: MenuItemNode[]) => void;
  onEdit: (node: MenuItemNode) => void;
  onDelete: (node: MenuItemNode) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = nodes.findIndex((n) => n.id === active.id);
    const to = nodes.findIndex((n) => n.id === over.id);
    onReorder(arrayMove(nodes, from, to));
  };

  if (nodes.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={nodes.map((n) => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {nodes.map((node) => (
            <div key={node.id}>
              <SortableItemRow
                node={node}
                depth={depth}
                canManage={canManage}
                onEdit={() => onEdit(node)}
                onDelete={() => onDelete(node)}
              />
              {node.children.length > 0 && (
                <div className="mt-2 space-y-2 pl-6">
                  <TreeLevel
                    nodes={node.children}
                    depth={depth + 1}
                    canManage={canManage}
                    onReorder={(siblings) => onReorderChildren(node.id, siblings)}
                    onReorderChildren={onReorderChildren}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItemRow({
  node,
  depth,
  canManage,
  onEdit,
  onDelete,
}: {
  node: MenuItemNode;
  depth: number;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id, disabled: !canManage });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 ${
        isDragging ? "z-10 shadow-pop" : ""
      }`}
    >
      {canManage && (
        <button
          type="button"
          className="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
          aria-label={`Ubah urutan ${node.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{node.label}</span>
        <span className="ml-2 font-mono text-xs text-muted">
          {node.pageId ? "page" : node.url ? node.url : "—"}
        </span>
      </div>

      {node.pageId && (
        <Badge tone="primary">
          <FileText className="mr-1 h-3 w-3" />
          Page
        </Badge>
      )}
      {node.target === "_blank" && (
        <Badge tone="slate">
          <ExternalLink className="mr-1 h-3 w-3" />
          Tab baru
        </Badge>
      )}
      {depth > 0 && <Badge tone="slate">sub</Badge>}

      {canManage && (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit item">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Hapus item"
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Flattens the tree into the {id, parentId, order} payload reorder expects. */
function flatten(
  nodes: MenuItemNode[],
  parentId: string | null = null,
  acc: ReorderMenuItem[] = [],
): ReorderMenuItem[] {
  nodes.forEach((node, index) => {
    acc.push({ id: node.id, parentId, order: index });
    flatten(node.children, node.id, acc);
  });
  return acc;
}

/** Swaps one sibling group in the tree, leaving every other level untouched. */
function replaceLevel(
  nodes: MenuItemNode[],
  siblings: MenuItemNode[],
  parentId: string | null,
): MenuItemNode[] {
  if (parentId === null) return siblings;
  return nodes.map((node) =>
    node.id === parentId
      ? { ...node, children: siblings }
      : { ...node, children: replaceLevel(node.children, siblings, parentId) },
  );
}

/** Every item except `excludeId` and its descendants — anything else cycles. */
function parentOptions(
  nodes: MenuItemNode[],
  excludeId?: string,
  depth = 0,
): { id: string; label: string; depth: number }[] {
  const out: { id: string; label: string; depth: number }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    out.push({ id: node.id, label: node.label, depth });
    out.push(...parentOptions(node.children, excludeId, depth + 1));
  }
  return out;
}

function countDescendants(node: MenuItemNode): number {
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0,
  );
}
