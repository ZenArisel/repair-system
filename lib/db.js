import { neon } from '@neondatabase/serverless';
// tagged template => parameterized query ทุกครั้ง (กัน SQL Injection)
export const sql = neon(process.env.DATABASE_URL);
