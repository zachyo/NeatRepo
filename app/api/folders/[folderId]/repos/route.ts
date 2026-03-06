import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
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
    const { repoId } = await req.json();

    if (!repoId) {
      return NextResponse.json(
        { error: "Repo ID is required" },
        { status: 400 },
      );
    }

    // Verify folder access
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("created_by", userId)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Add repo to folder
    const { data, error } = await supabase
      .from("folder_repos")
      .insert([
        {
          folder_id: folderId,
          repo_id: repoId,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Repo already in folder" },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error adding repo to folder:", error);
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
    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get("repoId");

    if (!repoId) {
      return NextResponse.json(
        { error: "Repo ID is required" },
        { status: 400 },
      );
    }

    // Verify folder access
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("created_by", userId)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("folder_repos")
      .delete()
      .eq("folder_id", folderId)
      .eq("repo_id", repoId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing repo from folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
