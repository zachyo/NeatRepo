"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultKeyboardCoordinateGetter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { Folder, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { apiSend, errorMessage } from "@/lib/api-client";
import { planFolderDrop, type DropZone } from "@/lib/folder-tree";
import { useFolders, useInvalidateRepoData } from "@/hooks/queries";
import MoveFolderDialog from "./move-folder-dialog";

export interface DashboardFolder {
  id: string;
  name: string;
  icon?: string;
  parent_id: string | null;
  position: number;
  repo_count?: number;
  is_pinned?: boolean;
  is_public?: boolean;
}

interface DropIntent {
  targetId: string;
  folderId: string | null;
  zone: DropZone;
  valid: boolean;
}

type ReorderHandler = (activeId: string, overId: string) => void;

interface DndActions {
  openMoveDialog: (folderId: string) => void;
  registerReorder: (containerId: string, handler: ReorderHandler) => () => void;
  /** True just after a drag, so the drop does not also follow a link. */
  justDragged: () => boolean;
}

const ActionsContext = createContext<DndActions | null>(null);
const DragStateContext = createContext<{
  activeType: string | null;
  intent: DropIntent | null;
}>({ activeType: null, intent: null });

export function useDndActions() {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error("useDndActions needs DashboardDndProvider");
  return actions;
}

export const useDragState = () => useContext(DragStateContext);

/** Lets a sortable list receive reorders from the shared drag context. */
export function useRegisterReorder(containerId: string, handler: ReorderHandler) {
  const { registerReorder } = useDndActions();
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(
    () => registerReorder(containerId, (a, b) => latest.current(a, b)),
    [containerId, registerReorder],
  );
}

/** Makes a folder both draggable and a drop target. */
export function useFolderDnd(
  folder: { id: string; name: string },
  context: string,
  { zones }: { zones: boolean },
) {
  const { justDragged } = useDndActions();
  const { intent } = useDragState();
  const dragId = `folder-drag:${context}:${folder.id}`;
  const dropId = `folder-target:${context}:${folder.id}`;

  const drag = useDraggable({
    id: dragId,
    data: { type: "folder", folderId: folder.id, label: folder.name },
  });
  const drop = useDroppable({
    id: dropId,
    data: { type: "folder-target", folderId: folder.id, zones },
  });

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      drag.setNodeRef(node);
      drop.setNodeRef(node);
    },
    [drag.setNodeRef, drop.setNodeRef],
  );

  return {
    setNodeRef,
    // Keyboard users move folders through the "Move to" dialog instead, so
    // the links inside stay ordinary links.
    dragProps: {
      onMouseDown: drag.listeners?.onMouseDown as React.MouseEventHandler | undefined,
      onTouchStart: drag.listeners?.onTouchStart as React.TouchEventHandler | undefined,
      onClickCapture: (event: React.MouseEvent) => {
        if (justDragged()) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
    },
    isDragging: drag.isDragging,
    intent: intent?.targetId === dropId ? intent : null,
  };
}

/** Pointer position during a drag, for mouse and touch. */
function pointerY(event: DragMoveEvent): number | null {
  const start = event.activatorEvent as MouseEvent & TouchEvent;
  const y = start.touches?.[0]?.clientY ?? start.clientY;
  return typeof y === "number" ? y + event.delta.y : null;
}

function zoneFor(event: DragMoveEvent): DropZone {
  const { over } = event;
  if (!over?.data.current?.zones) return "inside";
  const y = pointerY(event);
  if (y === null) return "inside";
  const ratio = (y - over.rect.top) / over.rect.height;
  if (ratio < 0.25) return "before";
  if (ratio > 0.75) return "after";
  return "inside";
}

const collisionDetection: CollisionDetection = (args) => {
  const isFolderTarget = (data?: { type?: string }) => data?.type === "folder-target";

  if (args.pointerCoordinates) {
    const hits = pointerWithin(args).filter((hit) =>
      isFolderTarget(hit.data?.droppableContainer?.data.current),
    );
    if (hits.length > 0) return hits;
  }

  const activeData = args.active.data.current;
  if (activeData?.type !== "repo") return [];

  // Otherwise look for a neighbor in the list being reordered, if any.
  const containerId = activeData.manual ? activeData.sortable?.containerId : null;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => {
      const data = container.data.current;
      return (
        (containerId && data?.sortable?.containerId === containerId) ||
        (!args.pointerCoordinates && isFolderTarget(data))
      );
    }),
  });
};

const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) =>
  args.context.active?.data.current?.manual
    ? sortableKeyboardCoordinates(event, args)
    : defaultKeyboardCoordinateGetter(event, args);

export function DashboardDndProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateRepoData();
  const { data } = useFolders({ queryParams: { search: "" } });
  const folders = useMemo<DashboardFolder[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [intent, setIntent] = useState<DropIntent | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string | null>(null);
  const reorderHandlers = useRef(new Map<string, ReorderHandler>());
  const lastDragEnd = useRef(0);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );

  const actions = useMemo<DndActions>(
    () => ({
      openMoveDialog: setMoveFolderId,
      registerReorder: (containerId, handler) => {
        reorderHandlers.current.set(containerId, handler);
        return () => {
          reorderHandlers.current.delete(containerId);
        };
      },
      justDragged: () => Date.now() - lastDragEnd.current < 250,
    }),
    [],
  );

  const reset = () => {
    setActiveLabel(null);
    setActiveType(null);
    setIntent(null);
    lastDragEnd.current = Date.now();
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveLabel(active.data.current?.label ?? null);
    setActiveType(active.data.current?.type ?? null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;
    if (over?.data.current?.type !== "folder-target") {
      setIntent((current) => (current ? null : current));
      return;
    }

    const folderId: string | null = over.data.current.folderId;
    // Only folders can land between siblings; repos always go inside.
    const isFolder = active.data.current?.type === "folder";
    const zone = isFolder ? zoneFor(event) : "inside";
    const valid =
      !isFolder ||
      planFolderDrop(folders, active.data.current?.folderId, folderId, zone) !== null;
    const targetId = String(over.id);

    setIntent((current) =>
      current?.targetId === targetId && current.zone === zone && current.valid === valid
        ? current
        : { targetId, folderId, zone, valid },
    );
  };

  const dropFolder = async (activeId: string, targetId: string | null, zone: DropZone) => {
    const plan = planFolderDrop(folders, activeId, targetId, zone);
    if (!plan) return;

    const previous = queryClient.getQueryData(["folders"]);
    queryClient.setQueryData(["folders"], (current: DashboardFolder[] | undefined) =>
      current?.map((folder) => {
        const order = plan.orderedIds?.indexOf(folder.id) ?? -1;
        return {
          ...folder,
          parent_id: folder.id === activeId ? plan.parentId : folder.parent_id,
          position: order >= 0 ? order + 1 : folder.position,
        };
      }),
    );

    try {
      const active = folders.find((folder) => folder.id === activeId);
      if ((active?.parent_id ?? null) !== plan.parentId) {
        await apiSend(`/api/folders/${activeId}`, "PUT", { parent_id: plan.parentId });
      }
      if (plan.orderedIds) {
        await apiSend("/api/folders/order", "PUT", {
          parent_id: plan.parentId,
          folderIds: plan.orderedIds,
        });
      }
    } catch (error) {
      queryClient.setQueryData(["folders"], previous);
      toast.error(errorMessage(error));
    } finally {
      invalidate();
    }
  };

  const dropRepos = async (repoIds: string[], folderId: string) => {
    const folderName = folders.find((folder) => folder.id === folderId)?.name ?? "folder";
    try {
      const { added } = await apiSend<{ added: number }>(
        `/api/folders/${folderId}/repos`,
        "POST",
        { repoIds },
      );
      toast.success(
        added === 0
          ? `Already in ${folderName}`
          : `Added ${added} ${added === 1 ? "repository" : "repositories"} to ${folderName}`,
      );
      invalidate();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;
    const overData = over?.data.current;
    const finalIntent = intent;
    reset();

    if (!over || !activeData) return;

    if (overData?.type === "folder-target") {
      if (activeData.type === "repo" && overData.folderId) {
        dropRepos(activeData.repoIds, overData.folderId);
      } else if (activeData.type === "folder") {
        const zone =
          finalIntent && finalIntent.targetId === over.id ? finalIntent.zone : "inside";
        const current = folders.find((folder) => folder.id === activeData.folderId);
        const unchanged =
          overData.folderId === activeData.folderId ||
          (zone === "inside" && (current?.parent_id ?? null) === overData.folderId);
        if (unchanged) return;

        if (!planFolderDrop(folders, activeData.folderId, overData.folderId, zone)) {
          toast.error("That folder can't be moved there");
          return;
        }
        dropFolder(activeData.folderId, overData.folderId, zone);
      }
      return;
    }

    const containerId = activeData.sortable?.containerId;
    if (
      activeData.manual &&
      containerId &&
      overData?.sortable?.containerId === containerId &&
      active.id !== over.id
    ) {
      reorderHandlers.current.get(containerId)?.(String(active.id), String(over.id));
    }
  };

  const dragState = useMemo(() => ({ activeType, intent }), [activeType, intent]);

  return (
    <ActionsContext.Provider value={actions}>
      <DragStateContext.Provider value={dragState}>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={reset}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => `Picked up ${active.data.current?.label}.`,
              onDragOver: ({ active, over }) =>
                over
                  ? `${active.data.current?.label} is over ${over.data.current?.label ?? "a drop target"}.`
                  : `${active.data.current?.label} is not over a drop target.`,
              onDragEnd: ({ active, over }) =>
                over
                  ? `Dropped ${active.data.current?.label}.`
                  : `${active.data.current?.label} was returned to its place.`,
              onDragCancel: ({ active }) =>
                `Cancelled. ${active.data.current?.label} was returned to its place.`,
            },
          }}
        >
          {children}
          <DragOverlay dropAnimation={null}>
            {activeLabel && (
              <div className="inline-flex max-w-64 cursor-grabbing items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-lg">
                {activeType === "folder" ? (
                  <Folder className="size-4 shrink-0 text-blue-600" />
                ) : (
                  <GitBranch className="size-4 shrink-0 text-gray-500" />
                )}
                <span className="truncate">{activeLabel}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <MoveFolderDialog
          folderId={moveFolderId}
          folders={folders}
          onClose={() => setMoveFolderId(null)}
        />
      </DragStateContext.Provider>
    </ActionsContext.Provider>
  );
}
