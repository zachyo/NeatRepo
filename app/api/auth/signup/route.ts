import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // This route is deprecated - GitHub OAuth is handled via /auth/github/callback
  return NextResponse.json(
    { error: 'Email/password authentication is deprecated. Please use GitHub OAuth.' },
    { status: 410 }
  );
}
