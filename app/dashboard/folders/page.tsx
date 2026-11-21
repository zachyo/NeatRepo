"use client";

import { useMemo, useState } from "react";
import { Folder, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CreateFolderDialog from "@/components/dashboard/create-folder-dialog";
import type { DashboardFolder } from "@/components/dashboard/dnd-provider";
import FolderGrid from "@/components/dashboard/folder-grid";
import { apiSend, errorMessage } from "@/lib/api-client";
import { useFolders, useInvalidateRepoData } from "@/hooks/queries";

export default function FoldersPage() {
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const invalidate = useInvalidateRepoData();

  const { data, isLoading } = useFolders({ queryParams: { search: "" } });
  const folders = useMemo<DashboardFolder[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const query = search.trim().toLowerCase();

  // Browsing shows the top level; searching looks through every level.
  const visibleFolders = useMemo(
    () =>
      query
        ? folders.filter((folder) => folder.name.toLowerCase().includes(query))
        : folders
            .filter((folder) => !folder.parent_id)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [folders, query],
  );

  const handleCreateFolder = async (name: string, isPublic = false) => {
    try {
      await apiSend("/api/folders", "POST", { name, is_public: isPublic });
      setShowCreateDialog(false);
      await invalidate();
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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

      {isLoading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-28 md:w-48">
              <Skeleton className="h-28 w-28 rounded-md md:h-48 md:w-48" />
              <Skeleton className="mx-auto mt-2 h-6 w-3/4" />
            </div>
          ))}
        </div>
      ) : visibleFolders.length === 0 ? (
        <Card className="rounded-xl border-dashed border-gray-300 bg-white px-6 py-12 shadow-none">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-50">
              <Folder className="size-6 text-blue-600" />
            </div>
            <p className="font-medium text-gray-900">
              {folders.length === 0 ? "No folders yet" : `No folders match "${search}"`}
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
                <Plus className="mr-2 size-4" />
                Create a folder
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <FolderGrid folders={visibleFolders} showPaths={!!query} />
      )}

      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}
