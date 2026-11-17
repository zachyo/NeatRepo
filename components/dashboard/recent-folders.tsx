"use client";

import Link from "next/link";
import { Clock, Folder as FolderIcon, GitBranch, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  icon?: string;
  repo_count?: number;
  last_opened?: string;
  is_pinned?: boolean;
}

interface RecentFoldersProps {
  folders: Folder[];
  onTogglePin?: (e: React.MouseEvent, folder: Folder) => void;
}

function formatRelative(dateString?: string) {
  if (!dateString) return "Never opened";
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function RecentFolders({
  folders,
  onTogglePin,
}: RecentFoldersProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-gray-900">Recent folders</h2>
        <Link
          href="/dashboard/folders"
          className="text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {folders.map((folder) => (
          <div key={folder.id} className="group relative">
            <Link
              href={`/dashboard/folders/${folder.id}`}
              className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-base">
                  {folder.icon && folder.icon !== "📁" ? (
                    folder.icon
                  ) : (
                    <FolderIcon className="size-4 text-blue-600" />
                  )}
                </span>
                <h3 className="min-w-0 flex-1 truncate pr-8 font-medium text-gray-900">
                  {folder.name}
                </h3>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <GitBranch className="size-3.5" />
                  {folder.repo_count ?? 0} repos
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatRelative(folder.last_opened)}
                </span>
              </div>
            </Link>

            {onTogglePin && (
              <button
                type="button"
                onClick={(e) => onTogglePin(e, folder)}
                aria-label={folder.is_pinned ? `Unpin ${folder.name}` : `Pin ${folder.name}`}
                aria-pressed={!!folder.is_pinned}
                title={folder.is_pinned ? "Unpin folder" : "Pin folder"}
                className={cn(
                  "absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-lg transition-[opacity,color,background-color] hover:bg-gray-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  folder.is_pinned
                    ? "text-amber-500"
                    : "text-gray-400 opacity-0 hover:text-gray-700 group-hover:opacity-100",
                )}
              >
                {folder.is_pinned ? (
                  <Pin className="size-4 fill-current group-hover:hidden" />
                ) : null}
                {folder.is_pinned ? (
                  <PinOff className="hidden size-4 group-hover:block" />
                ) : (
                  <Pin className="size-4" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
