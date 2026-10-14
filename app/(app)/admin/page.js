import Link from 'next/link';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { maskEmail, maskPhone } from '@/lib/mask';
import { CATEGORY, PRIORITY, STATUS, VERIFY } from '@/lib/labels';
import { getSiteName } from '@/lib/settings';
import { setSiteName, approveUser, rejectUser, setStatus, setRole, deleteUser, deleteTicket } from '@/app/actions';
import ConfirmButton from '@/app/confirm-button';
import Icon from '@/lib/icons';

export const dynamic = 'force-dynamic';
const TABS = [['tickets', 'list', 'ใบแจ้งซ่อม'], ['users', 'users', 'ผู้ใช้'], ['settings', 'sliders', 'ตั้งค่า']];
const fmt = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

export default async function Admin({ searchParams }) {
  const me = await requireAdmin(); const sp = await searchParams;
  const tab = TABS.some((x) => x[0] === sp.tab) ? sp.tab : 'tickets';
  const pend = await sql`SELECT id,email,phone,real_name,department,building,verify_reason FROM users WHERE verify_status='pending' AND role<>'admin' ORDER BY id`;
  return (<>
    <div className="page-head"><div><h1>ผู้ดูแลระบบ</h1><p>จัดการใบแจ้งซ่อม ผู้ใช้ และการตั้งค่าเว็บไซต์</p></div></div>
    <nav className="tabs">{TABS.map(([k, i, t]) => <Link key={k} href={`/admin?tab=${k}`} className={tab === k ? 'tab on' : 'tab'}>
      <Icon n={i} size={17} />{t}{k === 'users' && pend.length > 0 && <span className="count">{pend.length}</span>}</Link>)}</nav>
    {tab === 'tickets' && <Tickets sp={sp} />}
    {tab === 'users' && <Users me={me} pend={pend} />}
    {tab === 'settings' && <Settings />}
  </>);
}

async function Tickets({ sp }) {
  const q = String(sp.q ?? '').slice(0, 50);
  const st = sp.st in STATUS ? sp.st : '';
  const show = Number(sp.show) || 0; // เปิดดูเบอร์/อีเมลเต็มทีละใบ (เฉพาะ admin)
  const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
  const stats = await sql`SELECT status, count(*)::int AS n FROM tickets GROUP BY status`;
  const tickets = await sql`SELECT t.*, u.name AS owner, u.phone, u.email, r.score FROM tickets t JOIN users u ON u.id=t.user_id
    LEFT JOIN ratings r ON r.ticket_id=t.id
    WHERE (t.title ILIKE ${like} OR t.location ILIKE ${like} OR u.name ILIKE ${like}) AND (${st}='' OR t.status=${st})
    ORDER BY (t.status IN ('pending','in_progress')) DESC, t.priority='high' DESC, t.id DESC`;
  const n = (k) => stats.find((x) => x.status === k)?.n ?? 0;
  const href = (o) => { const p = new URLSearchParams(Object.entries({ tab: 'tickets', q, st, show, ...o }).filter(([, v]) => v)); return `/admin?${p}`; };
  return (<>
    <div className="stats">{Object.entries(STATUS).map(([k, v]) =>
      <Link key={k} href={href({ st: st === k ? '' : k })} className={st === k ? 'stat on' : 'stat'}><span>{v}</span><b>{n(k)}</b></Link>)}</div>
    <div className="toolbar" style={{ marginTop: 20 }}>
      <form action="/admin" className="search"><Icon n="search" size={17} />
        <input type="hidden" name="tab" value="tickets" />{st && <input type="hidden" name="st" value={st} />}
        <input name="q" defaultValue={q} placeholder="ค้นหาหัวข้อ สถานที่ หรือชื่อผู้แจ้ง…" maxLength={50} /></form>
      {(q || st) && <Link href="/admin?tab=tickets" className="btn ghost sm"><Icon n="x" size={15} />ล้างตัวกรอง</Link>}
    </div>
    <div className="stack">
      {tickets.length === 0 && <div className="card empty"><Icon n="inbox" size={34} /><b>ไม่พบใบแจ้งซ่อม</b></div>}
      {tickets.map((t) => (<article className="card ticket" key={t.id}>
        <div className="t-head">
          <span className="t-ic"><Icon n={t.category} size={20} /></span>
          <div className="t-title"><h3>#{t.id} {t.title}</h3>
            <div className="meta"><span>{CATEGORY[t.category]}</span><span><Icon n="pin" size={14} />{t.location}</span><span>{fmt(t.created_at)}</span>
              {t.priority !== 'normal' && <span className={t.priority === 'high' ? 'pri high' : 'pri'}>{PRIORITY[t.priority]}</span>}
              {t.score && <span className="stars"><Icon n="star" size={14} />{t.score}/5</span>}</div>
            <div className="meta"><span><Icon n="user" size={14} />{t.owner}</span>
              {t.id === show
                ? <><span><Icon n="phone" size={14} />{t.phone ? <a href={`tel:${t.phone}`}>{t.phone}</a> : 'ไม่มีเบอร์'}</span><span>{t.email}</span>
                    <Link href={href({ show: '' })}>ซ่อน</Link></>
                : <><span><Icon n="phone" size={14} />{maskPhone(t.phone)}</span><span>{maskEmail(t.email)}</span>
                    <Link href={href({ show: t.id })}>แสดงข้อมูลติดต่อเต็ม</Link></>}</div></div>
          <span className={`badge ${t.status}`}>{STATUS[t.status]}</span>
        </div>
        <p className="t-desc">{t.description}</p>
        <div className="t-foot">
          <form action={setStatus.bind(null, t.id)} className="row grow" style={{ flexWrap: 'wrap' }}>
            <select name="status" defaultValue={t.status} style={{ width: 150 }}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input name="admin_note" placeholder="บันทึกผลดำเนินการ (ผู้แจ้งเห็น)" defaultValue={t.admin_note ?? ''} className="grow" style={{ minWidth: 200 }} maxLength={500} />
            <button className="sm">อัปเดต</button></form>
          <form action={deleteTicket.bind(null, t.id)}><ConfirmButton className="red sm" message={`ลบใบแจ้งซ่อม #${t.id} ถาวร?`}><Icon n="trash" size={15} />ลบ</ConfirmButton></form>
        </div>
      </article>))}
    </div></>);
}

async function Users({ me, pend }) {
  const users = await sql`SELECT id,email,name,phone,role,verify_status,google_id IS NOT NULL AS g,password_hash IS NOT NULL AS p FROM users ORDER BY id`;
  return (<>
    <div className="section" style={{ marginTop: 0 }}><h2>คำขอยืนยันตัวตนที่รออนุมัติ ({pend.length})</h2>
      <div className="stack">
        {pend.length === 0 && <div className="card empty"><Icon n="check" size={30} />ไม่มีคำขอค้าง</div>}
        {pend.map((x) => (<div className="card" key={x.id}>
          <div className="row"><b>{x.real_name}</b><span className="muted small">{x.department} · {x.building}</span></div>
          <div className="meta"><span>{maskEmail(x.email)}</span><span><Icon n="phone" size={14} />{maskPhone(x.phone)}</span></div>
          <div className="callout"><b>เหตุผล</b>{x.verify_reason}</div>
          <div className="row">
            <form action={approveUser.bind(null, x.id)}><button className="sm"><Icon n="check" size={15} />อนุมัติ</button></form>
            <form action={rejectUser.bind(null, x.id)} className="grow"><input name="note" placeholder="เหตุผลที่ปฏิเสธ (ถ้ามี)" maxLength={200} /><button className="red sm">ปฏิเสธ</button></form></div>
        </div>))}
      </div></div>
    <div className="section"><h2>ผู้ใช้ทั้งหมด ({users.length})</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>ชื่อ</th><th>ติดต่อ</th><th>สถานะ</th><th>เข้าสู่ระบบด้วย</th><th /></tr></thead>
        <tbody>{users.map((x) => (<tr key={x.id}>
          <td><b>{x.name}</b>{x.role === 'admin' && <> <span className="badge admin">admin</span></>}</td>
          <td>{maskEmail(x.email)}<br /><small className="muted">{maskPhone(x.phone)}</small></td>
          <td>{x.role === 'admin' ? <span className="muted">—</span> : <span className={`badge ${x.verify_status === 'approved' ? 'done' : x.verify_status === 'rejected' ? 'rejected' : 'pending'}`}>{VERIFY[x.verify_status]}</span>}</td>
          <td>{[x.p && 'รหัสผ่าน', x.g && 'Google'].filter(Boolean).join(' + ')}</td>
          <td>{x.id !== me.id && <div className="row end">
            {x.role !== 'admin' && x.verify_status !== 'approved' && <form action={approveUser.bind(null, x.id)}><button className="sm">อนุมัติ</button></form>}
            <form action={setRole.bind(null, x.id, x.role === 'admin' ? 'user' : 'admin')}><ConfirmButton className="ghost sm" message={x.role === 'admin' ? 'ลดสิทธิ์เป็น user?' : 'ตั้งผู้ใช้นี้เป็น admin?'}>{x.role === 'admin' ? 'ลดเป็น user' : 'ตั้งเป็น admin'}</ConfirmButton></form>
            <form action={deleteUser.bind(null, x.id)}><ConfirmButton className="red sm" message={`ลบผู้ใช้ ${x.name} และใบแจ้งซ่อมทั้งหมดของเขา?`}>ลบ</ConfirmButton></form></div>}</td></tr>))}</tbody>
      </table></div></div></>);
}

async function Settings() {
  const site = await getSiteName();
  return (<form action={setSiteName} className="card pad-lg" style={{ maxWidth: 520 }}>
    <h2>ชื่อเว็บไซต์</h2>
    <label className="field"><span>ชื่อที่แสดงบนเมนู หน้าเข้าสู่ระบบ และแท็บเบราว์เซอร์</span>
      <input name="name" defaultValue={site} placeholder="เช่น ระบบแจ้งซ่อมหอพักสุขใจ" required minLength={2} maxLength={60} /></label>
    <div className="row end"><button>บันทึก</button></div></form>);
}
