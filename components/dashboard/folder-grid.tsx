"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Edit2,
  FolderInput,
  GitBranch,
  Globe,
  Lock,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import folderIcon from "@/public/folder.svg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { apiSend, errorMessage } from "@/lib/api-client";
import { getAncestors } from "@/lib/folder-tree";
import { cn } from "@/lib/utils";
import { useFolders, useInvalidateRepoData } from "@/hooks/queries";
import EditFolderDialog from "./edit-folder-dialog";
import {
  useDndActions,
  useFolderDnd,
  type DashboardFolder,
} from "./dnd-provider";

const actionClass =
  "rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900";

function FolderCard({
  folder,
  path,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  folder: DashboardFolder;
  path?: string;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const { openMoveDialog } = useDndActions();
  const { setNodeRef, dragProps, isDragging, intent } = useFolderDnd(folder, "grid", {
    zones: false,
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          {...dragProps}
          className={cn(
            "group relative rounded-xl transition-shadow",
            isDragging && "opacity-40",
            intent?.valid && "ring-2 ring-blue-500",
            intent && !intent.valid && "ring-2 ring-red-300",
          )}
        >
          <Link
            href={`/dashboard/folders/${folder.id}`}
            draggable={false}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Card className="h-full cursor-pointer rounded-xl border-none bg-transparent pb-4 shadow-none transition-colors hover:bg-white">
              <div className="relative">
                <Image
                  src={folderIcon}
                  alt=""
                  draggable={false}
                  className="h-28 w-28 md:h-48 md:w-48"
                />
                <div className="absolute right-4 top-9 flex items-center gap-1 text-xs tabular-nums text-gray-700 md:right-7 md:top-14 md:text-sm">
                  <GitBranch className="h-3.5 w-3.5 flex-shrink-0 md:h-4 md:w-4" />
                  <span>{folder.repo_count || 0}</span>
                </div>
                {folder.is_pinned && (
                  <div
                    aria-label="Pinned"
                    className="absolute left-2 top-2 rounded-md bg-white/90 p-1.5 text-amber-500 shadow-sm"
                  >
                    <Pin className="size-4 fill-current" />
                  </div>
                )}
              </div>
              <h3 className="-mt-3 flex max-w-28 items-center justify-center gap-1.5 text-center text-sm font-semibold text-gray-900 transition group-hover:text-blue-600 md:-mt-6 md:max-w-48 md:text-lg">
                {folder.is_public ? (
                  <Globe
                    className="h-3.5 w-3.5 flex-shrink-0 text-gray-400"
                    aria-label="Public folder"
                  />
                ) : (
                  <Lock
                    className="h-3.5 w-3.5 flex-shrink-0 text-gray-400"
                    aria-label="Private folder"
                  />
                )}
                <span className="truncate">{folder.name}</span>
              </h3>
              {path && (
                <p className="mx-auto mt-0.5 max-w-28 truncate text-center text-xs text-gray-500 md:max-w-48">
                  {path}
                </p>
              )}
            </Card>
          </Link>

          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={onTogglePin}
              aria-label={folder.is_pinned ? `Unpin ${folder.name}` : `Pin ${folder.name}`}
              aria-pressed={!!folder.is_pinned}
              title={folder.is_pinned ? "Unpin folder" : "Pin folder"}
              className={cn(actionClass, folder.is_pinned && "text-amber-500")}
            >
              {folder.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => openMoveDialog(folder.id)}
              aria-label={`Move ${folder.name}`}
              title="Move folder"
              className={actionClass}
            >
              <FolderInput className="size-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${folder.name}`}
              title="Edit folder"
              className={actionClass}
            >
              <Edit2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${folder.name}`}
              title="Delete folder"
              className={cn(actionClass, "hover:border-red-200 hover:bg-red-50 hover:text-red-600")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem onSelect={() => openMoveDialog(folder.id)}>
          <FolderInput className="mr-2 size-4" />
          Move to…
        </ContextMenuItem>
        <ContextMenuItem onSelect={onEdit}>
          <Edit2 className="mr-2 size-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onSelect={onTogglePin}>
          <Pin className="mr-2 size-4" />
          {folder.is_pinned ? "Unpin" : "Pin"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** Folder cards with their pin, move, edit and delete actions. */
export default function FolderGrid({
  folders,
  showPaths = false,
}: {
  folders: DashboardFolder[];
  showPaths?: boolean;
}) {
  const invalidate = useInvalidateRepoData();
  const { data } = useFolders({ queryParams: { search: "" } });
  const allFolders: DashboardFolder[] = Array.isArray(data) ? data : [];

  const [folderToEdit, setFolderToEdit] = useState<DashboardFolder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<DashboardFolder | null>(null);

  const subfolderCount = folderToDelete
    ? allFolders.filter((f) => f.parent_id === folderToDelete.id).length
    : 0;

  const handleEdit = async (id: string, name: string, isPublic: boolean) => {
    try {
      await apiSend(`/api/folders/${id}`, "PUT", { name, is_public: isPublic });
      setFolderToEdit(null);
      await invalidate();
      toast.success("Folder updated successfully");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!folderToDelete) return;
    try {
      await apiSend(`/api/folders/${folderToDelete.id}`, "DELETE");
      await invalidate();
      toast.success("Folder deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setFolderToDelete(null);
    }
  };

  const handleTogglePin = async (folder: DashboardFolder) => {
    try {
      await apiSend(`/api/folders/${folder.id}`, "PUT", { is_pinned: !folder.is_pinned });
      await invalidate();
      toast.success(folder.is_pinned ? "Folder unpinned" : "Folder pinned");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            path={
              showPaths
                ? getAncestors(allFolders, folder.id)
                    .map((a) => a.name)
                    .join(" / ")
                : undefined
            }
            onEdit={() => setFolderToEdit(folder)}
            onDelete={() => setFolderToDelete(folder)}
            onTogglePin={() => handleTogglePin(folder)}
          />
        ))}
      </div>

      {folderToEdit && (
        <EditFolderDialog
          open
          onOpenChange={(open) => !open && setFolderToEdit(null)}
          folderId={folderToEdit.id}
          initialName={folderToEdit.name}
          initialIsPublic={folderToEdit.is_public ?? false}
          hiddenByParent={getAncestors(allFolders, folderToEdit.id).some(
            (ancestor) => !ancestor.is_public,
          )}
          onEditFolder={handleEdit}
        />
      )}

      <AlertDialog
        open={!!folderToDelete}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the folder. The repositories themselves
              won&apos;t be deleted.
              {subfolderCount > 0 &&
                ` ${subfolderCount === 1 ? "Its subfolder" : `Its ${subfolderCount} subfolders`} will move up one level.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
