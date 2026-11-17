"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GitBranch, Star, ExternalLink, X, Trash2, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

interface FolderRepositoriesTableProps {
  repos: any[];
  folderId: string;
  onUpdate: () => void;
}

export default function FolderRepositoriesTable({
  repos,
  folderId,
  onUpdate,
}: FolderRepositoriesTableProps) {
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(repos.map((r) => r.repositories.id));
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

  const [deleteDialogSource, setDeleteDialogSource] = useState<
    "single" | "multiple" | null
  >(null);
  const [repoToDelete, setRepoToDelete] = useState<string | null>(null);

  const confirmRemoveSingle = (repoId: string) => {
    setRepoToDelete(repoId);
    setDeleteDialogSource("single");
  };

  const confirmRemoveSelected = () => {
    if (selectedRepos.size === 0) return;
    setDeleteDialogSource("multiple");
  };

  const executeDelete = async () => {
    if (deleteDialogSource === "multiple") {
      try {
        setIsDeleting(true);
        for (const repoId of selectedRepos) {
          await fetch(`/api/folders/${folderId}/repos?repoId=${repoId}`, {
            method: "DELETE",
          });
        }
        setSelectedRepos(new Set());
        onUpdate();
        toast.success(`Removed ${selectedRepos.size} repositories`);
      } catch (error) {
        console.error("Error removing repos:", error);
        toast.error("Failed to remove repositories");
      } finally {
        setIsDeleting(false);
        setDeleteDialogSource(null);
      }
    } else if (deleteDialogSource === "single" && repoToDelete) {
      try {
        await fetch(`/api/folders/${folderId}/repos?repoId=${repoToDelete}`, {
          method: "DELETE",
        });
        onUpdate();
        toast.success("Repository removed from folder");
      } catch (error) {
        console.error("Error removing repo:", error);
        toast.error("Failed to remove repository");
      } finally {
        setRepoToDelete(null);
        setDeleteDialogSource(null);
      }
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
            Add repositories from the Repositories page using the row menu or by selecting several at once.
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
      {selectedRepos.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5">
          <span className="text-sm font-medium tabular-nums text-gray-700">
            {selectedRepos.size}{" "}
            {selectedRepos.size === 1 ? "repository" : "repositories"} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={confirmRemoveSelected}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Removing..." : "Remove from Folder"}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-none">
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
            <tbody className="divide-y divide-gray-200">
              {repos.map((repoItem) => {
                const repo = repoItem.repositories;
                return (
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
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          title="Open on GitHub"
                          aria-label={`Open ${repo.name} on GitHub`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => confirmRemoveSingle(repo.id)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Remove from folder"
                          aria-label={`Remove ${repo.name} from folder`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog
        open={deleteDialogSource !== null}
        onOpenChange={(open) => !open && setDeleteDialogSource(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from folder?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogSource === "multiple"
                ? `Are you sure you want to remove the ${selectedRepos.size} selected repositories from this folder?`
                : `Are you sure you want to remove this repository from the folder?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeDelete();
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
