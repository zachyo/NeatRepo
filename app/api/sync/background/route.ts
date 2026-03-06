import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const GITHUB_API_URL = "https://api.github.com";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user's stored GitHub access token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("github_access_token")
      .eq("id", userId)
      .single();

    if (userError || !user?.github_access_token) {
      return NextResponse.json(
        {
          error: "No GitHub token found. Please reconnect your GitHub account.",
        },
        { status: 400 },
      );
    }

    const githubToken = user.github_access_token;

    // Get total count of repos stored so far
    const { count: existingCount } = await supabase
      .from("repositories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // If we already have 100 stored repos, sync subsequent pages in background.
    // We start from page 2+ since page 1 was already synced at login.
    let page = Math.floor((existingCount || 0) / 100) + 1;
    if (page <= 1) page = 2; // Always start from page 2 at minimum

    let totalSynced = 0;
    let hasMore = true;

    // Limit per background call to avoid timeout (3 pages max = 300 repos)
    const MAX_PAGES = 3;
    let pagesProcessed = 0;

    while (hasMore && pagesProcessed < MAX_PAGES) {
      const response = await fetch(
        `${GITHUB_API_URL}/user/repos?per_page=100&sort=updated&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired/revoked — clear it
          await supabase
            .from("users")
            .update({ github_access_token: null })
            .eq("id", userId);
          return NextResponse.json(
            {
              error:
                "GitHub token expired. Please reconnect your GitHub account.",
            },
            { status: 401 },
          );
        }
        break;
      }

      const repos = await response.json();

      if (!repos || repos.length === 0) {
        hasMore = false;
        break;
      }

      // Upsert this page of repos
      const { error: upsertError } = await supabase.from("repositories").upsert(
        repos.map((repo: any) => ({
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
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "github_repo_id" },
      );

      if (upsertError) {
        console.error("Error upserting repos:", upsertError);
        break;
      }

      totalSynced += repos.length;
      pagesProcessed++;
      page++;

      // If we got fewer than 100, there are no more pages
      if (repos.length < 100) {
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      hasMore,
    });
  } catch (error) {
    console.error("Background sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
