import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const state = crypto.randomUUID(), nonce = crypto.randomUUID(); // กัน CSRF / replay
  const jar = await cookies();
  const o = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 };
  jar.set('g_state', state, o); jar.set('g_nonce', nonce, o);
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: `${process.env.APP_URL}/api/auth/google/callback`,
    response_type: 'code', scope: 'openid email profile', state, nonce, prompt: 'select_account',
  });
  return NextResponse.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + q);
}
