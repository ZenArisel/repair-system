-- อัปเกรดฐานข้อมูลเก่าให้ตรงกับ schema.sql ปัจจุบัน — รวมไฟล์ migration เดิมทั้ง 3 ไฟล์ รันซ้ำได้
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_key ON users(google_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_has_credential') THEN
    ALTER TABLE users ADD CONSTRAINT users_has_credential CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);
  END IF;
END $$;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_status TEXT NOT NULL DEFAULT 'unverified'
  CHECK (verify_status IN ('unverified','pending','approved','rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name TEXT, ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS building TEXT, ADD COLUMN IF NOT EXISTS verify_reason TEXT, ADD COLUMN IF NOT EXISTS verify_reply TEXT;
UPDATE users SET verify_status='approved' WHERE role='admin';
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings(key,value) VALUES('site_name','FixIt') ON CONFLICT DO NOTHING;
