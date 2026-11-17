"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRepoLanguages } from "@/hooks/queries";

export interface RepoFilterValues {
  search: string;
  folder: string;
  language: string;
  date: string;
  stars: string;
}

export const DEFAULT_REPO_FILTERS: RepoFilterValues = {
  search: "",
  folder: "all",
  language: "all",
  date: "all",
  stars: "all",
};

interface RepoFiltersProps {
  values: RepoFilterValues;
  onChange: (next: Partial<RepoFilterValues>) => void;
  folders: { id: string; name: string }[];
  /** Extra controls rendered at the end of the search row (e.g. an Add button). */
  actions?: React.ReactNode;
}

/** Search box plus folder / language / date / stars filters for repo lists. */
export default function RepoFilters({
  values,
  onChange,
  folders,
  actions,
}: RepoFiltersProps) {
  const { data: languagesData } = useRepoLanguages();
  const languages: string[] = Array.isArray(languagesData) ? languagesData : [];

  const activeCount = (["folder", "language", "date", "stars"] as const).filter(
    (k) => values[k] !== "all",
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            aria-label="Search repositories"
            placeholder="Search by name or description"
            value={values.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="bg-white pl-9"
          />
        </div>
        {actions && <div className="flex gap-2 sm:ml-auto">{actions}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select value={values.folder} onValueChange={(v) => onChange({ folder: v })}>
          <SelectTrigger aria-label="Filter by folder" className="h-9 w-full bg-white sm:w-[160px]">
            <SelectValue placeholder="All folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All folders</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.language} onValueChange={(v) => onChange({ language: v })}>
          <SelectTrigger aria-label="Filter by language" className="h-9 w-full bg-white sm:w-[160px]">
            <SelectValue placeholder="All languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.date} onValueChange={(v) => onChange({ date: v })}>
          <SelectTrigger aria-label="Filter by last update" className="h-9 w-full bg-white sm:w-[160px]">
            <SelectValue placeholder="Updated any time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Updated any time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={values.stars} onValueChange={(v) => onChange({ stars: v })}>
          <SelectTrigger aria-label="Filter by stars" className="h-9 w-full bg-white sm:w-[140px]">
            <SelectValue placeholder="Any stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any stars</SelectItem>
            <SelectItem value="10">10+ stars</SelectItem>
            <SelectItem value="50">50+ stars</SelectItem>
            <SelectItem value="100">100+ stars</SelectItem>
            <SelectItem value="1000">1,000+ stars</SelectItem>
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() =>
              onChange({ folder: "all", language: "all", date: "all", stars: "all" })
            }
            className="col-span-2 inline-flex h-9 items-center justify-center gap-1 sm:justify-start rounded-md px-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
