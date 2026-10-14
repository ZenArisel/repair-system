'use client';
import { useActionState } from 'react';
import { login, register } from './actions';

export function LoginForm() {
  const [st, act, pending] = useActionState(login, null);
  return (<form action={act}>
    <label className="field"><span>อีเมล</span><input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
    <label className="field"><span>รหัสผ่าน</span><input name="password" type="password" autoComplete="current-password" required /></label>
    {st?.error && <p className="err">{st.error}</p>}
    <button disabled={pending}>เข้าสู่ระบบ</button></form>);
}
export function RegisterForm() {
  const [st, act, pending] = useActionState(register, null);
  return (<form action={act}>
    <label className="field"><span>ชื่อ</span><input name="name" autoComplete="name" required /></label>
    <label className="field"><span>อีเมล</span><input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
    <label className="field"><span>เบอร์โทร (ให้ผู้ดูแลติดต่อกลับ)</span><input name="phone" inputMode="tel" placeholder="0812345678" autoComplete="tel" required /></label>
    <label className="field"><span>รหัสผ่าน</span><input name="password" type="password" placeholder="8 ตัวขึ้นไป มีตัวอักษรและตัวเลข" autoComplete="new-password" required /></label>
    {st?.error && <p className="err">{st.error}</p>}
    <button disabled={pending}>สมัครสมาชิก</button></form>);
}
