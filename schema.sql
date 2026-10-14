-- สร้างตารางใหม่ทั้งหมด (ฐานข้อมูลว่าง) — รันซ้ำได้ ไม่ลบข้อมูล
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,                -- NULL ได้ (ผู้ใช้ Google ยังไม่กรอกเบอร์)
  password_hash TEXT,        -- NULL ได้ (ผู้ใช้ที่เข้าด้วย Google ล้วน)
  google_id TEXT UNIQUE,     -- 'sub' จาก Google
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  failed_count INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  verify_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verify_status IN ('unverified','pending','approved','rejected')),
  real_name TEXT, department TEXT, building TEXT, verify_reason TEXT, verify_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT users_has_credential CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('electric','water','aircon','it','other')),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  ticket_id INT UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings(key,value) VALUES('site_name','FixIt') ON CONFLICT DO NOTHING;

-- ตั้งแอดมิน: สมัครสมาชิกก่อน แล้วรัน
-- UPDATE users SET role='admin', verify_status='approved' WHERE email='you@example.com';
