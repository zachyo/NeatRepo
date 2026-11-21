import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getAncestors, isPubliclyVisible } from "@/lib/folder-tree";

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

  // 2. Load the hierarchy: a folder is only visible when every ancestor is public
  const { data: allFolders, error: treeError } = await supabase
    .from("folders")
    .select(
      "id, name, icon, parent_id, position, is_public, is_pinned, created_at, folder_repos(count)",
    )
    .eq("created_by", user.id);

  if (treeError) {
    return NextResponse.json({ error: "Failed to fetch folder" }, { status: 500 });
  }

  const tree = allFolders || [];
  const current = tree.find((f) => f.id === folderId);

  if (!current || !isPubliclyVisible(tree, folderId)) {
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
    folder: {
      id: current.id,
      name: current.name,
      icon: current.icon,
      is_pinned: current.is_pinned,
      created_at: current.created_at,
    },
    repos,
    hidden_private_count: Math.max(0, repoIds.length - repos.length),
    ancestors: getAncestors(tree, folderId).map(({ id, name }) => ({ id, name })),
    subfolders: tree
      .filter((f) => f.parent_id === folderId && f.is_public)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(({ id, name, icon, folder_repos }) => ({
        id,
        name,
        icon,
        repo_count: (folder_repos as unknown as { count: number }[])?.[0]?.count ?? 0,
      })),
  });
}
