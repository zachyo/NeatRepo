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

const PAGE_SIZE = 15;
const DATE_RANGES = new Set(["7d", "30d", "1y", "all"]);

/**
 * Strips characters that have meaning inside a PostgREST `or=(...)` filter
 * (`,` `(` `)` `.` `:`) or inside an ILIKE pattern (`%` `_` `*` `\`), so user
 * input cannot break the filter or inject extra clauses.
 */
function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,().:%_*\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = sanitizeSearch(searchParams.get("search") || "");
    const folderId = searchParams.get("folder_id");
    const language = searchParams.get("language");
    const minStars = Number.parseInt(searchParams.get("min_stars") || "", 10);
    const dateRange = searchParams.get("date_range");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from("repositories")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.*${search}*,description.ilike.*${search}*`);
    }

    if (language) {
      query = query.eq("language", language.slice(0, 50));
    }

    if (Number.isFinite(minStars) && minStars > 0) {
      query = query.gte("stars", minStars);
    }

    if (dateRange && DATE_RANGES.has(dateRange) && dateRange !== "all") {
      const date = new Date();
      if (dateRange === "7d") date.setDate(date.getDate() - 7);
      else if (dateRange === "30d") date.setDate(date.getDate() - 30);
      else if (dateRange === "1y") date.setFullYear(date.getFullYear() - 1);
      query = query.gte("updated_at", date.toISOString());
    }

    if (folderId && folderId !== "all") {
      // Only honour folders the user owns
      const { data: folder } = await supabase
        .from("folders")
        .select("id, folder_repos(repo_id)")
        .eq("id", folderId)
        .eq("created_by", userId)
        .maybeSingle();

      const repoIds: string[] =
        (folder?.folder_repos as { repo_id: string }[] | undefined)?.map(
          (fr) => fr.repo_id,
        ) || [];

      if (repoIds.length === 0) {
        return NextResponse.json({ repos: [], total: 0, page, limit: PAGE_SIZE });
      }
      query = query.in("id", repoIds);
    }

    const {
      data: repos,
      error,
      count,
    } = await query.range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    return NextResponse.json({
      repos: repos || [],
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
