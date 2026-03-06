import { useQueryCall } from "./useQuery";

type options = {
  queryParams?: { [key: string]: string };
  enabled?: boolean;
};
export const useRepositories = (options?: options) =>
  useQueryCall({
    queryKey: "repositories",
    url: "/api/repos",
    options,
  });

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
