# ระบบแจ้งซ่อม — Next.js + Neon + Vercel
1. สร้างโปรเจกต์ที่ neon.tech → คัดลอก connection string → รัน `schema.sql` ใน SQL Editor
2. `cp .env.example .env.local` แล้วใส่ DATABASE_URL, JWT_SECRET
3. `npm install && npm run dev`
4. Deploy: push ขึ้น GitHub → Import ที่ vercel.com → ตั้ง Environment Variables 2 ตัวเดิม
5. สมัครสมาชิก แล้วตั้ง admin ด้วย SQL: `UPDATE users SET role='admin' WHERE email='อีเมลคุณ';`

## Google Login
1. console.cloud.google.com > APIs & Services > OAuth consent screen (External) แล้วสร้าง OAuth client ID ชนิด Web application
2. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` และ `https://<โดเมน Vercel>/api/auth/google/callback`
3. ใส่ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL ใน .env.local และ Vercel Environment Variables
4. ถ้ามีตารางจากเวอร์ชันเก่าอยู่แล้ว ให้รัน `migrate.sql` (รันซ้ำได้) แทน `schema.sql`
