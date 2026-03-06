import { cookies } from 'next/headers';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  return userId;
}

export async function setUserCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearUserCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('user_id');
}
