import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryCall } from "./useQuery";

type options = {
  queryParams?: { [key: string]: string };
  enabled?: boolean;
};

/** `scope` keeps separately filtered lists from sharing one cache entry. */
export const useRepositories = (options?: options, scope = "all") =>
  useQueryCall({
    queryKey: ["repositories", scope],
    url: "/api/repos",
    options,
  });

/** Refreshes everything that shows folders, repos, or their counts. */
export function useInvalidateRepoData() {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      Promise.all(
        ["folders", "folder", "repositories", "repoStats"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
    [queryClient],
  );
}

export const useFolders = (options?: options) =>
  useQueryCall({
    queryKey: "folders",
    url: "/api/folders",
    options,
  });

export const useFolder = (folderId: string, options?: options) =>
  useQueryCall({
    queryKey: ["folder", folderId],
    url: `/api/folders/${folderId}`,
    options: {
      ...options,
      enabled: !!folderId && (options?.enabled ?? true),
    },
  });

export const usePublicProfile = (username: string, options?: options) =>
  useQueryCall({
    queryKey: ["publicProfile", username],
    url: `/api/profile/${username}`,
    options: {
      ...options,
      enabled: !!username && (options?.enabled ?? true),
    },
  });

export const usePublicFolderData = (
  username: string,
  folderId: string,
  options?: options,
) =>
  useQueryCall({
    queryKey: ["publicFolder", username, folderId],
    url: `/api/profile/${username}/folders/${folderId}`,
    options: {
      ...options,
      enabled: !!username && !!folderId && (options?.enabled ?? true),
    },
  });

export const useUser = (options?: options) =>
  useQueryCall({
    queryKey: ["user"],
    url: "/api/user",
    options,
  });

export const useRepoStats = (options?: options) =>
  useQueryCall({
    queryKey: ["repoStats"],
    url: "/api/repos/stats",
    options,
  });

export const useRepoLanguages = (options?: options) =>
  useQueryCall({
    queryKey: ["repoLanguages"],
    url: "/api/repos/languages",
    options,
  });
