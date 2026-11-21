"use client";

import { useState } from "react";
import Link from "next/link";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Folder, GitBranch, Trash2, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContextMenuItem } from "@/components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSend, errorMessage } from "@/lib/api-client";
import { sortFolderRepos, type FolderRepoSort } from "@/lib/repo-query";
import { useFolders, useInvalidateRepoData } from "@/hooks/queries";
import { useViewMode } from "@/hooks/use-view-mode";
import AddRepoToFolderDialog from "./add-repo-to-folder-dialog";
import { useRegisterReorder } from "./dnd-provider";
import RepoCollection, { ViewToggle, type Repo } from "./repo-collection";

interface FolderRepoRow {
  repo_id: string;
  added_at: string;
  position: number;
  repositories: Repo;
}

interface FolderRepositoriesTableProps {
  repos: FolderRepoRow[];
  folderId: string;
  sort: FolderRepoSort;
}

const SORT_LABELS: Record<FolderRepoSort, string> = {
  manual: "Manual order",
  updated: "Recently updated",
  stars: "Most stars",
  name: "Name",
  added: "Date added",
};

export default function FolderRepositoriesTable({
  repos,
  folderId,
  sort,
}: FolderRepositoriesTableProps) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateRepoData();
  const { data: foldersData } = useFolders({ queryParams: { search: "" } });
  const [view, setView] = useViewMode();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingRemoval, setPendingRemoval] = useState<string[]>([]);
  const [removing, setRemoving] = useState(false);
  const [dialogRepoIds, setDialogRepoIds] = useState<string[]>([]);
  const [dialogLabel, setDialogLabel] = useState("");

  const containerId = `folder-repos:${folderId}`;
  const queryKey = ["folder", folderId];
  const items = repos.map((row) => row.repositories);

  /** Applies a change to the cached folder and returns the previous value. */
  const patchFolder = (patch: (folder: any) => any) => {
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (folder: any) => folder && patch(folder));
    return previous;
  };

  const handleSortChange = async (next: FolderRepoSort) => {
    const previous = patchFolder((folder) => ({
      ...folder,
      repo_sort: next,
      folder_repos: sortFolderRepos(folder.folder_repos, next),
    }));
    try {
      await apiSend(`/api/folders/${folderId}`, "PUT", { repo_sort: next });
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      toast.error(errorMessage(error));
    }
  };

  useRegisterReorder(containerId, async (activeId, overId) => {
    const from = repos.findIndex((row) => row.repo_id === activeId);
    const to = repos.findIndex((row) => row.repo_id === overId);
    if (from < 0 || to < 0) return;

    const reordered = arrayMove(repos, from, to).map((row, index) => ({
      ...row,
      position: index + 1,
    }));
    const previous = patchFolder((folder) => ({ ...folder, folder_repos: reordered }));

    try {
      await apiSend(`/api/folders/${folderId}/repos/order`, "PUT", {
        repoIds: reordered.map((row) => row.repo_id),
      });
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      toast.error(errorMessage(error));
    }
  });

  const handleSelect = (repoId: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(repoId);
      else next.delete(repoId);
      return next;
    });
  };

  const executeRemove = async () => {
    try {
      setRemoving(true);
      await apiSend(`/api/folders/${folderId}/repos`, "DELETE", { repoIds: pendingRemoval });
      setSelected((current) => {
        const next = new Set(current);
        pendingRemoval.forEach((id) => next.delete(id));
        return next;
      });
      await invalidate();
      toast.success(
        pendingRemoval.length === 1
          ? "Repository removed from folder"
          : `Removed ${pendingRemoval.length} repositories`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRemoving(false);
      setPendingRemoval([]);
    }
  };

  if (repos.length === 0) {
    return (
      <Card className="rounded-xl border-dashed border-gray-300 bg-white px-6 py-12 shadow-none">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gray-100">
            <GitBranch className="size-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900">This folder is empty</p>
          <p className="mt-1 max-w-sm text-pretty text-sm text-gray-500">
            Add repositories from the Repositories page, or drag them onto a folder in the sidebar.
          </p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/dashboard/repos">Browse repositories</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Select value={sort} onValueChange={(next) => handleSortChange(next as FolderRepoSort)}>
          <SelectTrigger aria-label="Sort repositories" className="h-9 w-[180px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as FolderRepoSort[]).map((value) => (
              <SelectItem key={value} value={value}>
                {SORT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
          <span className="mr-auto text-sm font-medium tabular-nums text-gray-700">
            {selected.size} {selected.size === 1 ? "repository" : "repositories"} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDialogLabel(
                `${selected.size} ${selected.size === 1 ? "repository" : "repositories"}`,
              );
              setDialogRepoIds([...selected]);
            }}
          >
            <Folder className="mr-2 size-4" />
            Add to folder
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={removing}
            onClick={() => setPendingRemoval([...selected])}
          >
            <Trash2 className="mr-2 size-4" />
            Remove from folder
          </Button>
        </div>
      )}

      <RepoCollection
        repos={items}
        view={view}
        containerId={containerId}
        selected={selected}
        onSelect={handleSelect}
        onSelectPage={(checked) =>
          setSelected(checked ? new Set(items.map((repo) => repo.id)) : new Set())
        }
        manualOrder={sort === "manual"}
        renderActions={(repo) => (
          <div className="flex items-center justify-end gap-1">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on GitHub"
              aria-label={`Open ${repo.name} on GitHub`}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ExternalLink className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => setPendingRemoval([repo.id])}
              title="Remove from folder"
              aria-label={`Remove ${repo.name} from folder`}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        renderMenuItems={(repo) => (
          <>
            <ContextMenuItem
              onSelect={() => {
                setDialogLabel(repo.name);
                setDialogRepoIds([repo.id]);
              }}
            >
              <Folder className="mr-2 size-4" />
              Add to another folder
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => window.open(repo.url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 size-4" />
              Open on GitHub
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => setPendingRemoval([repo.id])}
              className="text-red-600 focus:text-red-600"
            >
              <X className="mr-2 size-4" />
              Remove from folder
            </ContextMenuItem>
          </>
        )}
      />

      <AddRepoToFolderDialog
        open={dialogRepoIds.length > 0}
        onOpenChange={(open) => !open && setDialogRepoIds([])}
        repoIds={dialogRepoIds}
        label={dialogLabel}
        folders={(Array.isArray(foldersData) ? foldersData : []).filter(
          (folder: { id: string }) => folder.id !== folderId,
        )}
        onSuccess={() => setSelected(new Set())}
      />

      <AlertDialog
        open={pendingRemoval.length > 0}
        onOpenChange={(open) => !open && setPendingRemoval([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from folder?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval.length > 1
                ? `The ${pendingRemoval.length} selected repositories will be removed from this folder.`
                : "This repository will be removed from this folder."}{" "}
              Nothing changes on GitHub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                executeRemove();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
