import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { setUserCookie } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import {
  GITHUB_API_URL,
  REPO_UPSERT_CONFLICT,
  githubHeaders,
  mapGithubRepo,
} from "@/lib/github";

function statesMatch(a: string | undefined, b: unknown): boolean {
  if (!a || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { code, state } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "no_code" }, { status: 400 });
    }

    // CSRF protection: state must match the cookie set by /api/auth/github
    const cookieStore = await cookies();
    const expectedState = cookieStore.get("oauth_state")?.value;
    cookieStore.delete("oauth_state");
    if (!statesMatch(expectedState, state)) {
      return NextResponse.json({ error: "invalid_state" }, { status: 400 });
    }

    // Exchange code for access token
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/github/callback`,
        }),
      },
    );

    const data = await response.json();

    if (!data.access_token) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const accessToken: string = data.access_token;

    // Get user info from GitHub
    const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
      headers: githubHeaders(accessToken),
    });
    if (!userResponse.ok) {
      return NextResponse.json({ error: "github_user_failed" }, { status: 502 });
    }
    const githubUser = await userResponse.json();

    // Get user email if not in main response
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch(`${GITHUB_API_URL}/user/emails`, {
        headers: githubHeaders(accessToken),
      });
      const emails = emailResponse.ok ? await emailResponse.json() : [];
      if (Array.isArray(emails)) {
        email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
      }
    }

    const encryptedToken = encryptToken(accessToken);

    // Create or update user in Supabase
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("github_id", githubUser.id)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          github_access_token: encryptedToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (updateError) throw updateError;
    } else {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          email,
          username: githubUser.login,
          github_id: githubUser.id,
          avatar_url: githubUser.avatar_url,
          github_access_token: encryptedToken,
        })
        .select("id")
        .single();

      if (error || !newUser) {
        return NextResponse.json(
          { error: "user_creation_failed" },
          { status: 500 },
        );
      }

      userId = newUser.id;
    }

    await setUserCookie(userId);

    // Sync the first page of repos for a fast first load; the background
    // sync (/api/sync/background) performs the full re-sync afterwards.
    const reposResponse = await fetch(
      `${GITHUB_API_URL}/user/repos?per_page=100&sort=updated`,
      { headers: githubHeaders(accessToken) },
    );
    const repos = reposResponse.ok ? await reposResponse.json() : [];

    if (Array.isArray(repos) && repos.length > 0) {
      const syncedAt = new Date().toISOString();
      const { error: upsertError } = await supabase
        .from("repositories")
        .upsert(
          repos.map((repo: any) => mapGithubRepo(repo, userId, syncedAt)),
          { onConflict: REPO_UPSERT_CONFLICT },
        );
      if (upsertError) console.error("Initial repo sync failed:", upsertError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.json({ error: "callback_failed" }, { status: 500 });
  }
}
