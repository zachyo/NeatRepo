import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  firstIssue,
  folderRepoReorderSchema,
  userFacingDbError,
} from "@/lib/validation";

/** Saves the manual order of the repositories in a folder. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await params;
  const parsed = folderRepoReorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const { error } = await createAdminClient().rpc("reorder_folder_repos", {
    p_user_id: userId,
    p_folder_id: folderId,
    p_repo_ids: parsed.data.repoIds,
  });

  if (error) {
    const message = userFacingDbError(error);
    if (message) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Error reordering folder repos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
