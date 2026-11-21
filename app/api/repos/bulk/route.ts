import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { chunk } from "@/lib/repo-query";
import { firstIssue, repoBulkUpdateSchema } from "@/lib/validation";

/** Sets the favorite flag on many of the user's repositories at once. */
export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = repoBulkUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { repoIds, is_favorite } = parsed.data;

  try {
    let updated = 0;
    for (const ids of chunk([...new Set(repoIds)])) {
      const { data, error } = await supabase
        .from("repositories")
        .update({ is_favorite })
        .eq("user_id", userId)
        .in("id", ids)
        .select("id");

      if (error) throw error;
      updated += data?.length ?? 0;
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("Error updating repositories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
