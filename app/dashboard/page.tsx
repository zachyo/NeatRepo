"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder, GitBranch, Github } from "lucide-react";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import RecentFolders from "@/components/dashboard/recent-folders";
import RepositoriesTable from "@/components/dashboard/repositories-table";
import RepoFilters from "@/components/dashboard/repo-filters";
import CreateFolderDialog from "@/components/dashboard/create-folder-dialog";
import { useFolders, useRepositories, useUser } from "@/hooks/queries";
import { useDebouncedCallback } from "use-debounce-pro";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const [reposPage, setReposPage] = useState(1);
  const [reposSearch, setReposSearch] = useState("");
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

  const { data: userData } = useUser();

  const {
    data: reposData,
    isLoading,
    refetch: refetchRepos,
    isRefetching: isRefetchingRepos,
  } = useRepositories({
    queryParams: {
      page: String(reposPage),
      search: reposSearch,
      ...(filterFolder !== "all" && { folder_id: filterFolder }),
      ...(filterLanguage !== "all" && { language: filterLanguage }),
      ...(filterDate !== "all" && { date_range: filterDate }),
      ...(filterStars !== "all" && { min_stars: filterStars }),
    },
  });

  const { run, isPending } = useDebouncedCallback(() => {
    refetchRepos();
  }, 500);

  // console.log({ isPending: isPending(), isRefetchingRepos });

  useEffect(() => {
    run();
  }, [
    reposPage,
    reposSearch,
    filterFolder,
    filterLanguage,
    filterDate,
    filterStars,
  ]);

  // Full background re-sync with GitHub (resumable; continues while hasMore)
  useEffect(() => {
    const runBackgroundSync = async () => {
      try {
        for (let i = 0; i < 5; i++) {
          const res = await fetch("/api/sync/background", { method: "POST" });
          if (!res.ok) break;
          const result = await res.json();
          if (!result.hasMore) break;
        }
        refetchRepos();
      } catch (e) {
        // Silent fail for background sync
      }
    };
    runBackgroundSync();
  }, []);

  const handleCreateFolder = async (name: string, isPublic = false) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_public: isPublic }),
      });

      if (response.ok) {
        setShowCreateFolder(false);
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

  const handleTogglePin = async (
    e: React.MouseEvent,
    folder: { id: string; is_pinned?: boolean },
  ) => {
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

  const recentFolders = foldersData?.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {userData?.username ? `Welcome back, ${userData.username}` : "Welcome back"}
        </h2>
        <p className="mt-1 text-pretty text-sm text-gray-500">
          Here&apos;s what&apos;s in your workspace.
        </p>
      </div>

      {/* Top Stats Cards */}
      <DashboardStats
        totalFolders={foldersData?.length ?? 0}
        totalRepos={reposData?.total ?? 0}
        onCreateFolder={() => setShowCreateFolder(true)}
      />

      {/* Recent Folders */}
      {recentFolders?.length > 0 && (
        <RecentFolders folders={recentFolders} onTogglePin={handleTogglePin} />
      )}

      {/* All Repositories */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">All repositories</h2>
        <RepoFilters
          values={{
            search: reposSearch,
            folder: filterFolder,
            language: filterLanguage,
            date: filterDate,
            stars: filterStars,
          }}
          onChange={(next) => {
            if (next.search !== undefined) setReposSearch(next.search);
            if (next.folder !== undefined) setFilterFolder(next.folder);
            if (next.language !== undefined) setFilterLanguage(next.language);
            if (next.date !== undefined) setFilterDate(next.date);
            if (next.stars !== undefined) setFilterStars(next.stars);
            setReposPage(1);
          }}
          folders={foldersData ?? []}
        />

        <RepositoriesTable
          repos={reposData?.repos ?? []}
          loading={isLoading}
          refetching={isRefetchingRepos}
          search={reposSearch}
          page={reposPage}
          onPageChange={setReposPage}
          totalItems={reposData?.total}
          itemsPerPage={reposData?.limit}
          folders={foldersData ?? []}
          onReposUpdate={refetchRepos}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}
