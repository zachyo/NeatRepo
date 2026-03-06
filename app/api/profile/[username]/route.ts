import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

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

  // Fetch public folders with their repo counts
  const { data: folders } = await supabase
    .from("folders")
    .select("id, name, icon, is_pinned, created_at, folder_repos(count)")
    .eq("created_by", user.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // Fetch favorited repos
  const { data: favoriteRepos } = await supabase
    .from("repositories")
    .select("id, name, full_name, url, language, stars, description")
    .eq("user_id", user.id)
    .eq("is_favorite", true)
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
