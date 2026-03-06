import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
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

    const { repoId } = await params;
    const body = await req.json();
    const { is_favorite } = body;

    // Verify repo ownership
    const { data: repo, error: repoError } = await supabase
      .from("repositories")
      .select("id")
      .eq("id", repoId)
      .eq("user_id", userId)
      .single();

    if (repoError || !repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("repositories")
      .update({
        ...(is_favorite !== undefined && { is_favorite }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", repoId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
