"use client";

import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GitBranch, GripVertical, LayoutGrid, List, Lock, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/hooks/use-view-mode";

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

export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(next) => next && onChange(next as ViewMode)}
      aria-label="Repository layout"
      className="rounded-md border border-gray-200 bg-white p-0.5"
    >
      <ToggleGroupItem value="list" aria-label="List view" className="size-8 p-0">
        <List className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view" className="size-8 p-0">
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

interface CollectionProps {
  repos: Repo[];
  view: ViewMode;
  containerId: string;
  selected: Set<string>;
  onSelect: (repoId: string, checked: boolean) => void;
  onSelectPage: (checked: boolean) => void;
  /** Enables reordering. Dragging onto a folder works either way. */
  manualOrder?: boolean;
  dimmed?: boolean;
  renderActions: (repo: Repo) => React.ReactNode;
  renderMenuItems: (repo: Repo) => React.ReactNode;
}

type ItemProps = Pick<
  CollectionProps,
  "selected" | "onSelect" | "manualOrder" | "renderActions" | "renderMenuItems"
> & { repo: Repo };

function useRepoDrag({ repo, selected, manualOrder }: ItemProps) {
  const repoIds = selected.has(repo.id) ? [...selected] : [repo.id];
  const sortable = useSortable({
    id: repo.id,
    disabled: { droppable: !manualOrder },
    data: {
      type: "repo",
      repoIds,
      manual: !!manualOrder,
      label: repoIds.length > 1 ? `${repoIds.length} repositories` : repo.name,
    },
  });

  return {
    ...sortable,
    style: manualOrder
      ? {
          transform: CSS.Translate.toString(sortable.transform),
          transition: sortable.transition,
        }
      : undefined,
  };
}

function DragHandle({
  repo,
  drag,
}: {
  repo: Repo;
  drag: ReturnType<typeof useRepoDrag>;
}) {
  return (
    <button
      type="button"
      ref={drag.setActivatorNodeRef}
      {...drag.attributes}
      {...drag.listeners}
      aria-label={`Drag ${repo.name}`}
      title="Drag to a folder"
      className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );
}

function RepoTitle({ repo }: { repo: Repo }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
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
  );
}

function LanguageBadge({ language }: { language?: string }) {
  return language ? (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      {language}
    </span>
  ) : (
    <span className="text-sm text-gray-400">—</span>
  );
}

function StarCount({ stars }: { stars: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm tabular-nums text-gray-600">
      <Star className="size-3.5 text-gray-400" />
      {(stars || 0).toLocaleString()}
    </span>
  );
}

function RepoRow(props: ItemProps) {
  const { repo, selected, onSelect, renderActions, renderMenuItems } = props;
  const drag = useRepoDrag(props);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          ref={drag.setNodeRef}
          style={drag.style}
          className={cn(
            "bg-white transition-colors hover:bg-gray-50",
            selected.has(repo.id) && "bg-blue-50/50 hover:bg-blue-50/70",
            drag.isDragging && "opacity-40",
          )}
        >
          <td className="py-4 pl-3 pr-2">
            <div className="flex items-center gap-1.5">
              <DragHandle repo={repo} drag={drag} />
              <Checkbox
                checked={selected.has(repo.id)}
                onCheckedChange={(checked) => onSelect(repo.id, !!checked)}
                aria-label={`Select ${repo.name}`}
              />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <GitBranch className="size-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <RepoTitle repo={repo} />
                {repo.description && (
                  <p className="max-w-xs truncate text-sm text-gray-500">{repo.description}</p>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-600">{repo.full_name?.split("/")[0]}</td>
          <td className="px-6 py-4">
            <StarCount stars={repo.stars} />
          </td>
          <td className="px-6 py-4">
            <LanguageBadge language={repo.language} />
          </td>
          <td className="px-6 py-4 text-right">{renderActions(repo)}</td>
        </tr>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">{renderMenuItems(repo)}</ContextMenuContent>
    </ContextMenu>
  );
}

function RepoCard(props: ItemProps) {
  const { repo, selected, onSelect, renderActions, renderMenuItems } = props;
  const drag = useRepoDrag(props);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          ref={drag.setNodeRef}
          style={drag.style}
          className={cn(
            "flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300",
            selected.has(repo.id) && "border-blue-300 bg-blue-50/50",
            drag.isDragging && "opacity-40",
          )}
        >
          <div className="flex items-center gap-1.5">
            <DragHandle repo={repo} drag={drag} />
            <Checkbox
              checked={selected.has(repo.id)}
              onCheckedChange={(checked) => onSelect(repo.id, !!checked)}
              aria-label={`Select ${repo.name}`}
            />
            <div className="ml-1 min-w-0 flex-1">
              <RepoTitle repo={repo} />
            </div>
            <div className="shrink-0">{renderActions(repo)}</div>
          </div>
          <p className="mt-2 line-clamp-2 min-h-10 text-pretty text-sm text-gray-500">
            {repo.description || "No description"}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-gray-500">
              {repo.full_name?.split("/")[0]}
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <StarCount stars={repo.stars} />
              <LanguageBadge language={repo.language} />
            </div>
          </div>
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">{renderMenuItems(repo)}</ContextMenuContent>
    </ContextMenu>
  );
}

/** Repositories as a table or card grid, with selection and drag support. */
export default function RepoCollection({
  repos,
  view,
  containerId,
  selected,
  onSelect,
  onSelectPage,
  manualOrder = false,
  dimmed = false,
  renderActions,
  renderMenuItems,
}: CollectionProps) {
  const items = manualOrder ? repos.map((repo) => repo.id) : [];
  const itemProps = { selected, onSelect, manualOrder, renderActions, renderMenuItems };
  const pageSelected = repos.length > 0 && repos.every((repo) => selected.has(repo.id));

  if (view === "grid") {
    return (
      <SortableContext id={containerId} items={items} strategy={rectSortingStrategy}>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Checkbox
            id={`${containerId}-select-page`}
            checked={pageSelected}
            onCheckedChange={(checked) => onSelectPage(!!checked)}
          />
          <label htmlFor={`${containerId}-select-page`} className="text-sm text-gray-600">
            Select all on this page
          </label>
        </div>
        <ul
          className={cn(
            "grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3",
            dimmed && "opacity-50",
          )}
        >
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} {...itemProps} />
          ))}
        </ul>
      </SortableContext>
    );
  }

  return (
    <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50/80">
            <tr>
              <th className="w-20 py-3 pl-3 pr-2 text-left">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden className="size-6" />
                  <Checkbox
                    checked={pageSelected}
                    onCheckedChange={(checked) => onSelectPage(!!checked)}
                    aria-label="Select all on this page"
                  />
                </div>
              </th>
              {["Repository", "Owner", "Stars", "Language"].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500"
                >
                  {heading}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <SortableContext id={containerId} items={items} strategy={verticalListSortingStrategy}>
            <tbody
              className={cn(
                "divide-y divide-gray-100 transition-opacity",
                dimmed && "opacity-50",
              )}
            >
              {repos.map((repo) => (
                <RepoRow key={repo.id} repo={repo} {...itemProps} />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </div>
    </Card>
  );
}
