import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "no_code" }, { status: 400 });
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

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        Accept: "application/json",
      },
    });

    const githubUser = await userResponse.json();

    // Get user email if not in main response
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      });
      const emails = await emailResponse.json();
      email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
    }

    // Create or update user in Supabase
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("github_id", githubUser.id)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update user info
      await supabase
        .from("users")
        .update({
          username: githubUser.login,
          avatar_url: githubUser.avatar_url,
          github_access_token: data.access_token,
          updated_at: new Date(),
        })
        .eq("id", userId);
    } else {
      // Create new user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          email,
          username: githubUser.login,
          github_id: githubUser.id,
          avatar_url: githubUser.avatar_url,
          github_access_token: data.access_token,
        })
        .select()
        .single();

      if (error || !newUser) {
        return NextResponse.json(
          { error: "user_creation_failed" },
          { status: 500 },
        );
      }

      userId = newUser.id;
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Fetch repos
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      },
    );
    const repos = await reposResponse.json();

    // Upsert into supabase
    if (Array.isArray(repos) && repos.length > 0) {
      await supabase.from("repositories").upsert(
        repos.map((repo: any) => ({
          github_repo_id: repo.id,
          user_id: userId,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          private: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updated_at: repo.updated_at,
          synced_at: new Date(),
        })),
        { onConflict: "github_repo_id" },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.json({ error: "callback_failed" }, { status: 500 });
  }
}
