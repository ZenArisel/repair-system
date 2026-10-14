import Link from 'next/link';
import { RegisterForm } from '../forms';
import { getSiteName } from '@/lib/settings';
import GoogleButton from '../google-button';
import Icon from '@/lib/icons';
export default async function P() {
  const site = await getSiteName();
  return <div className="auth"><div className="auth-card">
    <div className="brand big"><span className="logo"><Icon n="wrench" size={20} /></span>{site}</div>
    <h1>สมัครสมาชิก</h1><p className="sub">สร้างบัญชีเพื่อเริ่มแจ้งซ่อม</p>
    <RegisterForm /><GoogleButton />
    <p className="foot">มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ</Link></p></div></div>;
}
