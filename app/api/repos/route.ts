import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const GITHUB_API_URL = "https://api.github.com";

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const folderId = searchParams.get("folder_id");
    const language = searchParams.get("language");
    const minStars = searchParams.get("min_stars");
    const dateRange = searchParams.get("date_range");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 15;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("repositories")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (language) {
      query = query.eq("language", language);
    }

    if (minStars) {
      query = query.gte("stars", parseInt(minStars));
    }

    if (dateRange) {
      const date = new Date();
      if (dateRange === "7d") date.setDate(date.getDate() - 7);
      else if (dateRange === "30d") date.setDate(date.getDate() - 30);
      else if (dateRange === "1y") date.setFullYear(date.getFullYear() - 1);

      if (dateRange !== "all") {
        query = query.gte("updated_at", date.toISOString());
      }
    }

    if (folderId && folderId !== "all") {
      // Need to handle inner join for folder filtering
      const { data: folderRepos } = await supabase
        .from("folder_repos")
        .select("repo_id")
        .eq("folder_id", folderId);

      const repoIds = folderRepos?.map((fr) => fr.repo_id) || [];
      if (repoIds.length > 0) {
        query = query.in("id", repoIds);
      } else {
        // Return absolutely nothing if the folder is empty
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }

    const {
      data: repos,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      repos: repos || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const { repo_owner, repo_name } = await req.json();

    if (!repo_owner || !repo_name) {
      return NextResponse.json(
        { error: "Owner and name are required" },
        { status: 400 },
      );
    }

    // Fetch repo details from GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    const repoResponse = await fetch(
      `${GITHUB_API_URL}/repos/${repo_owner}/${repo_name}`,
      {
        headers: {
          Authorization: githubToken ? `token ${githubToken}` : "",
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: "Repository not found on GitHub" },
        { status: 404 },
      );
    }

    const githubRepo = await repoResponse.json();

    // Insert or update repo in database
    const { data, error } = await supabase
      .from("github_repos")
      .upsert(
        {
          user_id: userId,
          repo_owner: githubRepo.owner.login,
          repo_name: githubRepo.name,
          repo_url: githubRepo.html_url,
          description: githubRepo.description,
          stars_count: githubRepo.stargazers_count,
          language: githubRepo.language,
        },
        { onConflict: "user_id,repo_owner,repo_name" },
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
