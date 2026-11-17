import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const supabase = createAdminClient();

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = await params;
    const { is_favorite } = await req.json();

    if (typeof is_favorite !== "boolean") {
      return NextResponse.json(
        { error: "is_favorite must be a boolean" },
        { status: 400 },
      );
    }

    // updated_at mirrors GitHub's value, so it is not touched here.
    const { data, error } = await supabase
      .from("repositories")
      .update({ is_favorite })
      .eq("id", repoId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
