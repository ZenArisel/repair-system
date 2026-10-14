import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function GET(req) {
  const base = process.env.APP_URL;
  const fail = (code) => NextResponse.redirect(`${base}/login?error=${code}`);
  const sp = req.nextUrl.searchParams, jar = await cookies();
  const state = jar.get('g_state')?.value, nonce = jar.get('g_nonce')?.value;
  jar.delete('g_state'); jar.delete('g_nonce');
  if (sp.get('error') || !state || state !== sp.get('state') || !sp.get('code')) return fail('google');

  // แลก code เป็น token (ฝั่ง server ด้วย client secret)
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: sp.get('code'), client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${base}/api/auth/google/callback`, grant_type: 'authorization_code' }),
  });
  if (!r.ok) return fail('google');
  let p;
  try {
    ({ payload: p } = await jwtVerify((await r.json()).id_token, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: process.env.GOOGLE_CLIENT_ID }));
  } catch { return fail('google'); }
  if (p.nonce !== nonce || p.email_verified !== true || !p.email) return fail('google');

  const email = String(p.email).toLowerCase(), name = String(p.name || email.split('@')[0]).slice(0, 60);
  let u = (await sql`SELECT id FROM users WHERE google_id=${p.sub}`)[0];
  if (!u) {
    // อีเมลนี้มีบัญชีรหัสผ่านอยู่แล้ว: ไม่ผูกอัตโนมัติ (ระบบไม่ได้ยืนยันอีเมลตอนสมัคร เสี่ยงถูกสวมบัญชี)
    if ((await sql`SELECT 1 FROM users WHERE email=${email}`).length) return fail('linked');
    u = (await sql`INSERT INTO users(email,name,google_id) VALUES(${email},${name},${p.sub}) RETURNING id`)[0];
  }
  await createSession(u.id);
  return NextResponse.redirect(`${base}/`);
}
