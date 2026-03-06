// hooks/useRepositories.ts
import { useQuery } from "@tanstack/react-query";

export const useRepositories = (userId: string) =>
  useQuery({
    queryKey: ["repositories", userId],
    queryFn: async () => {
      const res = await fetch(`/api/repos?user_id=${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // won't refetch for 5 mins
  });

type QueryDetails = {
  queryKey: string | string[];
  url: string;
  options?: { enabled?: boolean; queryParams?: { [key: string]: string } };
};

export const useQueryCall = ({ queryKey, url, options }: QueryDetails) =>
  useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const res = await fetch(
        url + "?" + new URLSearchParams(options?.queryParams).toString(),
      );
      return res.json();
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // won't refetch for 5 mins
  });
