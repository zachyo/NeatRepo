"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder, GitBranch, Github } from "lucide-react";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import RecentFolders from "@/components/dashboard/recent-folders";
import RepositoriesTable from "@/components/dashboard/repositories-table";
import CreateFolderDialog from "@/components/dashboard/create-folder-dialog";
import { useFolders, useRepositories } from "@/hooks/queries";
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

  // Trigger background sync for repos beyond first 100
  useEffect(() => {
    const runBackgroundSync = async () => {
      try {
        const res = await fetch("/api/sync/background", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.synced > 0) {
            refetchRepos();
          }
        }
      } catch (e) {
        // Silent fail for background sync
      }
    };
    runBackgroundSync();
  }, []);

  const handleCreateFolder = async (name: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
    <div className="max-w-7xl mx-auto space-y-8 -mt-2">
      {/* Header */}
      <div className="flex. flex-col md:flex-row justify-between items-start md:items-center gap-4 hidden">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            GitHub Repository Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Organize and manage your GitHub repositories in folders
          </p>
        </div>
        <Button
          onClick={() => setShowCreateFolder(true)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
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
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Repositories</h2>
            <Input
              placeholder="Search repositories..."
              value={reposSearch}
              onChange={(e) => {
                setReposSearch(e.target.value);
                setReposPage(1);
              }}
              className="w-full sm:w-64"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filterFolder}
              onValueChange={(v) => {
                setFilterFolder(v);
                setReposPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {foldersData?.map((folder: any) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterLanguage}
              onValueChange={(v) => {
                setFilterLanguage(v);
                setReposPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="TypeScript">TypeScript</SelectItem>
                <SelectItem value="JavaScript">JavaScript</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Rust">Rust</SelectItem>
                <SelectItem value="Go">Go</SelectItem>
                <SelectItem value="HTML">HTML</SelectItem>
                <SelectItem value="CSS">CSS</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterDate}
              onValueChange={(v) => {
                setFilterDate(v);
                setReposPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Updated Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterStars}
              onValueChange={(v) => {
                setFilterStars(v);
                setReposPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Stars" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Stars</SelectItem>
                <SelectItem value="10">&gt; 10 Stars</SelectItem>
                <SelectItem value="50">&gt; 50 Stars</SelectItem>
                <SelectItem value="100">&gt; 100 Stars</SelectItem>
                <SelectItem value="1000">&gt; 1000 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}
