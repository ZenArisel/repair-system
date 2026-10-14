import Link from 'next/link';
import { sql } from '@/lib/db';
import { requireUser, isApproved } from '@/lib/auth';
import { VERIFY } from '@/lib/labels';
import { maskEmail } from '@/lib/mask';
import { logout } from '@/app/actions';
import { getSiteName } from '@/lib/settings';
import Icon from '@/lib/icons';
import Nav from './nav';

export default async function Shell({ children }) {
  const u = await requireUser(); const site = await getSiteName(); const ok = isApproved(u);
  const pending = u.role === 'admin'
    ? (await sql`SELECT count(*)::int n FROM users WHERE verify_status='pending' AND role<>'admin'`)[0].n : 0;
  return (<div className="shell">
    <input type="checkbox" id="menu" className="menu-toggle" />
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="logo"><Icon n="wrench" size={20} /></span>{site}</Link>
      <Nav admin={u.role === 'admin'} approved={ok} pending={pending} />
      <div className="side-user">
        <div className="who"><span className="avatar">{u.name.trim()[0]?.toUpperCase()}</span>
          <div><b>{u.name}</b><small>{maskEmail(u.email)}</small></div></div>
        <span className={`badge ${u.role === 'admin' ? 'admin' : ok ? 'done' : 'pending'}`} style={{ alignSelf: 'flex-start' }}>
          {u.role === 'admin' ? 'ผู้ดูแลระบบ' : VERIFY[u.verify_status]}</span>
        <form action={logout}><button className="ghost sm" style={{ width: '100%' }}><Icon n="logout" size={16} />ออกจากระบบ</button></form>
      </div>
    </aside>
    <label htmlFor="menu" className="scrim" />
    <div className="main">
      <header className="topbar">
        <label htmlFor="menu" className="burger" aria-label="เมนู"><Icon n="menu" size={22} /></label>
        <Link href="/" className="brand"><span className="logo" style={{ width: 30, height: 30 }}><Icon n="wrench" size={16} /></span>{site}</Link>
      </header>
      <main className="content">{children}</main>
    </div>
  </div>);
}
