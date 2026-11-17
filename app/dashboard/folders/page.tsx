"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Plus,
  Folder,
  GitBranch,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Globe,
  Lock,
  Search,
} from "lucide-react";
import CreateFolderDialog from "@/components/dashboard/create-folder-dialog";
import EditFolderDialog from "@/components/dashboard/edit-folder-dialog";
import { useFolders } from "@/hooks/queries";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import folderIcon from "@/public/folder.svg";

interface Folder {
  id: string;
  name: string;
  icon?: string;
  repo_count?: number;
  is_pinned?: boolean;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function FoldersPage() {
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const {
    data: foldersData,
    refetch: refetchFolders,
    isLoading: foldersLoading,
  } = useFolders({
    queryParams: { search: "" },
  });

  const folders = (foldersData ?? []) as Folder[];

  useEffect(() => {
    const filtered = folders.filter((folder) =>
      folder.name.toLowerCase().includes(search.toLowerCase()),
    );
    setFilteredFolders(filtered);
  }, [search, folders]);

  const handleCreateFolder = async (name: string, isPublic = false) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_public: isPublic }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        refetchFolders();
        toast.success("Folder created successfully");
      } else {
        toast.error("Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("An error occurred");
    }
  };

  const handleEditFolder = async (
    id: string,
    name: string,
    isPublic: boolean,
  ) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_public: isPublic }),
      });

      if (response.ok) {
        setFolderToEdit(null);
        refetchFolders();
        toast.success("Folder updated successfully");
      } else {
        toast.error("Failed to update folder");
      }
    } catch (error) {
      console.error("Error updating folder:", error);
      toast.error("An error occurred");
    }
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const response = await fetch(`/api/folders/${folderToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refetchFolders();
        toast.success("Folder deleted");
      } else {
        toast.error("Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("An error occurred");
    } finally {
      setFolderToDelete(null);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !folder.is_pinned }),
      });

      if (response.ok) {
        refetchFolders();
        toast.success(folder.is_pinned ? "Folder unpinned" : "Folder pinned");
      } else {
        toast.error("Failed to update folder");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            aria-label="Search folders"
            placeholder="Search folders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white pl-9"
          />
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 text-white hover:bg-blue-700 sm:ml-auto"
        >
          <Plus className="mr-1 size-4" />
          New folder
        </Button>
      </div>

      {/* Folders Grid */}
      {foldersLoading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card
              key={i}
              className="bg-white hover:shadow-md transition h-full border-none pb-5 shadow-none w-[190px]"
            >
              <div className="relative">
                <Skeleton className="w-48 h-48 rounded-md" />
              </div>
              <Skeleton className="h-6 w-3/4 mx-auto mt-2" />
            </Card>
          ))}
        </div>
      ) : filteredFolders.length === 0 ? (
        <Card className="rounded-xl border-dashed border-gray-300 bg-white px-6 py-12 shadow-none">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-50">
              <Folder className="size-6 text-blue-600" />
            </div>
            <p className="font-medium text-gray-900">
              {folders.length === 0
                ? "No folders yet"
                : `No folders match "${search}"`}
            </p>
            <p className="mt-1 max-w-sm text-pretty text-sm text-gray-500">
              {folders.length === 0
                ? "Folders let you group repositories by project, client or anything else."
                : "Try a different name."}
            </p>
            {folders.length === 0 && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create a folder
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filteredFolders.map((folder) => (
            <div key={folder.id} className="group relative">
              <Link
                href={`/dashboard/folders/${folder.id}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Card className="h-full cursor-pointer rounded-xl border-none bg-transparent pb-4 shadow-none transition-colors hover:bg-white">
                  <div className="relative">
                    <Image
                      src={folderIcon}
                      alt={folder.name}
                      className="w-28 h-28 md:w-48 md:h-48"
                    />
                    <div className="absolute right-4 top-9 flex items-center gap-1 text-xs tabular-nums text-gray-700 md:right-7 md:top-14 md:text-sm">
                      <GitBranch className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
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
                  <h3 className="flex items-center justify-center gap-1.5 text-sm md:text-lg text-center -mt-3 md:-mt-6 font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {folder.is_public ? (
                      <Globe
                        className="w-3.5 h-3.5 flex-shrink-0 text-gray-400"
                        aria-label="Public folder"
                      />
                    ) : (
                      <Lock
                        className="w-3.5 h-3.5 flex-shrink-0 text-gray-400"
                        aria-label="Private folder"
                      />
                    )}
                    <span className="truncate">{folder.name}</span>
                  </h3>
                </Card>
              </Link>

              {/* Hover Actions */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => handleTogglePin(e, folder)}
                  aria-label={folder.is_pinned ? `Unpin ${folder.name}` : `Pin ${folder.name}`}
                  aria-pressed={!!folder.is_pinned}
                  className={`rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors hover:bg-gray-50 ${
                    folder.is_pinned
                      ? "text-amber-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title={folder.is_pinned ? "Unpin folder" : "Pin folder"}
                >
                  {folder.is_pinned ? (
                    <PinOff className="w-4 h-4" />
                  ) : (
                    <Pin className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFolderToEdit(folder)}
                  aria-label={`Edit ${folder.name}`}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
                  title="Edit folder"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFolderToDelete(folder.id)}
                  aria-label={`Delete ${folder.name}`}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  title="Delete folder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateFolder={handleCreateFolder}
      />

      {folderToEdit && (
        <EditFolderDialog
          open={!!folderToEdit}
          onOpenChange={(open) => !open && setFolderToEdit(null)}
          folderId={folderToEdit.id}
          initialName={folderToEdit.name}
          initialIsPublic={folderToEdit.is_public ?? false}
          onEditFolder={handleEditFolder}
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
              This action cannot be undone. This will permanently delete your
              folder and remove all repositories from it (the repositories
              themselves won't be deleted).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeDeleteFolder();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
