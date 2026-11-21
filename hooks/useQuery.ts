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

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new HttpError(res.status, body?.error ?? "Request failed");
      }
      return res.json();
    },
    // A 4xx will not succeed on retry (not found, signed out, invalid input).
    retry: (failureCount, error) =>
      !(error instanceof HttpError && error.status < 500) && failureCount < 2,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // won't refetch for 5 mins
  });
