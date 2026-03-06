import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; folderId: string }> },
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const { username, folderId } = await params;

  // 1. Fetch user by username, only if profile is public
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username, is_public")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Profile not found or is private" },
      { status: 404 },
    );
  }
  console.log(user);

  // 2. Fetch the specific folder belonging to this user
  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id, name, icon, is_pinned, created_at")
    .eq("id", folderId)
    .eq("created_by", user.id)
    .single();

  console.log(folder);

  if (folderError || !folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  // 3. Fetch the repositories in this folder
  // Get the link entries first
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
  if (folderRepos && folderRepos.length > 0) {
    const repoIds = folderRepos.map((fr) => fr.repo_id);
    const { data: reposData, error: reposError } = await supabase
      .from("repositories")
      .select("id, name, full_name, description, url, language, stars")
      .in("id", repoIds)
      .order("name", { ascending: true });

    if (!reposError && reposData) {
      repos = reposData;
    }
  }

  return NextResponse.json({
    folder,
    repos,
  });
}
