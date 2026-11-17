"use client";

import { use, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  GitBranch,
  Trash2,
  ExternalLink,
  X,
  ChevronRight,
  Globe,
  Lock,
} from "lucide-react";
import FolderRepositoriesTable from "@/components/dashboard/folder-repositories-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useFolder } from "@/hooks/queries";
import { HeaderContext } from "@/app/dashboard/layout";

interface Repo {
  id: string;
  repo_name: string;
  repo_owner: string;
  repo_url: string;
  description?: string;
  stars_count?: number;
  language?: string;
}

interface PageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { folderId } = use(params);

  const { data: folder, isLoading: loading, refetch } = useFolder(folderId);
  const { setHeaderTitle } = useContext(HeaderContext);

  useEffect(() => {
    if (folder?.name) {
      setHeaderTitle(folder.name);
    }
    return () => setHeaderTitle("");
  }, [folder?.name, setHeaderTitle]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 mt-3">
          <Skeleton className="w-64 h-6" />
          <Skeleton className="w-80 h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 h-32 flex flex-col justify-center gap-3">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-16 h-8" />
          </Card>
        </div>
        <div className="space-y-4">
          <Skeleton className="w-64 h-8" />
          <Card className="h-96">
            <Skeleton className="w-full h-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="rounded-xl border-dashed border-gray-300 bg-white px-6 py-12 shadow-none">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="font-medium text-gray-900">Folder not found</p>
            <p className="mt-1 text-sm text-gray-500">
              It may have been deleted, or it belongs to another account.
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/dashboard/folders">Back to folders</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const repoCount = folder.folder_repos?.length || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Breadcrumb + title */}
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="-ml-2 mr-1 flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
          </button>
          <Link href="/dashboard/folders" className="transition-colors hover:text-gray-900">
            Folders
          </Link>
          <ChevronRight className="size-4 text-gray-400" />
          <span aria-current="page" className="truncate font-medium text-gray-900">
            {folder.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-xl">
            {folder.icon || "📁"}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold text-gray-900">{folder.name}</h2>
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <span className="tabular-nums">
                {repoCount} {repoCount === 1 ? "repository" : "repositories"}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                {folder.is_public ? (
                  <>
                    <Globe className="size-3.5" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5" /> Private
                  </>
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      <FolderRepositoriesTable
        repos={folder.folder_repos || []}
        folderId={folderId as string}
        onUpdate={refetch}
      />
    </div>
  );
}
