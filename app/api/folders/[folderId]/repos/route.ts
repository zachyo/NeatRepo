import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { chunk } from "@/lib/repo-query";
import {
  firstIssue,
  folderAddRepoSchema,
  folderRemoveReposSchema,
} from "@/lib/validation";

async function ownsFolder(
  supabase: ReturnType<typeof createAdminClient>,
  folderId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("created_by", userId)
    .maybeSingle();
  return !!data;
}

/** Adds one or many of the user's repositories. Existing links are kept. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const parsed = folderAddRepoSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const repoIds = parsed.data;

    if (!(await ownsFolder(supabase, folderId, userId))) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Every repo must belong to the user
    const ownership = await Promise.all(
      chunk(repoIds).map((ids) =>
        supabase
          .from("repositories")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("id", ids),
      ),
    );

    let owned = 0;
    for (const { count, error } of ownership) {
      if (error) throw error;
      owned += count ?? 0;
    }

    if (owned !== repoIds.length) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("folder_repos")
      .upsert(
        repoIds.map((repoId) => ({ folder_id: folderId, repo_id: repoId })),
        { onConflict: "folder_id,repo_id", ignoreDuplicates: true },
      )
      .select("repo_id");

    if (error) throw error;

    const added = data?.length ?? 0;
    return NextResponse.json(
      { added, skipped: repoIds.length - added },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding repos to folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Removes repositories, given as `?repoId=` or a `{ repoIds }` body. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const single = new URL(req.url).searchParams.get("repoId");
    const parsed = folderRemoveReposSchema.safeParse(
      single ? { repoIds: [single] } : await req.json().catch(() => null),
    );

    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }

    if (!(await ownsFolder(supabase, folderId, userId))) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const results = await Promise.all(
      chunk([...new Set(parsed.data.repoIds)]).map((ids) =>
        supabase
          .from("folder_repos")
          .delete()
          .eq("folder_id", folderId)
          .in("repo_id", ids),
      ),
    );

    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing repos from folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
