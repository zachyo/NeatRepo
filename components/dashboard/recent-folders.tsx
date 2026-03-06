"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Clock, GitBranch, Pin, PinOff } from "lucide-react";
import Image from "next/image";
import folderIcon from "@/public/folder.svg";

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

export default function RecentFolders({
  folders,
  onTogglePin,
}: RecentFoldersProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        Suggested from activity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <Link key={folder.id} href={`/dashboard/folders/${folder.id}`}>
            <Card className="group bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition p-1.5 cursor-pointer h-full">
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-blue-100 rounded-sm p-2 w-full">
                    <Image
                      src={folderIcon}
                      alt={folder.name}
                      className="w-full h-full"
                    />
                  </div>
                  {folder.is_pinned && (
                    <div className="absolute top-1 left-1 p-1.5 bg-blue-100/80 backdrop-blur-sm rounded-md text-blue-600">
                      <Pin className="w-4 h-4 fill-current" />
                    </div>
                  )}
                </div>
                {onTogglePin && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10">
                    <button
                      onClick={(e) => onTogglePin(e, folder)}
                      className={`p-2 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 transition ${
                        folder.is_pinned
                          ? "text-blue-600"
                          : "text-gray-400 hover:text-blue-600"
                      }`}
                      title={folder.is_pinned ? "Unpin folder" : "Pin folder"}
                    >
                      {folder.is_pinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate mt-1">
                {folder.name}
              </h3>
              <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-600 ">
                  <GitBranch className="w-4 h-4 flex-shrink-0" />
                  <span>{folder.repo_count || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(folder.last_opened)}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
