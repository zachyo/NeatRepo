import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto";
import { GITHUB_API_URL, githubHeaders } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().slice(0, 256);
    const page = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1),
    );

    if (query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 },
      );
    }

    const { data: user } = await createAdminClient()
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

    const response = await fetch(
      `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${page}&per_page=15`,
      { headers: githubHeaders(decryptToken(user.github_access_token)) },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error ${response.status}`);
    }

    const data = await response.json();

    const repos =
      data.items?.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        avatar: repo.owner.avatar_url,
      })) || [];

    return NextResponse.json({
      repos,
      total_count: data.total_count,
      page,
    });
  } catch (error) {
    console.error("Error searching GitHub:", error);
    return NextResponse.json(
      { error: "Failed to search GitHub" },
      { status: 500 },
    );
  }
}
