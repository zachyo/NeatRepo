"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import CreateFolderDialog from "@/components/dashboard/create-folder-dialog";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import RecentFolders from "@/components/dashboard/recent-folders";
import RepoBrowser from "@/components/dashboard/repo-browser";
import { apiSend, errorMessage } from "@/lib/api-client";
import {
  useFolders,
  useInvalidateRepoData,
  useRepoStats,
  useUser,
} from "@/hooks/queries";

export default function DashboardPage() {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const invalidate = useInvalidateRepoData();

  const { data: foldersData } = useFolders({ queryParams: { search: "" } });
  const { data: userData } = useUser();
  const { data: stats } = useRepoStats();

  const folders = Array.isArray(foldersData) ? foldersData : [];

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
        invalidate();
      } catch {
        // Silent fail for background sync
      }
    };
    runBackgroundSync();
  }, [invalidate]);

  const handleCreateFolder = async (name: string, isPublic = false) => {
    try {
      await apiSend("/api/folders", "POST", { name, is_public: isPublic });
      setShowCreateFolder(false);
      await invalidate();
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleTogglePin = async (
    e: React.MouseEvent,
    folder: { id: string; is_pinned?: boolean },
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiSend(`/api/folders/${folder.id}`, "PUT", { is_pinned: !folder.is_pinned });
      await invalidate();
      toast.success(folder.is_pinned ? "Folder unpinned" : "Folder pinned");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const recentFolders = folders.slice(0, 4);

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

      <DashboardStats
        totalFolders={folders.length}
        totalRepos={stats?.total ?? 0}
        uncategorizedRepos={stats?.uncategorized ?? 0}
        onCreateFolder={() => setShowCreateFolder(true)}
      />

      {recentFolders.length > 0 && (
        <RecentFolders folders={recentFolders} onTogglePin={handleTogglePin} />
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">All repositories</h2>
        <RepoBrowser />
      </section>

      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}
