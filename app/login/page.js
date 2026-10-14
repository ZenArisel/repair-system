import Link from 'next/link';
import { LoginForm } from '../forms';
import { getSiteName } from '@/lib/settings';
import GoogleButton from '../google-button';
import Icon from '@/lib/icons';
const MSG = { google: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่', linked: 'อีเมลนี้สมัครด้วยรหัสผ่านไว้แล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน' };
export default async function P({ searchParams }) {
  const { error } = await searchParams; const site = await getSiteName();
  return <div className="auth"><div className="auth-card">
    <div className="brand big"><span className="logo"><Icon n="wrench" size={20} /></span>{site}</div>
    <h1>เข้าสู่ระบบ</h1><p className="sub">แจ้งซ่อมและติดตามสถานะได้ในที่เดียว</p>
    {MSG[error] && <p className="err">{MSG[error]}</p>}
    <LoginForm /><GoogleButton />
    <p className="foot">ยังไม่มีบัญชี? <Link href="/register">สมัครสมาชิก</Link></p></div></div>;
}
