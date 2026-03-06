"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Check } from "lucide-react";
import { Repo } from "./repositories-table";
import { toast } from "sonner";

interface Folder {
  id: string;
  name: string;
}

interface AddRepoToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repos: Repo[];
  folders: Folder[];
  onSuccess: () => void;
}

export default function AddRepoToFolderDialog({
  open,
  onOpenChange,
  repos,
  folders,
  onSuccess,
}: AddRepoToFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
    new Set(),
  );

  const handleToggleFolder = (folderId: string) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const handleAdd = async () => {
    if (!repos || repos.length === 0 || selectedFolders.size === 0) return;

    try {
      setLoading(true);

      // Add each repo to each selected folder
      for (const folderId of selectedFolders) {
        for (const repo of repos) {
          await fetch(`/api/folders/${folderId}/repos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoId: repo.id }),
          });
        }
      }

      onSuccess();
      onOpenChange(false);
      setSelectedFolders(new Set());
      toast.success(
        repos.length > 1
          ? `Added ${repos.length} repositories to folder(s)`
          : "Added repository to folder(s)",
      );
    } catch (error) {
      console.error("Error adding repos to folder:", error);
      toast.error("Failed to add to folder");
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
            {repos && repos.length > 0 ? (
              <span>
                Add{" "}
                <span className="font-semibold text-gray-900">
                  {repos.length === 1
                    ? repos[0].name
                    : `${repos.length} repositories`}
                </span>{" "}
                to your folders
              </span>
            ) : (
              "Select folders for your repositories"
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 border border-gray-200 rounded-lg p-4">
          {folders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Folder className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No folders yet</p>
              <p className="text-xs text-gray-400">
                Create a folder first to add repos
              </p>
            </div>
          ) : (
            <div className=" grid grid-cols-2 gap-3">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleToggleFolder(folder.id)}
                  className="w-full flex flex-row-reverse justify-between items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left border border-gray-200"
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                      selectedFolders.has(folder.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedFolders.has(folder.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex items-start flex-col gap-2">
                    <Folder className="w-4 h-4 text-amber-500 flex-shrink-0 hidden" />
                    <span className="font-medium text-gray-900 truncate max-w-28">
                      {folder.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-3 justify-end pt-4">
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
