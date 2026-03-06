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
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="bg-white border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 font-medium">Folder not found</p>
            <Link href="/dashboard/folders">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                Back to Folders
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with Breadcrumb */}
      <div className="flex flex-col gap-4 mt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 text-base text-gray-600">
            <Link
              href="/dashboard/folders"
              className="hover:text-blue-600 font-semibold"
            >
              Folders
            </Link>
            <span>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </span>
            <span>{folder.name}</span>
          </div>
        </div>
        <div className="hidden">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">{folder.icon || "📁"}</span>
            {folder.name}
          </h1>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Repositories</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {folder.folder_repos?.length || 0}
          </p>
        </Card>
      </div>

      {/* Repositories List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Repositories in this folder
        </h2>

        <FolderRepositoriesTable
          repos={folder.folder_repos || []}
          folderId={folderId as string}
          onUpdate={refetch}
        />
      </div>
    </div>
  );
}
