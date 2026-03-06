"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <Card className="bg-white border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
      <Card className="bg-white border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <GitBranch className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            No repositories found {search ? `for "${search}"` : ""}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search
              ? `Try searching for a different repository`
              : "Start by adding a repository"}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {selectedRepos.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">
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
            Add to Folder
          </Button>
        </div>
      )}

      <Card className="bg-white border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stars
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={cn(
                "divide-y divide-gray-200 relative",
                refetching && "opacity-40",
              )}
            >
              {refetching && (
                <div className="inset-0 absolute flex items-center justify-center bg-black/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}

              {repos.map((repo) => (
                <tr key={repo.id} className="hover:bg-gray-50 transition">
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
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-700 truncate"
                        >
                          {repo.name}
                        </a>
                        {repo.is_favorite && (
                          <Star className="inline-block w-4 h-4 ml-2 mb-0.5 text-yellow-500 fill-current" />
                        )}
                        {repo.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
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
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {repo.stars || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {repo.language ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                          className="h-8 w-8 p-0"
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
                          Add to Folder
                        </DropdownMenuItem>
                        {onToggleFavorite && (
                          <DropdownMenuItem
                            onClick={() => onToggleFavorite(repo)}
                            className="cursor-pointer hover:!bg-gray-100 hover:!text-gray-900"
                          >
                            <Star
                              className={`w-4 h-4 mr-2 ${repo.is_favorite ? "fill-yellow-500 text-yellow-500" : ""}`}
                            />
                            {repo.is_favorite
                              ? "Unmark Favorite"
                              : "Mark as Favorite"}
                          </DropdownMenuItem>
                        )}
                        <hr />
                        <DropdownMenuItem
                          onClick={() => window.open(repo.url, "_blank")}
                          className="cursor-pointer hover:!bg-gray-100 hover:!text-gray-900 mt-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View on GitHub
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
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} ({totalItems} total)
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
