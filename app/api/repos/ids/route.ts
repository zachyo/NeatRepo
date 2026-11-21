import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  MAX_BULK_REPOS,
  applyRepoFilters,
  applyRepoSort,
  parseRepoFilters,
  repoSelect,
} from "@/lib/repo-query";

const BATCH_SIZE = 1000;

/** Ids of every repository matching the filters, for "select all matching". */
export async function GET(req: NextRequest) {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const filters = parseRepoFilters(new URL(req.url).searchParams);

  try {
    const ids: string[] = [];
    let total = 0;

    while (ids.length < MAX_BULK_REPOS) {
      const base = supabase
        .from("repositories")
        .select(repoSelect(filters, "id"), { count: "exact" })
        .eq("user_id", userId);

      const { data, error, count } = await applyRepoSort(
        applyRepoFilters(base, filters),
        filters.sort,
      ).range(ids.length, Math.min(ids.length + BATCH_SIZE, MAX_BULK_REPOS) - 1);

      if (error) throw error;

      total = count ?? 0;
      const rows = (data ?? []) as unknown as { id: string }[];
      ids.push(...rows.map((row) => row.id));
      if (rows.length < BATCH_SIZE) break;
    }

    return NextResponse.json({ ids, total, capped: total > ids.length });
  } catch (error) {
    console.error("Error fetching repo ids:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
