import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import {
  GITHUB_API_URL,
  REPO_UPSERT_CONFLICT,
  githubHeaders,
  mapGithubRepo,
} from "@/lib/github";

const PER_PAGE = 100;
// Pages processed per request, to stay under serverless timeouts.
const MAX_PAGES_PER_CALL = 3;

/**
 * Full re-sync of the user's GitHub repos, resumable across calls.
 *
 * A run starts at page 1 and stamps every upserted row with the run's start
 * time. Progress is stored in users.sync_page. When the last page is reached,
 * rows not seen during the run (deleted / transferred repos) are removed,
 * except repos the user added by hand via POST /api/repos.
 */
export async function POST() {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("github_access_token, sync_page, sync_run_started_at")
      .eq("id", userId)
      .single();

    if (userError || !user?.github_access_token) {
      return NextResponse.json(
        { error: "No GitHub token found. Please reconnect your GitHub account." },
        { status: 400 },
      );
    }

    const githubToken = decryptToken(user.github_access_token);

    // Resume the current run, or start a new one
    let page: number = user.sync_page ?? 1;
    let runStartedAt: string = user.sync_run_started_at;
    if (!user.sync_page || !runStartedAt) {
      page = 1;
      runStartedAt = new Date().toISOString();
    }

    let totalSynced = 0;
    let finished = false;

    for (let i = 0; i < MAX_PAGES_PER_CALL; i++) {
      const response = await fetch(
        `${GITHUB_API_URL}/user/repos?per_page=${PER_PAGE}&sort=full_name&page=${page}`,
        { headers: githubHeaders(githubToken) },
      );

      if (!response.ok) {
        if (response.status === 401) {
          await supabase
            .from("users")
            .update({
              github_access_token: null,
              sync_page: null,
              sync_run_started_at: null,
            })
            .eq("id", userId);
          return NextResponse.json(
            { error: "GitHub token expired. Please reconnect your GitHub account." },
            { status: 401 },
          );
        }
        // Transient failure: keep the cursor so the next call retries this page
        break;
      }

      const repos = await response.json();
      if (!Array.isArray(repos)) break;

      if (repos.length > 0) {
        const { error: upsertError } = await supabase
          .from("repositories")
          .upsert(
            repos.map((repo: any) => mapGithubRepo(repo, userId, runStartedAt)),
            { onConflict: REPO_UPSERT_CONFLICT },
          );

        if (upsertError) {
          console.error("Error upserting repos:", upsertError);
          break;
        }
        totalSynced += repos.length;
      }

      if (repos.length < PER_PAGE) {
        finished = true;
        break;
      }
      page++;
    }

    if (finished) {
      // Remove repos that no longer exist on GitHub (folder links cascade)
      const { error: pruneError } = await supabase
        .from("repositories")
        .delete()
        .eq("user_id", userId)
        .eq("added_manually", false)
        .lt("synced_at", runStartedAt);
      if (pruneError) console.error("Error pruning stale repos:", pruneError);

      await supabase
        .from("users")
        .update({
          sync_page: null,
          sync_run_started_at: null,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else {
      await supabase
        .from("users")
        .update({ sync_page: page, sync_run_started_at: runStartedAt })
        .eq("id", userId);
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      hasMore: !finished,
    });
  } catch (error) {
    console.error("Background sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
