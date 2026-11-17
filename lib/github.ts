export const GITHUB_API_URL = "https://api.github.com";

/** Maps a GitHub REST repo object to a row in public.repositories. */
export function mapGithubRepo(repo: any, userId: string, syncedAt: string) {
  return {
    github_repo_id: repo.id,
    user_id: userId,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    private: repo.private,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updated_at: repo.updated_at,
    synced_at: syncedAt,
  };
}

/** Conflict target matching the unique (user_id, github_repo_id) constraint. */
export const REPO_UPSERT_CONFLICT = "user_id,github_repo_id";

export function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}
