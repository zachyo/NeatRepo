"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce-pro";
import { apiSend, errorMessage } from "@/lib/api-client";
import { REPO_PAGE_SIZE, UNCATEGORIZED_FOLDER } from "@/lib/repo-query";
import { useFolders, useInvalidateRepoData, useRepositories } from "@/hooks/queries";
import RepoFilters, { DEFAULT_REPO_FILTERS, type RepoFilterValues } from "./repo-filters";
import RepositoriesTable, { type Repo } from "./repositories-table";

interface RepoBrowserProps {
  /** Fixes the list to one view, such as repos not in any folder. */
  lockedFolder?: string;
  actions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Filterable, paginated repository list shared by the dashboard pages. */
export default function RepoBrowser({
  lockedFolder,
  actions,
  emptyTitle,
  emptyDescription,
}: RepoBrowserProps) {
  const invalidate = useInvalidateRepoData();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RepoFilterValues>({
    ...DEFAULT_REPO_FILTERS,
    folder: lockedFolder ?? "all",
  });

  const { data: foldersData } = useFolders({ queryParams: { search: "" } });
  const folders = Array.isArray(foldersData) ? foldersData : [];

  /** Filters only, so paging does not count as a new selection scope. */
  const filterParams = useMemo(
    () => ({
      search: filters.search,
      sort: filters.sort,
      ...(filters.folder !== "all" && { folder_id: filters.folder }),
      ...(filters.language !== "all" && { language: filters.language }),
      ...(filters.date !== "all" && { date_range: filters.date }),
      ...(filters.stars !== "all" && { min_stars: filters.stars }),
    }),
    [filters],
  );

  const {
    data: reposData,
    isLoading,
    refetch,
    isRefetching,
  } = useRepositories(
    { queryParams: { ...filterParams, page: String(page) } },
    lockedFolder ?? "all",
  );

  const { run } = useDebouncedCallback(() => {
    refetch();
  }, 500);

  useEffect(() => {
    run();
  }, [page, filterParams]);

  const handleToggleFavorite = async (repo: Repo) => {
    try {
      await apiSend(`/api/repos/${repo.id}`, "PUT", { is_favorite: !repo.is_favorite });
      await invalidate();
      toast.success(repo.is_favorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const activeFolderId =
    filters.folder !== "all" && filters.folder !== UNCATEGORIZED_FOLDER
      ? filters.folder
      : null;

  return (
    <div className="space-y-4">
      <RepoFilters
        values={filters}
        onChange={(next) => {
          setFilters((current) => ({ ...current, ...next }));
          setPage(1);
        }}
        folders={folders}
        hideFolderFilter={!!lockedFolder}
        actions={actions}
      />
      <div>
        <RepositoriesTable
          repos={reposData?.repos ?? []}
          loading={isLoading}
          refetching={isRefetching}
          search={filters.search}
          page={page}
          onPageChange={setPage}
          totalItems={reposData?.total ?? 0}
          itemsPerPage={reposData?.limit ?? REPO_PAGE_SIZE}
          folders={folders}
          onToggleFavorite={handleToggleFavorite}
          filterParams={filterParams}
          activeFolderId={activeFolderId}
          containerId={`repositories:${lockedFolder ?? "all"}`}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    </div>
  );
}
