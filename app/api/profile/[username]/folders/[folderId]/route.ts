import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; folderId: string }> },
) {
  const supabase = createAdminClient();

  const { username, folderId } = await params;

  // 1. Fetch user by username, only if profile is public
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Profile not found or is private" },
      { status: 404 },
    );
  }

  // 2. Fetch the folder, only if it belongs to this user and is public
  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id, name, icon, is_pinned, created_at")
    .eq("id", folderId)
    .eq("created_by", user.id)
    .eq("is_public", true)
    .maybeSingle();

  if (folderError || !folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  // 3. Fetch the repositories in this folder
  const { data: folderRepos, error: linkError } = await supabase
    .from("folder_repos")
    .select("repo_id")
    .eq("folder_id", folderId);

  if (linkError) {
    return NextResponse.json(
      { error: "Failed to fetch folder repos" },
      { status: 500 },
    );
  }

  let repos: any[] = [];
  const repoIds = (folderRepos || []).map((fr) => fr.repo_id);
  if (repoIds.length > 0) {
    // Private repos are never shown on public pages
    const { data: reposData, error: reposError } = await supabase
      .from("repositories")
      .select("id, name, full_name, description, url, language, stars")
      .in("id", repoIds)
      .eq("user_id", user.id)
      .eq("private", false)
      .order("name", { ascending: true });

    if (!reposError && reposData) {
      repos = reposData;
    }
  }

  return NextResponse.json({
    folder,
    repos,
    hidden_private_count: Math.max(0, repoIds.length - repos.length),
  });
}
