import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/** Distinct languages across the current user's repositories. */
export async function GET() {
  const userId = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await createAdminClient().rpc("get_user_languages", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const languages = (data as { language: string }[] | null)?.map((r) => r.language) ?? [];
  return NextResponse.json(languages);
}
