"use client";

import { Fragment, use, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderInput, FolderPlus, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CreateFolderDialog from "@/components/dashboard/create-folder-dialog";
import {
  useDndActions,
  type DashboardFolder,
} from "@/components/dashboard/dnd-provider";
import FolderGrid from "@/components/dashboard/folder-grid";
import FolderRepositoriesTable from "@/components/dashboard/folder-repositories-table";
import { HeaderContext } from "@/app/dashboard/layout";
import { apiSend, errorMessage } from "@/lib/api-client";
import { MAX_FOLDER_DEPTH } from "@/lib/folder-tree";
import { useFolder, useFolders, useInvalidateRepoData } from "@/hooks/queries";

interface PageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderDetailPage({ params }: PageProps) {
  const { folderId } = use(params);
  const { openMoveDialog } = useDndActions();
  const invalidate = useInvalidateRepoData();
  const [showCreate, setShowCreate] = useState(false);

  const { data: folder, isLoading: loading } = useFolder(folderId);
  const { data: foldersData } = useFolders({ queryParams: { search: "" } });
  const { setHeaderTitle } = useContext(HeaderContext);

  const subfolders = useMemo<DashboardFolder[]>(
    () =>
      (Array.isArray(foldersData) ? (foldersData as DashboardFolder[]) : [])
        .filter((f) => f.parent_id === folderId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [foldersData, folderId],
  );

  useEffect(() => {
    if (folder?.name) {
      setHeaderTitle(folder.name);
    }
    return () => setHeaderTitle("");
  }, [folder?.name, setHeaderTitle]);

  const handleCreateSubfolder = async (name: string, isPublic = false) => {
    try {
      await apiSend("/api/folders", "POST", {
        name,
        is_public: isPublic,
        parent_id: folderId,
      });
      setShowCreate(false);
      await invalidate();
      toast.success("Subfolder created");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="mt-3 flex flex-col gap-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-10 w-80 max-w-full" />
        </div>
        <Card className="h-96">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="rounded-xl border-dashed border-gray-300 bg-white px-6 py-12 shadow-none">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="font-medium text-gray-900">Folder not found</p>
            <p className="mt-1 text-sm text-gray-500">
              It may have been deleted, or it belongs to another account.
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/dashboard/folders">Back to folders</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const repoCount = folder.folder_repos?.length || 0;
  const ancestors: { id: string; name: string }[] = folder.ancestors ?? [];
  const atDepthLimit = ancestors.length + 1 >= MAX_FOLDER_DEPTH;
  const hiddenByParent = folder.is_public && !folder.publicly_visible;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/folders">Folders</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {ancestors.map((ancestor) => (
              <Fragment key={ancestor.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/dashboard/folders/${ancestor.id}`}>{ancestor.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{folder.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-xl">
            {folder.icon || "📁"}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-semibold text-gray-900">{folder.name}</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="tabular-nums">
                {repoCount} {repoCount === 1 ? "repository" : "repositories"}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                {folder.is_public ? (
                  <>
                    <Globe className="size-3.5" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5" /> Private
                  </>
                )}
              </span>
              {hiddenByParent && (
                <>
                  <span aria-hidden>·</span>
                  <span>Hidden because a parent folder is private</span>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openMoveDialog(folderId)}>
              <FolderInput className="mr-2 size-4" />
              Move
            </Button>
            <Button
              variant="outline"
              disabled={atDepthLimit}
              title={
                atDepthLimit
                  ? `Folders can be nested ${MAX_FOLDER_DEPTH} levels deep`
                  : undefined
              }
              onClick={() => setShowCreate(true)}
            >
              <FolderPlus className="mr-2 size-4" />
              New subfolder
            </Button>
          </div>
        </div>
      </div>

      {subfolders.length > 0 && (
        <section aria-label="Subfolders" className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Subfolders</h3>
          <FolderGrid folders={subfolders} />
        </section>
      )}

      <section aria-label="Repositories">
        <FolderRepositoriesTable
          repos={folder.folder_repos || []}
          folderId={folderId}
          sort={folder.repo_sort ?? "updated"}
        />
      </section>

      <CreateFolderDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreateFolder={handleCreateSubfolder}
        title="New subfolder"
        description={`Create a folder inside ${folder.name}`}
      />
    </div>
  );
}
