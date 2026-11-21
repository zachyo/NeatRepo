import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  firstIssue,
  folderReorderSchema,
  userFacingDbError,
} from "@/lib/validation";

/** Saves the manual order of sibling folders. */
export async function PUT(req: NextRequest) {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = folderReorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const { error } = await createAdminClient().rpc("reorder_folders", {
    p_user_id: userId,
    p_parent_id: parsed.data.parent_id,
    p_folder_ids: parsed.data.folderIds,
  });

  if (error) {
    const message = userFacingDbError(error);
    if (message) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Error reordering folders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
