import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, avatar_url, is_public, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { is_public } = body;

  const updateData: Record<string, any> = {};
  if (is_public !== undefined) updateData.is_public = is_public;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
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

export async function DELETE(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || "",
  );

  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete user data in order (repos refs, folder repos, folders, then user)
  await supabase
    .from("folder_repos")
    .delete()
    .in(
      "folder_id",
      supabase.from("folders").select("id").eq("user_id", userId) as any,
    );
  await supabase.from("folders").delete().eq("user_id", userId);
  await supabase.from("repositories").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);

  return NextResponse.json({ success: true });
}
