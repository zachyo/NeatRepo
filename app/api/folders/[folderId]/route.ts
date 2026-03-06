import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;

    // Get folder details
    // const { data: folder, error: folderError } = await supabase
    //   .from("folders")
    //   .select(
    //     `
    //     id,
    //     name,
    //     icon,
    //     created_at,
    //     updated_at,
    //     last_opened
    //   `,
    //   )
    //   .eq("id", folderId)
    //   .eq("created_by", userId)
    //   .single();

    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select(
        `
    *,
    folder_repos (
      repo_id,
      added_at,
      repositories (*)
    )
  `,
      )
      .eq("id", folderId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Get repos in folder
    // const { data: repos, error: reposError } = await supabase
    //   .from('folder_repos')
    //   .select(`
    //     id,
    //     github_repos (
    //       id,
    //       repo_name,
    //       repo_owner,
    //       repo_url,
    //       description,
    //       stars_count,
    //       language
    //     )
    //   `)
    //   .eq('folder_id', folderId);

    // if (reposError) throw reposError;

    // Update last_opened timestamp
    await supabase
      .from("folders")
      .update({ last_opened: new Date().toISOString() })
      .eq("id", folderId);

    if (folder.folder_repos) {
      folder.folder_repos.sort((a: any, b: any) => {
        const dateA = new Date(a.repositories?.updated_at || 0).getTime();
        const dateB = new Date(b.repositories?.updated_at || 0).getTime();
        return dateB - dateA;
      });
    }

    return NextResponse.json(folder);
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;
    const body = await req.json();
    const { name, icon, is_pinned } = body;

    // Verify folder ownership
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("created_by", userId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("folders")
      .update({
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(is_pinned !== undefined && { is_pinned }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await params;

    // Verify folder ownership
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("created_by", userId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
