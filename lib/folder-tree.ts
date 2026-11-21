/** Must match max_depth in the folders_validate_parent database trigger. */
export const MAX_FOLDER_DEPTH = 5;

export interface FolderLike {
  id: string;
  parent_id?: string | null;
  position?: number | null;
}

export type TreeNode<T> = T & { children: TreeNode<T>[]; depth: number };

function byPosition(a: FolderLike, b: FolderLike) {
  return (a.position ?? 0) - (b.position ?? 0);
}

/**
 * Builds a sorted tree from a flat list. A folder whose parent is not in the
 * list becomes a root, so partial lists still render every folder.
 */
export function buildTree<T extends FolderLike>(folders: T[]): TreeNode<T>[] {
  const ids = new Set(folders.map((f) => f.id));
  const childrenOf = new Map<string | null, T[]>();

  for (const folder of folders) {
    const parent =
      folder.parent_id && ids.has(folder.parent_id) ? folder.parent_id : null;
    const siblings = childrenOf.get(parent);
    if (siblings) siblings.push(folder);
    else childrenOf.set(parent, [folder]);
  }

  const visit = (parent: string | null, depth: number): TreeNode<T>[] =>
    [...(childrenOf.get(parent) ?? [])].sort(byPosition).map((folder) => ({
      ...folder,
      depth,
      children: visit(folder.id, depth + 1),
    }));

  return visit(null, 0);
}

/** Depth-first list of a tree, for indented pickers. */
export function flattenTree<T>(nodes: TreeNode<T>[]): TreeNode<T>[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

/** Ancestors of a folder, outermost first, excluding the folder itself. */
export function getAncestors<T extends FolderLike>(folders: T[], id: string): T[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const ancestors: T[] = [];
  const seen = new Set([id]);
  let parentId = byId.get(id)?.parent_id ?? null;

  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    seen.add(parentId);
    parentId = parent.parent_id ?? null;
  }
  return ancestors;
}

/** Ids of every folder nested below the given folder. */
export function getDescendantIds<T extends FolderLike>(
  folders: T[],
  id: string,
): Set<string> {
  const descendants = new Set<string>();
  const pending = [id];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const folder of folders) {
      if (
        folder.parent_id === current &&
        folder.id !== id &&
        !descendants.has(folder.id)
      ) {
        descendants.add(folder.id);
        pending.push(folder.id);
      }
    }
  }
  return descendants;
}

/** Levels occupied by a folder and everything below it (a leaf is 1). */
export function getSubtreeHeight<T extends FolderLike>(folders: T[], id: string): number {
  const height = (current: string, seen: Set<string>): number => {
    const children = folders.filter(
      (f) => f.parent_id === current && !seen.has(f.id),
    );
    if (children.length === 0) return 1;
    const next = new Set(seen).add(current);
    return 1 + Math.max(...children.map((c) => height(c.id, next)));
  };
  return height(id, new Set([id]));
}

/** Level of a folder, where a top-level folder is 1. */
export function getDepth<T extends FolderLike>(folders: T[], id: string): number {
  return getAncestors(folders, id).length + 1;
}

/** True when `id` could be moved under `parentId` (null means top level). */
export function canMoveFolder<T extends FolderLike>(
  folders: T[],
  id: string,
  parentId: string | null,
): boolean {
  if (parentId === null) return true;
  if (parentId === id || getDescendantIds(folders, id).has(parentId)) return false;
  return getDepth(folders, parentId) + getSubtreeHeight(folders, id) <= MAX_FOLDER_DEPTH;
}

export type DropZone = "before" | "inside" | "after";

export interface FolderDropPlan {
  parentId: string | null;
  /** New sibling order, or null when only the parent changes. */
  orderedIds: string[] | null;
}

/**
 * Works out what dropping a folder onto a target means. `targetId` null is the
 * top level. Returns null when the drop is invalid or changes nothing.
 */
export function planFolderDrop<T extends FolderLike>(
  folders: T[],
  activeId: string,
  targetId: string | null,
  zone: DropZone,
): FolderDropPlan | null {
  const active = folders.find((f) => f.id === activeId);
  if (!active || activeId === targetId) return null;

  const currentParent = active.parent_id ?? null;

  if (zone === "inside" || targetId === null) {
    if (currentParent === targetId || !canMoveFolder(folders, activeId, targetId)) {
      return null;
    }
    return { parentId: targetId, orderedIds: null };
  }

  const target = folders.find((f) => f.id === targetId);
  if (!target) return null;

  const parentId = target.parent_id ?? null;
  if (!canMoveFolder(folders, activeId, parentId)) return null;

  const siblings = folders
    .filter((f) => (f.parent_id ?? null) === parentId && f.id !== activeId)
    .sort(byPosition)
    .map((f) => f.id);
  const targetIndex = siblings.indexOf(targetId);
  siblings.splice(zone === "before" ? targetIndex : targetIndex + 1, 0, activeId);

  return { parentId, orderedIds: siblings };
}

/** A folder is public only when it and all of its ancestors are public. */
export function isPubliclyVisible<T extends FolderLike & { is_public?: boolean }>(
  folders: T[],
  id: string,
): boolean {
  const folder = folders.find((f) => f.id === id);
  if (!folder?.is_public) return false;
  return getAncestors(folders, id).every((a) => a.is_public);
}
