import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { firstIssue, folderCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().slice(0, 100);

    // One query: folders plus an embedded repo count (avoids N+1)
    let query = supabase
      .from("folders")
      .select(
        "id, name, icon, created_at, updated_at, last_opened, is_pinned, is_public, folder_repos(count)",
      )
      .eq("created_by", userId)
      .order("is_pinned", { ascending: false })
      .order("last_opened", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
    }

    const { data: folders, error } = await query;

    if (error) throw error;

    const result = (folders || []).map(({ folder_repos, ...folder }: any) => ({
      ...folder,
      repo_count: folder_repos?.[0]?.count ?? 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = folderCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { name, icon = "📁", is_public = false } = parsed.data;

    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name,
          icon,
          is_public,
          created_by: userId,
          last_opened: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, repo_count: 0 }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
