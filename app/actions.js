'use server';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { CATEGORY, PRIORITY, STATUS } from '@/lib/labels';
import { createSession, requireUser, requireApproved, requireAdmin } from '@/lib/auth';

const s = (f, k, max) => String(f.get(k) ?? '').trim().slice(0, max);
const DUMMY = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO5Yq3Zq0aGZ7Qy0d5vY3c8rJmB8o8v1e';

export async function register(_, f) {
  const email = s(f, 'email', 100).toLowerCase(), name = s(f, 'name', 60), phone = s(f, 'phone', 15);
  const pw = String(f.get('password') ?? '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'อีเมลไม่ถูกต้อง' };
  if (name.length < 2) return { error: 'ชื่อสั้นเกินไป' };
  if (!/^0\d{8,9}$/.test(phone)) return { error: 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)' };
  if (pw.length < 8 || pw.length > 72 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return { error: 'รหัสผ่านต้อง 8-72 ตัว มีตัวอักษรและตัวเลข' };
  const hash = await bcrypt.hash(pw, 12); // bcrypt cost 12 + salt อัตโนมัติ
  let id;
  try { id = (await sql`INSERT INTO users(email,name,phone,password_hash) VALUES(${email},${name},${phone},${hash}) RETURNING id`)[0].id; }
  catch { return { error: 'อีเมลนี้ถูกใช้แล้ว' }; }
  await createSession(id);
  redirect('/');
}

export async function login(_, f) {
  const email = s(f, 'email', 100).toLowerCase(), pw = String(f.get('password') ?? '').slice(0, 72);
  const u = (await sql`SELECT * FROM users WHERE email=${email}`)[0];
  if (u?.locked_until && new Date(u.locked_until) > new Date()) return { error: 'บัญชีถูกล็อกชั่วคราว ลองใหม่ใน 15 นาที' };
  const ok = await bcrypt.compare(pw, u?.password_hash ?? DUMMY); // เวลาเท่ากัน กัน user enumeration
  if (!u || !ok) {
    // ถ้าช่วงล็อกหมดแล้ว ให้เริ่มนับใหม่จาก 1 (ไม่ใช่นับต่อจาก 5)
    if (u) await sql`UPDATE users SET
      failed_count=CASE WHEN locked_until<=now() THEN 1 ELSE failed_count+1 END,
      locked_until=CASE WHEN (CASE WHEN locked_until<=now() THEN 1 ELSE failed_count+1 END)>=5 THEN now()+interval '15 minutes' ELSE NULL END
      WHERE id=${u.id}`;
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  }
  await sql`UPDATE users SET failed_count=0,locked_until=NULL WHERE id=${u.id}`;
  await createSession(u.id);
  redirect('/');
}

export async function logout() { (await cookies()).delete('session'); redirect('/login'); }

// ---------- ฟอร์ม 1: แจ้งซ่อม (CRUD มีเจ้าของ) ----------
function ticketFields(f) {
  const title = s(f, 'title', 100), location = s(f, 'location', 100), description = s(f, 'description', 1000);
  const category = s(f, 'category', 20), priority = s(f, 'priority', 10);
  if (!title || !location || !description || !(category in CATEGORY) || !(priority in PRIORITY)) return null;
  return { title, location, description, category, priority };
}
export async function createTicket(f) {
  const u = await requireApproved(); const d = ticketFields(f); if (!d) return;
  await sql`INSERT INTO tickets(user_id,title,category,location,description,priority)
            VALUES(${u.id},${d.title},${d.category},${d.location},${d.description},${d.priority})`;
  revalidatePath('/'); redirect('/');
}
export async function updateTicket(id, f) {
  const u = await requireApproved(); const d = ticketFields(f);
  // เช็คเจ้าของ + แก้ได้เฉพาะตอนยังรอดำเนินการ ใน SQL เลย
  if (d) await sql`UPDATE tickets SET title=${d.title},category=${d.category},location=${d.location},
    description=${d.description},priority=${d.priority},updated_at=now()
    WHERE id=${id} AND user_id=${u.id} AND status='pending'`;
  redirect('/');
}
export async function deleteTicket(id) {
  const u = await requireApproved();
  if (u.role === 'admin') await sql`DELETE FROM tickets WHERE id=${id}`;
  else await sql`DELETE FROM tickets WHERE id=${id} AND user_id=${u.id} AND status='pending'`;
  revalidatePath('/'); revalidatePath('/admin');
}

// ---------- ฟอร์ม 2: ประเมินความพึงพอใจหลังซ่อมเสร็จ ----------
export async function submitRating(ticketId, f) {
  const u = await requireApproved(); const score = Number(f.get('score')), comment = s(f, 'comment', 500);
  if (!Number.isInteger(score) || score < 1 || score > 5 || !comment) return;
  await sql`INSERT INTO ratings(ticket_id,user_id,score,comment)
    SELECT id,${u.id},${score},${comment} FROM tickets WHERE id=${ticketId} AND user_id=${u.id} AND status='done'
    ON CONFLICT (ticket_id) DO NOTHING`;
  revalidatePath('/');
}

// ---------- ฟอร์ม 3: แก้โปรไฟล์ ----------
export async function updateProfile(f) {
  const u = await requireUser(); const name = s(f, 'name', 60), phone = s(f, 'phone', 15);
  if (name.length >= 2 && /^0\d{8,9}$/.test(phone)) await sql`UPDATE users SET name=${name},phone=${phone} WHERE id=${u.id}`;
  revalidatePath('/', 'layout');
}

// ---------- Admin ----------
export async function setStatus(id, f) {
  await requireAdmin(); const status = s(f, 'status', 20), note = s(f, 'admin_note', 500);
  if (!(status in STATUS)) return;
  await sql`UPDATE tickets SET status=${status},admin_note=${note || null},updated_at=now() WHERE id=${id}`;
  revalidatePath('/admin'); revalidatePath('/');
}
export async function setRole(id, role) {
  const a = await requireAdmin();
  if (id === a.id || !['user', 'admin'].includes(role)) return; // ห้ามลดสิทธิ์ตัวเอง
  await sql`UPDATE users SET role=${role} WHERE id=${id}`; revalidatePath('/admin');
}
export async function deleteUser(id) {
  const a = await requireAdmin(); if (id === a.id) return;
  await sql`DELETE FROM users WHERE id=${id}`; revalidatePath('/admin');
}

export async function setSiteName(f) {
  await requireAdmin(); const name = s(f, 'name', 60);
  if (name.length < 2) return;
  await sql`INSERT INTO settings(key,value) VALUES('site_name',${name}) ON CONFLICT (key) DO UPDATE SET value=${name}`;
  revalidatePath('/', 'layout'); revalidatePath('/login'); revalidatePath('/register');
}

// ---------- ยืนยันตัวตน ----------
export async function requestVerification(f) {
  const u = await requireUser();
  const real = s(f, 'real_name', 80), dept = s(f, 'department', 80), building = s(f, 'building', 60), reason = s(f, 'reason', 300);
  if (real.length < 2 || dept.length < 2 || !building || reason.length < 5) redirect('/verify?error=1');
  await sql`UPDATE users SET real_name=${real},department=${dept},building=${building},verify_reason=${reason},
    verify_status='pending',verify_reply=NULL
    WHERE id=${u.id} AND role<>'admin' AND verify_status IN ('unverified','rejected')`;
  revalidatePath('/', 'layout'); redirect('/verify');
}
export async function approveUser(id) {
  await requireAdmin();
  await sql`UPDATE users SET verify_status='approved',verify_reply=NULL WHERE id=${id} AND role<>'admin'`;
  revalidatePath('/', 'layout');
}
export async function rejectUser(id, f) {
  await requireAdmin(); const note = s(f, 'note', 200);
  await sql`UPDATE users SET verify_status='rejected',verify_reply=${note || null} WHERE id=${id} AND role<>'admin'`;
  revalidatePath('/', 'layout');
}
