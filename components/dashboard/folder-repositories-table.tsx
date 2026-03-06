"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GitBranch, Star, ExternalLink, X, Trash2 } from "lucide-react";
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
      <Card className="bg-white border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <GitBranch className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No repositories yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add repositories to this folder from the dashboard
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {selectedRepos.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">
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
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => confirmRemoveSingle(repo.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                          title="Remove from folder"
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
