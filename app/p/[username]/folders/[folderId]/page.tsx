"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, Star, Folder, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { usePublicFolderData } from "@/hooks/queries";

interface Repo {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  language?: string;
  stars: number;
}

interface Folder {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  created_at: string;
}

interface FolderPageData {
  folder: Folder;
  repos: Repo[];
}

interface PageProps {
  params: Promise<{ username: string; folderId: string }>;
}

export default function PublicFolderPage({ params }: PageProps) {
  const { username, folderId } = use(params);
  const {
    data,
    isLoading: loading,
    error,
  } = usePublicFolderData(username, folderId);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 flex-1 w-full">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 mt-20 w-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Folder not found
            </h1>
            <p className="text-gray-500 max-w-sm">
              This folder doesn&apos;t exist, belongs to a private profile, or
              you don&apos;t have access to it.
            </p>
            <Link href={`/p/${username}`}>
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {username}&apos;s profile
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    const { folder, repos } = data;

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8 flex-1 w-full">
        {/* Breadcrumb Back */}
        <div>
          <Link
            href={`/p/${username}`}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to profile
          </Link>
        </div>

        {/* Folder Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-3xl">{folder.icon || "📁"}</span>
              {folder.name}
            </h1>
            {folder.description && (
              <p className="text-gray-600 mt-2 max-w-2xl">
                {folder.description}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              {repos.length} repositor{repos.length === 1 ? "y" : "ies"}
            </p>
          </div>
        </div>

        {/* Repositories Table */}
        <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
          {repos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-[300px]">Repository</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="w-[120px]">Language</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Stars
                    </TableHead>
                    <TableHead className="w-[100px] text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repos.map((repo: any) => (
                    <TableRow
                      key={repo.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {repo.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[280px]">
                            {repo.full_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                          {repo.description || (
                            <span className="text-gray-400 italic">
                              No description
                            </span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        {repo.language ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {repo.language}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-600">
                          <Star className="w-3.5 h-3.5 fill-current text-gray-400 group-hover:text-yellow-500 transition-colors" />
                          <span className="text-sm font-medium">
                            {repo.stars || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="hidden md:inline mr-2">View</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No repositories
              </h3>
              <p className="text-gray-500 mt-1">
                There are no repositories in this folder yet.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur w-full">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
          >
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-semibold text-sm">NeatRepo</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href={`/p/${username}`}
              className="hover:text-blue-600 font-medium"
            >
              {username}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[150px] sm:max-w-none flex items-center">
              {loading ? (
                <Skeleton className="w-20 h-4" />
              ) : data?.folder?.name ? (
                data.folder.name
              ) : (
                "Folder"
              )}
            </span>
          </div>
        </div>
      </nav>

      {renderContent()}
    </div>
  );
}
