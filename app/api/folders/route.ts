import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Get folders for current user
    let query = supabase
      .from("folders")
      .select(
        `
        id,
        name,
        icon,
        created_at,
        updated_at,
        last_opened,
        is_pinned
      `,
      )
      .eq("created_by", userId)
      .order("is_pinned", { ascending: false })
      .order("last_opened", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: folders, error } = await query;

    if (error) throw error;

    // Get repo counts for each folder
    const foldersWithCounts = await Promise.all(
      folders?.map(async (folder) => {
        const { count } = await supabase
          .from("folder_repos")
          .select("*", { count: "exact", head: true })
          .eq("folder_id", folder.id);

        return {
          ...folder,
          repo_count: count || 0,
        };
      }) || [],
    );

    return NextResponse.json(foldersWithCounts);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, icon = "📁" } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name,
          icon,
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
