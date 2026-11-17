import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

type SessionData = { userId?: string };

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return {
    cookieName: "nr_session",
    password,
    ttl: 60 * 60 * 24 * 7, // 7 days
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/** Returns the authenticated user's id from the encrypted session cookie. */
export async function getCurrentUser(): Promise<string | undefined> {
  const session = await getSession();
  return session.userId;
}

export async function setUserCookie(userId: string) {
  const session = await getSession();
  session.userId = userId;
  await session.save();
}

export async function clearUserCookie() {
  const session = await getSession();
  session.destroy();
}
