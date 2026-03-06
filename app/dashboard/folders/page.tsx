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

  const handleCreateFolder = async (name: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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

  const handleEditFolder = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-5">
        <Input
          placeholder="Search folders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Folder
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
        <Card className="bg-white border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Folder className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              {folders.length === 0
                ? "No folders yet"
                : "No folders match your search"}
            </p>
            {folders.length === 0 && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first folder
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filteredFolders.map((folder) => (
            <div key={folder.id} className="group relative">
              <Link href={`/dashboard/folders/${folder.id}`}>
                <Card className="bg-white hover:shadow-md transition cursor-pointer h-full border-none pb-5 shadow-none">
                  <div className="relative">
                    <Image
                      src={folderIcon}
                      alt={folder.name}
                      className="w-28 h-28 md:w-48 md:h-48"
                    />
                    <div className="absolute top-1 md:top-6 right-4 md:right-7 flex items-center gap-1 text-xs md:text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                      <GitBranch className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      <span>{folder.repo_count || 0}</span>
                    </div>
                    {folder.is_pinned && (
                      <div className="absolute top-2 left-2 p-1.5 bg-blue-100/80 backdrop-blur-sm rounded-md text-blue-600">
                        <Pin className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm md:text-lg text-center -mt-3 md:-mt-6 font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                    {folder.name}
                  </h3>
                </Card>
              </Link>

              {/* Hover Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                <button
                  onClick={(e) => handleTogglePin(e, folder)}
                  className={`p-2 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 transition ${
                    folder.is_pinned
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-blue-600"
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
                  onClick={() => setFolderToEdit(folder)}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
                  title="Edit folder"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFolderToDelete(folder.id)}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-red-50 text-red-600 hover:border-red-300"
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
