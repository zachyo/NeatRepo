"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, CornerLeftUp, Folder, FolderInput } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { buildTree, getAncestors, type TreeNode } from "@/lib/folder-tree";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/queries";
import {
  useDndActions,
  useDragState,
  useFolderDnd,
  type DashboardFolder,
} from "./dnd-provider";

const STORAGE_KEY = "neatrepo:expanded-folders";

function readExpanded(): string[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function TreeItem({
  node,
  activeId,
  expanded,
  onToggle,
  onNavigate,
}: {
  node: TreeNode<DashboardFolder>;
  activeId: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onNavigate?: () => void;
}) {
  const { openMoveDialog } = useDndActions();
  const { setNodeRef, dragProps, isDragging, intent } = useFolderDnd(node, "tree", {
    zones: true,
  });
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const active = node.id === activeId;
  const showInside = intent?.valid && intent.zone === "inside";

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            {...dragProps}
            style={{ paddingLeft: `${node.depth * 0.75}rem` }}
            className={cn(
              "group relative flex items-center rounded-lg transition-colors",
              active ? "bg-blue-50" : "hover:bg-gray-100",
              isDragging && "opacity-40",
              showInside && "bg-blue-100 ring-2 ring-inset ring-blue-500",
              intent && !intent.valid && "bg-red-50",
            )}
          >
            {intent?.valid && intent.zone !== "inside" && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-blue-500",
                  intent.zone === "before" ? "top-0" : "bottom-0",
                )}
              />
            )}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ChevronRight
                  className={cn("size-3.5 transition-transform", isOpen && "rotate-90")}
                />
              </button>
            ) : (
              <span aria-hidden className="size-7 shrink-0" />
            )}
            <Link
              href={`/dashboard/folders/${node.id}`}
              draggable={false}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                active ? "font-medium text-blue-700" : "text-gray-600 group-hover:text-gray-900",
              )}
            >
              <Folder
                className={cn("size-3.5 shrink-0", active ? "text-blue-600" : "text-gray-400")}
              />
              <span className="truncate">{node.name}</span>
            </Link>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-44">
          <ContextMenuItem onSelect={() => openMoveDialog(node.id)}>
            <FolderInput className="mr-2 size-4" />
            Move to…
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              activeId={activeId}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Drop here to take a folder out of its parent. Shown only while dragging one. */
function TopLevelDropZone() {
  const { activeType, intent } = useDragState();
  const { setNodeRef } = useDroppable({
    id: "folder-target:root",
    data: { type: "folder-target", folderId: null, zones: false, label: "Top level" },
    disabled: activeType !== "folder",
  });

  if (activeType !== "folder") return null;
  const over = intent?.targetId === "folder-target:root" && intent.valid;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-1 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs",
        over ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-500",
      )}
    >
      <CornerLeftUp className="size-3.5" />
      Move to top level
    </div>
  );
}

export default function FolderTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data } = useFolders({ queryParams: { search: "" } });
  const folders = useMemo<DashboardFolder[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );
  const tree = useMemo(() => buildTree(folders), [folders]);
  const activeId = pathname.match(/^\/dashboard\/folders\/([^/]+)/)?.[1] ?? null;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpanded(new Set(readExpanded()));
  }, []);

  // Keep the open folder visible in the tree.
  useEffect(() => {
    if (!activeId) return;
    const ancestors = getAncestors(folders, activeId);
    if (ancestors.length === 0) return;
    setExpanded((current) =>
      ancestors.every((a) => current.has(a.id))
        ? current
        : new Set([...current, ...ancestors.map((a) => a.id)]),
    );
  }, [activeId, folders]);

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Storage can be blocked; expansion still works for this visit.
      }
      return next;
    });
  };

  if (tree.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="px-3 pb-1 text-xs font-medium text-gray-500">Your folders</p>
      <ul aria-label="Folders">
        {tree.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            activeId={activeId}
            expanded={expanded}
            onToggle={toggle}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      <TopLevelDropZone />
    </div>
  );
}
