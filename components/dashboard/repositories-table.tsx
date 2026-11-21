"use client";

import { useState } from "react";
import {
  Eye,
  Folder,
  FolderMinus,
  GitBranch,
  Loader2,
  MoreVertical,
  Star,
  StarOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContextMenuItem } from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { apiSend, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useInvalidateRepoData } from "@/hooks/queries";
import { useViewMode } from "@/hooks/use-view-mode";
import AddRepoToFolderDialog from "./add-repo-to-folder-dialog";
import RepoCollection, { ViewToggle, type Repo } from "./repo-collection";
import TablePagination from "./table-pagination";

export type { Repo } from "./repo-collection";

interface RepositoriesTableProps {
  repos: Repo[];
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  folders: { id: string; name: string; parent_id?: string | null; position?: number }[];
  search: string;
  refetching: boolean;
  onToggleFavorite?: (repo: Repo) => void;
  /** Current filters. A change clears the selection. */
  filterParams: Record<string, string>;
  /** Set when the list is filtered to one folder, enabling bulk removal. */
  activeFolderId?: string | null;
  containerId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function RepositoriesTable({
  repos,
  loading,
  page,
  onPageChange,
  totalItems,
  itemsPerPage,
  folders,
  search,
  refetching,
  onToggleFavorite,
  filterParams,
  activeFolderId,
  containerId = "repositories",
  emptyTitle = "No repositories here yet",
  emptyDescription = "Repositories sync from GitHub automatically. You can also run a sync from Settings.",
}: RepositoriesTableProps) {
  const invalidate = useInvalidateRepoData();
  const [view, setView] = useViewMode();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogRepoIds, setDialogRepoIds] = useState<string[]>([]);
  const [dialogLabel, setDialogLabel] = useState("");
  const [busy, setBusy] = useState(false);

  // A selection only makes sense for the filters it was made under.
  const filterKey = JSON.stringify(filterParams);
  const [selectionFilterKey, setSelectionFilterKey] = useState(filterKey);
  if (selectionFilterKey !== filterKey) {
    setSelectionFilterKey(filterKey);
    setSelected(new Set());
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageSelected = repos.length > 0 && repos.every((repo) => selected.has(repo.id));
  const canSelectMore = pageSelected && selected.size < totalItems;

  const handleSelect = (repoId: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(repoId);
      else next.delete(repoId);
      return next;
    });
  };

  const handleSelectPage = (checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const repo of repos) {
        if (checked) next.add(repo.id);
        else next.delete(repo.id);
      }
      return next;
    });
  };

  const handleSelectAllMatching = async () => {
    try {
      setBusy(true);
      const response = await fetch(`/api/repos/ids?${new URLSearchParams(filterParams)}`);
      if (!response.ok) throw new Error("Could not select all repositories");
      const { ids, capped } = await response.json();
      setSelected(new Set(ids));
      if (capped) toast.info(`Selected the first ${ids.length.toLocaleString()} repositories`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const openAddDialog = (repoIds: string[], label: string) => {
    setDialogLabel(label);
    setDialogRepoIds(repoIds);
  };

  const runBulk = async (action: () => Promise<unknown>, success: string) => {
    try {
      setBusy(true);
      await action();
      await invalidate();
      setSelected(new Set());
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const count = selected.size;
  const countLabel = `${count.toLocaleString()} ${count === 1 ? "repository" : "repositories"}`;

  const setFavorite = (isFavorite: boolean) =>
    runBulk(
      () =>
        apiSend("/api/repos/bulk", "PATCH", {
          repoIds: [...selected],
          is_favorite: isFavorite,
        }),
      isFavorite ? `Favorited ${countLabel}` : `Unfavorited ${countLabel}`,
    );

  const removeFromFolder = () =>
    runBulk(
      () =>
        apiSend(`/api/folders/${activeFolderId}/repos`, "DELETE", {
          repoIds: [...selected],
        }),
      `Removed ${countLabel} from this folder`,
    );

  if (loading && repos.length === 0) {
    return (
      <Card className="space-y-4 rounded-xl border-gray-200 bg-white p-6 shadow-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </Card>
    );
  }

  if (repos.length === 0) {
    return (
      <Card className="rounded-xl border-dashed border-gray-300 bg-white px-6 py-12 shadow-none">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gray-100">
            <GitBranch className="size-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900">
            {search ? `No repositories match "${search}"` : emptyTitle}
          </p>
          <p className="mt-1 max-w-sm text-pretty text-sm text-gray-500">
            {search ? "Try a different search term or clear your filters." : emptyDescription}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
        <div aria-live="polite" className="flex items-center gap-2 text-xs text-gray-500">
          {refetching && (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Updating
            </>
          )}
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {count > 0 && (
        <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-sm font-medium tabular-nums text-blue-800">
              {countLabel} selected
            </span>
            <Button
              size="sm"
              disabled={busy}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openAddDialog([...selected], countLabel)}
            >
              <Folder className="mr-2 size-4" />
              Add to folder
            </Button>
            {activeFolderId && (
              <Button size="sm" variant="outline" disabled={busy} onClick={removeFromFolder}>
                <FolderMinus className="mr-2 size-4" />
                Remove from folder
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setFavorite(true)}>
              <Star className="mr-2 size-4" />
              Favorite
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setFavorite(false)}>
              <StarOff className="mr-2 size-4" />
              Unfavorite
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Clear selection"
              className="size-9 p-0"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-4" />
            </Button>
          </div>
          {canSelectMore && (
            <button
              type="button"
              disabled={busy}
              onClick={handleSelectAllMatching}
              className="mt-1 text-sm font-medium text-blue-700 underline-offset-2 hover:underline disabled:opacity-60"
            >
              Select all {totalItems.toLocaleString()} matching repositories
            </button>
          )}
        </div>
      )}

      <RepoCollection
        repos={repos}
        view={view}
        containerId={containerId}
        selected={selected}
        onSelect={handleSelect}
        onSelectPage={handleSelectPage}
        dimmed={refetching}
        renderActions={(repo) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-gray-500"
                aria-label={`Actions for ${repo.name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => openAddDialog([repo.id], repo.name)}
                className="cursor-pointer"
              >
                <Folder className="mr-2 size-4" />
                Add to folder
              </DropdownMenuItem>
              {onToggleFavorite && (
                <DropdownMenuItem
                  onClick={() => onToggleFavorite(repo)}
                  className="cursor-pointer"
                >
                  <Star
                    className={cn(
                      "mr-2 size-4",
                      repo.is_favorite && "fill-amber-400 text-amber-500",
                    )}
                  />
                  {repo.is_favorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.open(repo.url, "_blank", "noopener,noreferrer")}
                className="cursor-pointer"
              >
                <Eye className="mr-2 size-4" />
                Open on GitHub
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        renderMenuItems={(repo) => (
          <>
            <ContextMenuItem onSelect={() => openAddDialog([repo.id], repo.name)}>
              <Folder className="mr-2 size-4" />
              Add to folder
            </ContextMenuItem>
            {onToggleFavorite && (
              <ContextMenuItem onSelect={() => onToggleFavorite(repo)}>
                <Star className="mr-2 size-4" />
                {repo.is_favorite ? "Remove from favorites" : "Add to favorites"}
              </ContextMenuItem>
            )}
            <ContextMenuItem
              onSelect={() => window.open(repo.url, "_blank", "noopener,noreferrer")}
            >
              <Eye className="mr-2 size-4" />
              Open on GitHub
            </ContextMenuItem>
          </>
        )}
      />

      <TablePagination
        className="mt-3"
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />

      <AddRepoToFolderDialog
        open={dialogRepoIds.length > 0}
        onOpenChange={(open) => !open && setDialogRepoIds([])}
        repoIds={dialogRepoIds}
        label={dialogLabel}
        folders={folders}
        onSuccess={() => setSelected(new Set())}
      />
    </>
  );
}
