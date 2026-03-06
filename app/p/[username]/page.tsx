"use client";

import { use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  GitBranch,
  Star,
  Folder,
  Pin,
  ArrowLeft,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import folderIcon from "@/public/folder.svg";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePublicProfile } from "@/hooks/queries";

interface Repo {
  id: string;
  name: string;
  full_name: string;
  url: string;
  language?: string;
  stars: number;
  description?: string;
}

interface FolderData {
  id: string;
  name: string;
  icon?: string;
  is_pinned?: boolean;
  folder_repos?: { count: number }[];
}

interface ProfileData {
  user: {
    username: string;
    avatar_url?: string;
    member_since: string;
  };
  folders: FolderData[];
  favoriteRepos: Repo[];
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const { data, isLoading: loading, error } = usePublicProfile(username);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 flex-1 w-full">
          <div className="flex items-center gap-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 mt-20 w-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Profile not found
            </h1>
            <p className="text-gray-500">
              This profile doesn&apos;t exist or has been set to private.
            </p>
            <Link href="/">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to NeatRepo
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    const { user, folders, favoriteRepos } = data;
    const memberYear = new Date(user.member_since).getFullYear();

    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 flex-1 w-full">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-20 h-20 rounded-full border-2 border-gray-200 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-blue-500" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              @{user.username}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              NeatRepo member since {memberYear} ·{" "}
              <a
                href={`https://github.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on GitHub
              </a>
            </p>
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>
                <strong className="text-gray-900">{folders.length}</strong>{" "}
                folders
              </span>
              <span>
                <strong className="text-gray-900">
                  {favoriteRepos.length}
                </strong>{" "}
                favorites
              </span>
            </div>
          </div>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-600" />
              Folders
            </h2>
            <div className="flex flex-wrap gap-4">
              {folders.map((folder: FolderData) => {
                const repoCount = folder.folder_repos?.[0]?.count ?? 0;
                return (
                  <Link
                    href={`/p/${username}/folders/${folder.id}`}
                    key={folder.id}
                  >
                    <Card className="bg-white hover:shadow-md transition cursor-pointer h-full border-none pb-2 shadow-none">
                      <div className="relative">
                        <Image
                          src={folderIcon}
                          alt={folder.name}
                          className="w-28 h-28 md:w-48 md:h-48"
                        />
                        <div className="absolute top-1 md:top-6 right-4 md:right-7 flex items-center gap-1 text-xs md:text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                          <GitBranch className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span>{repoCount || 0}</span>
                        </div>
                        {folder.is_pinned && (
                          <div className="absolute top-2 left-2 p-1.5 bg-blue-100/80 backdrop-blur-sm rounded-md text-blue-600">
                            <Pin className="w-4 h-4 fill-current" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm md:text-lg text-center -mt-3 md:-mt-6 font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {folder.name}
                      </h3>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Favorite Repos */}
        {favoriteRepos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Favorite Repositories
            </h2>
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
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
                    {favoriteRepos.map((repo: Repo) => (
                      <TableRow
                        key={repo.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">
                              {repo.name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
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
                              <span className="hidden md:inline mr-2">
                                View
                              </span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>
        )}

        {folders.length === 0 && favoriteRepos.length === 0 && (
          <Card className="p-12 text-center border-gray-200 bg-white">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nothing to show yet</p>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur w-full">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
          >
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-semibold text-sm">NeatRepo</span>
          </Link>
          <span className="text-sm text-gray-500">
            {username}&apos;s profile
          </span>
        </div>
      </nav>

      {renderContent()}
    </div>
  );
}
