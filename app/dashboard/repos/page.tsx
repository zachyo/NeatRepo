"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RepositoriesTable from "@/components/dashboard/repositories-table";
import AddRepoDialog from "@/components/dashboard/add-repo-dialog";
import { Plus } from "lucide-react";
import { useFolders, useRepositories } from "@/hooks/queries";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce-pro";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-5">
        <h1 className="text-2xl font-bold text-gray-900 hidden">
          Repositories
        </h1>
        <div className="flex-1 w-full md:max-w-md">
          <Input
            placeholder="Search by repo name or owner..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />
        </div>
        <Button
          onClick={() => setShowAddRepo(true)}
          className="bg-blue-600 text-white hover:bg-blue-700 w-full md:w-auto mt-2 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Repository
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filterFolder}
          onValueChange={(v) => {
            setFilterFolder(v);
            setPage(1);
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
            setPage(1);
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
            setPage(1);
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
            setPage(1);
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
