import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearUserCookie, getCurrentUser } from "@/lib/auth";

const userUpdateSchema = z.object({ is_public: z.boolean().optional() });

export async function GET() {
  const supabase = createAdminClient();

  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, avatar_url, is_public, created_at, last_synced_at")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = createAdminClient();

  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = userUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", userId)
    .select("id, username, email, avatar_url, is_public")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function DELETE() {
  const supabase = createAdminClient();

  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // folder_repos rows cascade from folders and repositories (see migration
  // 0001). Folders and repositories are deleted explicitly so this still works
  // if the users → folders/repositories cascades are missing.
  const steps = [
    () => supabase.from("folders").delete().eq("created_by", userId),
    () => supabase.from("repositories").delete().eq("user_id", userId),
    () => supabase.from("users").delete().eq("id", userId),
  ];

  for (const step of steps) {
    const { error } = await step();
    if (error) {
      console.error("Account deletion failed:", error);
      return NextResponse.json(
        { error: "Failed to delete account. Please try again." },
        { status: 500 },
      );
    }
  }

  await clearUserCookie();
  return NextResponse.json({ success: true });
}
