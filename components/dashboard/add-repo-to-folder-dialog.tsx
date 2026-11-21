"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Folder } from "lucide-react";
import { toast } from "sonner";
import { apiSend, errorMessage } from "@/lib/api-client";
import { buildTree, flattenTree } from "@/lib/folder-tree";
import { useInvalidateRepoData } from "@/hooks/queries";

interface PickerFolder {
  id: string;
  name: string;
  parent_id?: string | null;
  position?: number;
}

interface AddRepoToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoIds: string[];
  /** Repo name, or a count such as "12 repositories". */
  label: string;
  folders: PickerFolder[];
  onSuccess?: () => void;
}

export default function AddRepoToFolderDialog({
  open,
  onOpenChange,
  repoIds,
  label,
  folders,
  onSuccess,
}: AddRepoToFolderDialogProps) {
  const invalidate = useInvalidateRepoData();
  const [loading, setLoading] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const options = useMemo(() => flattenTree(buildTree(folders)), [folders]);

  const handleToggleFolder = (folderId: string) => {
    setSelectedFolders((current) => {
      const next = new Set(current);
      if (!next.delete(folderId)) next.add(folderId);
      return next;
    });
  };

  const handleAdd = async () => {
    if (repoIds.length === 0 || selectedFolders.size === 0) return;

    try {
      setLoading(true);
      await Promise.all(
        [...selectedFolders].map((folderId) =>
          apiSend(`/api/folders/${folderId}/repos`, "POST", { repoIds }),
        ),
      );
      await invalidate();
      onSuccess?.();
      onOpenChange(false);
      setSelectedFolders(new Set());
      toast.success(`Added ${label} to ${selectedFolders.size === 1 ? "folder" : "folders"}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Folder</DialogTitle>
          <DialogDescription>
            Add <span className="font-semibold text-gray-900">{label}</span> to your folders
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-80 rounded-lg border border-gray-200 p-2">
          {options.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center text-center">
              <Folder className="mb-2 size-8 text-gray-300" />
              <p className="text-sm text-gray-500">No folders yet</p>
              <p className="text-xs text-gray-500">Create a folder first to add repos</p>
            </div>
          ) : (
            <ul>
              {options.map((folder) => {
                const checked = selectedFolders.has(folder.id);
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => handleToggleFolder(folder.id)}
                      style={{ paddingLeft: `${0.5 + folder.depth * 0.875}rem` }}
                      className="flex w-full items-center gap-2 rounded-md py-2 pr-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Folder className="size-4 shrink-0 text-gray-400" />
                      <span className="min-w-0 flex-1 truncate font-medium">{folder.name}</span>
                      <span
                        aria-hidden
                        className={`flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          checked ? "border-blue-600 bg-blue-600" : "border-gray-300"
                        }`}
                      >
                        {checked && <Check className="size-3 text-white" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedFolders.size === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Adding..." : "Add to Folders"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
