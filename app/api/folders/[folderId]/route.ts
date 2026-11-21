import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAncestors, isPubliclyVisible } from "@/lib/folder-tree";
import { sortFolderRepos } from "@/lib/repo-query";
import {
  firstIssue,
  folderUpdateSchema,
  userFacingDbError,
} from "@/lib/validation";

export async function GET(
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

    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select(
        `
    *,
    folder_repos (
      repo_id,
      added_at,
      position,
      repositories (*)
    )
  `,
      )
      .eq("id", folderId)
      .eq("created_by", userId)
      .maybeSingle();

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { data: allFolders, error: treeError } = await supabase
      .from("folders")
      .select("id, name, parent_id, is_public")
      .eq("created_by", userId);

    if (treeError) throw treeError;

    const tree = allFolders || [];

    await supabase
      .from("folders")
      .update({ last_opened: new Date().toISOString() })
      .eq("id", folderId)
      .eq("created_by", userId);

    return NextResponse.json({
      ...folder,
      folder_repos: sortFolderRepos(folder.folder_repos || [], folder.repo_sort),
      ancestors: getAncestors(tree, folderId).map(({ id, name }) => ({ id, name })),
      // False when this folder or any folder above it is private
      publicly_visible: isPubliclyVisible(tree, folderId),
    });
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const parsed = folderUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { name, icon, is_pinned, is_public, parent_id, repo_sort } = parsed.data;

    // Ownership, cycles and depth are enforced by the folders_validate_parent trigger
    const { data, error } = await supabase
      .from("folders")
      .update({
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(is_pinned !== undefined && { is_pinned }),
        ...(is_public !== undefined && { is_public }),
        ...(parent_id !== undefined && { parent_id }),
        ...(repo_sort !== undefined && { repo_sort }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)
      .eq("created_by", userId)
      .select()
      .maybeSingle();

    if (error) {
      const message = userFacingDbError(error);
      if (message) return NextResponse.json({ error: message }, { status: 400 });
      throw error;
    }
    if (!data) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Deletes a folder. Its subfolders move up to its parent. */
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

    const { data: deleted, error } = await supabase.rpc(
      "delete_folder_keep_children",
      { p_user_id: userId, p_folder_id: folderId },
    );

    if (error) throw error;
    if (!deleted) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
