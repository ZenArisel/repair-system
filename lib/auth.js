import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from './db';

const key = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function createSession(userId) {
  const token = await new SignJWT({}).setSubject(String(userId)).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime('2h').sign(key());
  (await cookies()).set('session', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7200,
  });
}
export async function getUser() {
  const t = (await cookies()).get('session')?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key(), { algorithms: ['HS256'] });
    // role อ่านจาก DB ทุกครั้ง ไม่เชื่อค่าใน token
    const r = await sql`SELECT id,email,name,phone,role,verify_status,real_name,department,building,verify_reply FROM users WHERE id=${Number(payload.sub)}`;
    return r[0] || null;
  } catch { return null; }
}
export async function requireUser() { const u = await getUser(); if (!u) redirect('/login'); return u; }
export async function requireAdmin() { const u = await requireUser(); if (u.role !== 'admin') redirect('/'); return u; }
export const isApproved = (u) => u.role === 'admin' || u.verify_status === 'approved';
export async function requireApproved() { const u = await requireUser(); if (!isApproved(u)) redirect('/verify'); return u; }
