'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/lib/icons';

export default function Nav({ admin, approved, pending = 0 }) {
  const p = usePathname();
  const items = [['/', 'home', 'หน้าแรก'], ['/tickets/new', 'plus', 'แจ้งซ่อมใหม่'], ['/profile', 'user', 'โปรไฟล์']];
  if (admin) items.push(['/admin', 'shield', 'ผู้ดูแลระบบ', pending]);
  else if (!approved) items.push(['/verify', 'check', 'ยืนยันตัวตน']); // อนุมัติแล้วไม่ต้องแสดง
  const close = () => { const m = document.getElementById('menu'); if (m) m.checked = false; };
  return (<nav className="nav">{items.map(([h, i, t, n]) => {
    const on = h === '/' ? p === '/' : p.startsWith(h);
    return <Link key={h} href={h} onClick={close} className={on ? 'active' : ''}><Icon n={i} />{t}{n > 0 && <span className="count">{n}</span>}</Link>;
  })}</nav>);
}
