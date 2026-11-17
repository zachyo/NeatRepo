import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { firstIssue, folderUpdateSchema } from "@/lib/validation";

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

    await supabase
      .from("folders")
      .update({ last_opened: new Date().toISOString() })
      .eq("id", folderId)
      .eq("created_by", userId);

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
    const { name, icon, is_pinned, is_public } = parsed.data;

    const { data, error } = await supabase
      .from("folders")
      .update({
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(is_pinned !== undefined && { is_pinned }),
        ...(is_public !== undefined && { is_public }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)
      .eq("created_by", userId)
      .select()
      .maybeSingle();

    if (error) throw error;
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

    const { data, error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId)
      .eq("created_by", userId)
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
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
