"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GitBranch,
  MoreVertical,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Folder,
  Lock,
} from "lucide-react";
import AddRepoToFolderDialog from "./add-repo-to-folder-dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

export interface Repo {
  id: string;
  description?: string;
  language?: string;
  github_repo_id: number;
  user_id: string;
  name: string;
  full_name: string;
  url: string;
  private: boolean;
  stars: number;
  forks: number;
  updated_at: string;
  synced_at: string;
  is_favorite?: boolean;
}

interface Folder {
  id: string;
  name: string;
}

interface RepositoriesTableProps {
  repos: Repo[];
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  folders: Folder[];
  onReposUpdate: () => void;
  search: string;
  refetching: boolean;
  onToggleFavorite?: (repo: Repo) => void;
}

export default function RepositoriesTable({
  repos,
  loading,
  page,
  onPageChange,
  totalItems,
  itemsPerPage,
  folders,
  onReposUpdate,
  search,
  refetching,
  onToggleFavorite,
}: RepositoriesTableProps) {
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [actionRepos, setActionRepos] = useState<Repo[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(repos.map((r) => r.id));
      setSelectedRepos(newSelected);
    } else {
      setSelectedRepos(new Set());
    }
  };

  const handleSelectRepo = (repoId: string, checked: boolean) => {
    const newSelected = new Set(selectedRepos);
    if (checked) {
      newSelected.add(repoId);
    } else {
      newSelected.delete(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading && repos.length === 0) {
    return (
      <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left w-12">
                  <Skeleton className="w-4 h-4 rounded" />
                </th>
                <th className="px-6 py-3 text-left w-1/3">
                  <Skeleton className="w-24 h-4" />
                </th>
                <th className="px-6 py-3 text-left">
                  <Skeleton className="w-16 h-4" />
                </th>
                <th className="px-6 py-3 text-left">
                  <Skeleton className="w-12 h-4" />
                </th>
                <th className="px-6 py-3 text-left">
                  <Skeleton className="w-16 h-4" />
                </th>
                <th className="px-6 py-3 text-right">
                  <Skeleton className="w-8 h-4 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <Skeleton className="w-4 h-4 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-48 h-3" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="w-20 h-4" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="w-10 h-4" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="w-16 h-5 rounded-full" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="w-8 h-8 rounded-md ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {search ? `No repositories match "${search}"` : "No repositories here yet"}
          </p>
          <p className="mt-1 max-w-sm text-pretty text-sm text-gray-500">
            {search
              ? "Try a different search term or clear your filters."
              : "Repositories sync from GitHub automatically. You can also run a sync from Settings."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {selectedRepos.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium tabular-nums text-blue-800">
            {selectedRepos.size}{" "}
            {selectedRepos.size === 1 ? "repository" : "repositories"} selected
          </span>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              const reposToAdd = repos.filter((r) => selectedRepos.has(r.id));
              setActionRepos(reposToAdd);
              setShowAddDialog(true);
            }}
          >
            <Folder className="w-4 h-4 mr-2" />
            Add to folder
          </Button>
        </div>
      )}

      <Card className="relative overflow-hidden rounded-xl border-gray-200 bg-white shadow-none">
        {refetching && (
          <div
            role="status"
            aria-label="Updating"
            className="absolute inset-x-0 top-0 z-10 flex justify-center pt-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Updating
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left w-12">
                  <Checkbox
                    checked={
                      repos.length > 0 && selectedRepos.size === repos.length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Stars
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Language
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={cn(
                "divide-y divide-gray-100 transition-opacity",
                refetching && "opacity-50",
              )}
            >

              {repos.map((repo) => (
                <tr
                  key={repo.id}
                  className={cn(
                    "transition-colors hover:bg-gray-50",
                    selectedRepos.has(repo.id) && "bg-blue-50/50 hover:bg-blue-50/70",
                  )}
                >
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedRepos.has(repo.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRepo(repo.id, !!checked)
                      }
                      aria-label={`Select ${repo.name}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <GitBranch className="size-4 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium text-gray-900 hover:text-blue-600 hover:underline"
                          >
                            {repo.name}
                          </a>
                          {repo.private && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-1.5 py-px text-[11px] text-gray-500">
                              <Lock className="size-2.5" />
                              Private
                            </span>
                          )}
                          {repo.is_favorite && (
                            <Star
                              aria-label="Favorite"
                              className="size-3.5 shrink-0 fill-amber-400 text-amber-500"
                            />
                          )}
                        </div>
                        {repo.description && (
                          <p className="max-w-xs truncate text-sm text-gray-500">
                            {repo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {repo.full_name?.split("/")[0]}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm tabular-nums text-gray-600">
                      <Star className="size-3.5 text-gray-400" />
                      {(repo.stars || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {repo.language ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {repo.language}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-gray-500"
                          aria-label={`Actions for ${repo.name}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setActionRepos([repo]);
                            setShowAddDialog(true);
                          }}
                          className="cursor-pointer hover:!bg-gray-100 hover:!text-gray-900 mb-1"
                        >
                          <GitBranch className="w-4 h-4 mr-2" />
                          Add to folder
                        </DropdownMenuItem>
                        {onToggleFavorite && (
                          <DropdownMenuItem
                            onClick={() => onToggleFavorite(repo)}
                            className="cursor-pointer hover:!bg-gray-100 hover:!text-gray-900"
                          >
                            <Star
                              className={cn("mr-2 size-4", repo.is_favorite && "fill-amber-400 text-amber-500")}
                            />
                            {repo.is_favorite
                              ? "Remove from favorites"
                              : "Add to favorites"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => window.open(repo.url, "_blank")}
                          className="cursor-pointer hover:!bg-gray-100 hover:!text-gray-900 mt-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Open on GitHub
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-sm tabular-nums text-gray-500">
              Page {page} of {totalPages} · {totalItems.toLocaleString()} repositories
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add to Folder Dialog */}
      <AddRepoToFolderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        repos={actionRepos}
        folders={folders}
        onSuccess={onReposUpdate}
      />
    </>
  );
}
