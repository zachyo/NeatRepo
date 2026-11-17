import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/** Starts the GitHub OAuth flow with a CSRF `state` bound to an httpOnly cookie. */
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "OAuth not configured" }, { status: 500 });
  }

  const state = randomBytes(24).toString("base64url");
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${origin}/auth/github/callback`);
  // `repo` is required for /user/repos to return private repositories.
  // OAuth Apps have no read-only variant of this scope.
  authorize.searchParams.set("scope", "read:user user:email repo");
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
