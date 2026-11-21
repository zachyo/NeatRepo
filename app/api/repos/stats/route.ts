import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/** Account-wide repo counts, independent of any active list filters. */
export async function GET() {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const [all, uncategorized] = await Promise.all([
      supabase
        .from("repositories")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("repositories")
        .select("id, folder_repos!left(repo_id)", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("folder_repos", null),
    ]);

    if (all.error) throw all.error;
    if (uncategorized.error) throw uncategorized.error;

    return NextResponse.json({
      total: all.count ?? 0,
      uncategorized: uncategorized.count ?? 0,
    });
  } catch (error) {
    console.error("Error fetching repo stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
