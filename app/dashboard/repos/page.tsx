"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RepositoriesTable from "@/components/dashboard/repositories-table";
import AddRepoDialog from "@/components/dashboard/add-repo-dialog";
import { Plus } from "lucide-react";
import { useFolders, useRepositories } from "@/hooks/queries";
import RepoFilters from "@/components/dashboard/repo-filters";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce-pro";

interface Folder {
  id: string;
  name: string;
}

export default function RepositoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [filterFolder, setFilterFolder] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterStars, setFilterStars] = useState("all");

  const {
    data: foldersData,
    refetch: refetchFolders,
    isLoading: foldersLoading,
  } = useFolders({
    queryParams: { search: "" },
  });

  const {
    data: reposData,
    isLoading,
    refetch: refetchRepos,
    isRefetching: isRefetchingRepos,
  } = useRepositories({
    queryParams: {
      page: String(page),
      search,
      ...(filterFolder !== "all" && { folder_id: filterFolder }),
      ...(filterLanguage !== "all" && { language: filterLanguage }),
      ...(filterDate !== "all" && { date_range: filterDate }),
      ...(filterStars !== "all" && { min_stars: filterStars }),
    },
  });

  const { run, isPending } = useDebouncedCallback(() => {
    refetchRepos();
  }, 500);

  useEffect(() => {
    run();
  }, [page, search, filterFolder, filterLanguage, filterDate, filterStars]);

  const handleToggleFavorite = async (repo: any) => {
    try {
      const response = await fetch(`/api/repos/${repo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !repo.is_favorite }),
      });

      if (response.ok) {
        refetchRepos();
        toast.success(
          repo.is_favorite ? "Removed from favorites" : "Added to favorites",
        );
      } else {
        toast.error("Failed to update repository");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <RepoFilters
        values={{
          search: search,
          folder: filterFolder,
          language: filterLanguage,
          date: filterDate,
          stars: filterStars,
        }}
        onChange={(next) => {
          if (next.search !== undefined) setSearch(next.search);
          if (next.folder !== undefined) setFilterFolder(next.folder);
          if (next.language !== undefined) setFilterLanguage(next.language);
          if (next.date !== undefined) setFilterDate(next.date);
          if (next.stars !== undefined) setFilterStars(next.stars);
          setPage(1);
        }}
        folders={foldersData ?? []}
        actions={
          <Button
            onClick={() => setShowAddRepo(true)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="mr-1 size-4" />
            Add repository
          </Button>
        }
      />

      {/* Repositories Table */}
      <RepositoriesTable
        repos={reposData?.repos ?? []}
        loading={isLoading}
        page={page}
        onPageChange={setPage}
        totalItems={reposData?.total ?? 0}
        itemsPerPage={15}
        folders={foldersData ?? []}
        search={search}
        refetching={isRefetchingRepos}
        onReposUpdate={refetchRepos}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Add Repository Dialog */}
      <AddRepoDialog
        open={showAddRepo}
        onOpenChange={setShowAddRepo}
        folders={foldersData ?? []}
        onSuccess={() => {
          setShowAddRepo(false);
          refetchRepos();
        }}
      />
    </div>
  );
}
