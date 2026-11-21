import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const supabase = createAdminClient();

  const { username } = await params;

  // Fetch user by username, only if profile is public
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username, avatar_url, created_at, is_public")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Profile not found or is private" },
      { status: 404 },
    );
  }

  // Top-level public folders with their repo counts. Subfolders are listed on
  // their parent's page, so a private parent hides everything beneath it.
  const { data: folderRows } = await supabase
    .from("folders")
    .select("id, name, icon, is_pinned, created_at")
    .eq("created_by", user.id)
    .eq("is_public", true)
    .is("parent_id", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // Count only public repos, so a folder never reveals how many private
  // repos it holds.
  const folderIds = (folderRows ?? []).map((f) => f.id);
  const publicCounts = new Map<string, number>();
  if (folderIds.length > 0) {
    const { data: links } = await supabase
      .from("folder_repos")
      .select("folder_id, repositories!inner(private)")
      .in("folder_id", folderIds)
      .eq("repositories.private", false);
    for (const link of links ?? []) {
      publicCounts.set(link.folder_id, (publicCounts.get(link.folder_id) ?? 0) + 1);
    }
  }
  const folders = (folderRows ?? []).map((f) => ({
    ...f,
    folder_repos: [{ count: publicCounts.get(f.id) ?? 0 }],
  }));

  // Fetch favorited repos
  const { data: favoriteRepos } = await supabase
    .from("repositories")
    .select("id, name, full_name, url, language, stars, description")
    .eq("user_id", user.id)
    .eq("is_favorite", true)
    .eq("private", false)
    .order("stars", { ascending: false })
    .limit(12);

  return NextResponse.json({
    user: {
      username: user.username,
      avatar_url: user.avatar_url,
      member_since: user.created_at,
    },
    folders: folders || [],
    favoriteRepos: favoriteRepos || [],
  });
}
