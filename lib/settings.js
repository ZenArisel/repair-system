import { sql } from './db';
export async function getSiteName() {
  try { return (await sql`SELECT value FROM settings WHERE key='site_name'`)[0]?.value || 'FixIt'; }
  catch { return 'FixIt'; } // ยังไม่มีตาราง settings ก็ใช้ชื่อเริ่มต้น
}
