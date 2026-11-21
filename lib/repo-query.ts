export const REPO_PAGE_SIZE = 15;
/** Upper limit for one bulk selection. */
export const MAX_BULK_REPOS = 2000;
/** Keeps `.in()` filters well inside URL length limits. */
export const ID_CHUNK_SIZE = 200;

export const UNCATEGORIZED_FOLDER = "none";

export const REPO_SORTS = ["updated", "stars", "name"] as const;
export type RepoSort = (typeof REPO_SORTS)[number];

const DATE_RANGES = new Set(["7d", "30d", "1y"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RepoFilters {
  search: string;
  folderId: string | null;
  language: string | null;
  minStars: number | null;
  dateRange: string | null;
  sort: RepoSort;
}

/**
 * Strips characters that have meaning inside a PostgREST `or=(...)` filter
 * (`,` `(` `)` `.` `:`) or inside an ILIKE pattern (`%` `_` `*` `\`), so user
 * input cannot break the filter or inject extra clauses.
 */
function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,().:%_*\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function parseRepoFilters(params: URLSearchParams): RepoFilters {
  const folder = params.get("folder_id");
  const minStars = Number.parseInt(params.get("min_stars") || "", 10);
  const dateRange = params.get("date_range");
  const sort = params.get("sort") as RepoSort | null;

  return {
    search: sanitizeSearch(params.get("search") || ""),
    folderId:
      folder === UNCATEGORIZED_FOLDER || (folder && UUID.test(folder)) ? folder : null,
    language: params.get("language")?.slice(0, 50) || null,
    minStars: Number.isFinite(minStars) && minStars > 0 ? minStars : null,
    dateRange: dateRange && DATE_RANGES.has(dateRange) ? dateRange : null,
    sort: sort && REPO_SORTS.includes(sort) ? sort : "updated",
  };
}

/** Columns to select, with the join the folder filter needs. */
export function repoSelect(filters: RepoFilters, columns = "*"): string {
  if (filters.folderId === UNCATEGORIZED_FOLDER) {
    return `${columns}, folder_repos!left(repo_id)`;
  }
  if (filters.folderId) return `${columns}, folder_repos!inner(folder_id)`;
  return columns;
}

/** Applies the shared repository filters to a query on `repositories`. */
export function applyRepoFilters<Q>(query: Q, filters: RepoFilters): Q {
  let q = query as any;

  if (filters.search) {
    q = q.or(`name.ilike.*${filters.search}*,description.ilike.*${filters.search}*`);
  }
  if (filters.language) q = q.eq("language", filters.language);
  if (filters.minStars) q = q.gte("stars", filters.minStars);

  if (filters.dateRange) {
    const date = new Date();
    if (filters.dateRange === "7d") date.setDate(date.getDate() - 7);
    else if (filters.dateRange === "30d") date.setDate(date.getDate() - 30);
    else date.setFullYear(date.getFullYear() - 1);
    q = q.gte("updated_at", date.toISOString());
  }

  if (filters.folderId === UNCATEGORIZED_FOLDER) {
    q = q.is("folder_repos", null);
  } else if (filters.folderId) {
    q = q.eq("folder_repos.folder_id", filters.folderId);
  }

  return q as Q;
}

/** Applies the requested order, with `id` keeping pages stable on ties. */
export function applyRepoSort<Q>(query: Q, sort: RepoSort): Q {
  let q = query as any;
  if (sort === "stars") q = q.order("stars", { ascending: false });
  else if (sort === "name") q = q.order("name", { ascending: true });
  else q = q.order("updated_at", { ascending: false, nullsFirst: false });
  return q.order("id", { ascending: true }) as Q;
}

export function chunk<T>(items: T[], size = ID_CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export type FolderRepoSort = "manual" | "updated" | "stars" | "name" | "added";

interface FolderRepoRow {
  position?: number | null;
  added_at?: string | null;
  repositories?: {
    updated_at?: string | null;
    stars?: number | null;
    name?: string | null;
  } | null;
}

const time = (value?: string | null) => (value ? new Date(value).getTime() : 0);

/** Orders the repos of one folder by that folder's saved sort. */
export function sortFolderRepos<T extends FolderRepoRow>(
  rows: T[],
  sort: FolderRepoSort,
): T[] {
  const compare: Record<FolderRepoSort, (a: T, b: T) => number> = {
    manual: (a, b) => (a.position ?? 0) - (b.position ?? 0),
    updated: (a, b) =>
      time(b.repositories?.updated_at) - time(a.repositories?.updated_at),
    stars: (a, b) => (b.repositories?.stars ?? 0) - (a.repositories?.stars ?? 0),
    name: (a, b) =>
      (a.repositories?.name ?? "").localeCompare(b.repositories?.name ?? ""),
    added: (a, b) => time(b.added_at) - time(a.added_at),
  };
  return [...rows].sort(compare[sort] ?? compare.updated);
}
