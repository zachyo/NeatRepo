import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import {
  GITHUB_API_URL,
  REPO_UPSERT_CONFLICT,
  githubHeaders,
  mapGithubRepo,
} from "@/lib/github";
import { firstIssue, repoAddSchema } from "@/lib/validation";

import {
  REPO_PAGE_SIZE as PAGE_SIZE,
  applyRepoFilters,
  applyRepoSort,
  parseRepoFilters,
  repoSelect,
} from "@/lib/repo-query";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filters = parseRepoFilters(searchParams);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const base = supabase
      .from("repositories")
      .select(repoSelect(filters), { count: "exact" })
      .eq("user_id", userId);

    const {
      data: repos,
      error,
      count,
    } = await applyRepoSort(applyRepoFilters(base, filters), filters.sort).range(
      offset,
      offset + PAGE_SIZE - 1,
    );

    if (error) throw error;

    // The folder filter's join is not part of a repository row.
    const rows = ((repos ?? []) as unknown as Record<string, unknown>[]).map(
      ({ folder_repos: _join, ...repo }) => repo,
    );

    return NextResponse.json({
      repos: rows,
      total: count || 0,
      page,
      limit: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Adds a single GitHub repo (by owner/name) to the user's repositories. */
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = repoAddSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { repo_owner, repo_name } = parsed.data;

    const { data: user } = await supabase
      .from("users")
      .select("github_access_token")
      .eq("id", userId)
      .maybeSingle();

    if (!user?.github_access_token) {
      return NextResponse.json(
        { error: "No GitHub token found. Please reconnect your GitHub account." },
        { status: 400 },
      );
    }

    const repoResponse = await fetch(
      `${GITHUB_API_URL}/repos/${encodeURIComponent(repo_owner)}/${encodeURIComponent(repo_name)}`,
      { headers: githubHeaders(decryptToken(user.github_access_token)) },
    );

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: "Repository not found on GitHub" },
        { status: 404 },
      );
    }

    const githubRepo = await repoResponse.json();

    const { data, error } = await supabase
      .from("repositories")
      .upsert(
        {
          ...mapGithubRepo(githubRepo, userId, new Date().toISOString()),
          added_manually: true,
        },
        {
          onConflict: REPO_UPSERT_CONFLICT,
        },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error adding repo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
