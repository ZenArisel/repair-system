import Link from 'next/link';
import { sql } from '@/lib/db';
import { requireUser, isApproved } from '@/lib/auth';
import { CATEGORY, PRIORITY, STATUS, VERIFY } from '@/lib/labels';
import { deleteTicket, submitRating } from '@/app/actions';
import ConfirmButton from '@/app/confirm-button';
import Icon from '@/lib/icons';

export const dynamic = 'force-dynamic';
const fmt = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

export default async function Home({ searchParams }) {
  const u = await requireUser(); const ok = isApproved(u);
  const sp = await searchParams;
  const q = String(sp.q ?? '').slice(0, 50);
  const c = sp.cat in CATEGORY ? sp.cat : '';
  const st = sp.st in STATUS ? sp.st : '';
  const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%'; // escape wildcard
  const sum = await sql`SELECT status,count(*)::int n FROM tickets WHERE user_id=${u.id} GROUP BY 1`;
  const tickets = await sql`SELECT t.*,r.score,r.comment AS r_comment FROM tickets t LEFT JOIN ratings r ON r.ticket_id=t.id
    WHERE t.user_id=${u.id} AND (t.title ILIKE ${like} OR t.location ILIKE ${like}) AND (${c}='' OR t.category=${c}) AND (${st}='' OR t.status=${st})
    ORDER BY t.id DESC`;
  const n = (k) => sum.find((x) => x.status === k)?.n ?? 0;
  const href = (o) => { const p = new URLSearchParams(Object.entries({ q, cat: c, st, ...o }).filter(([, v]) => v)); return p.size ? `/?${p}` : '/'; };
  const filtered = q || c || st;
  return (<>
    <div className="page-head">
      <div><h1>สวัสดี {u.name}</h1><p>ติดตามสถานะการซ่อมของคุณได้ที่นี่</p></div>
      <Link href={ok ? '/tickets/new' : '/verify'} className="btn"><Icon n={ok ? 'plus' : 'check'} />{ok ? 'แจ้งซ่อมใหม่' : 'ยืนยันตัวตน'}</Link>
    </div>

    {!ok && <div className="card notice" style={{ marginBottom: 16 }}>
      <div><b>บัญชียังไม่ได้รับการยืนยันตัวตน ({VERIFY[u.verify_status]})</b><br />
        <span className="muted">ดูหน้านี้ได้ แต่จะแจ้งซ่อมได้หลังผู้ดูแลระบบอนุมัติ</span></div>
      <Link href="/verify" className="btn sm">{u.verify_status === 'pending' ? 'ดูสถานะคำขอ' : 'ส่งคำขอยืนยันตัวตน'}</Link></div>}

    <div className="stats">{Object.entries(STATUS).map(([k, v]) =>
      <Link key={k} href={href({ st: st === k ? '' : k })} className={st === k ? 'stat on' : 'stat'}><span>{v}</span><b>{n(k)}</b></Link>)}</div>

    <div className="section">
      <h2>รายการแจ้งซ่อมของฉัน</h2>
      <div className="toolbar">
        <form action="/" className="search">
          <Icon n="search" size={17} />
          <input name="q" defaultValue={q} placeholder="ค้นหาหัวข้อหรือสถานที่…" maxLength={50} />
          {c && <input type="hidden" name="cat" value={c} />}{st && <input type="hidden" name="st" value={st} />}
        </form>
        {filtered && <Link href="/" className="btn ghost sm"><Icon n="x" size={15} />ล้างตัวกรอง</Link>}
      </div>
      <div className="chips">
        <Link href={href({ cat: '' })} className={!c ? 'chip on' : 'chip'}>ทั้งหมด</Link>
        {Object.entries(CATEGORY).map(([k, v]) => <Link key={k} href={href({ cat: k })} className={c === k ? 'chip on' : 'chip'}><Icon n={k} size={15} />{v}</Link>)}
      </div>

      <div className="stack">
        {tickets.length === 0 && <div className="card empty"><Icon n="inbox" size={34} />
          <b>{filtered ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีใบแจ้งซ่อม'}</b>
          {!filtered && ok && <Link href="/tickets/new" className="btn sm">แจ้งซ่อมรายการแรก</Link>}</div>}
        {tickets.map((t) => (<article className="card ticket" key={t.id}>
          <div className="t-head">
            <span className="t-ic"><Icon n={t.category} size={20} /></span>
            <div className="t-title"><h3>#{t.id} {t.title}</h3>
              <div className="meta"><span>{CATEGORY[t.category]}</span><span><Icon n="pin" size={14} />{t.location}</span>
                <span>{fmt(t.created_at)}</span>{t.priority === 'high' && <span className="pri high">เร่งด่วน</span>}</div></div>
            <span className={`badge ${t.status}`}>{STATUS[t.status]}</span>
          </div>
          <p className="t-desc">{t.description}</p>
          {t.admin_note && <div className="callout"><b>ผลการดำเนินการ</b>{t.admin_note}</div>}
          {t.status === 'pending' && <div className="t-foot">
            <Link href={`/tickets/${t.id}/edit`} className="btn ghost sm"><Icon n="edit" size={15} />แก้ไข</Link>
            <form action={deleteTicket.bind(null, t.id)}><ConfirmButton className="red sm" message="ยกเลิกและลบใบแจ้งซ่อมนี้?"><Icon n="trash" size={15} />ยกเลิก/ลบ</ConfirmButton></form></div>}
          {t.status === 'done' && <div className="t-foot">{t.score
            ? <span className="stars"><Icon n="star" size={16} />{t.score}/5 <span className="muted" style={{ fontWeight: 400 }}>— {t.r_comment}</span></span>
            : <form action={submitRating.bind(null, t.id)} className="rate"><select name="score" defaultValue="5" aria-label="คะแนน">{[5, 4, 3, 2, 1].map((i) => <option key={i} value={i}>{i} ★</option>)}</select>
              <input name="comment" placeholder="ความพึงพอใจต่องานซ่อม" required maxLength={500} /><button className="sm">ส่งประเมิน</button></form>}</div>}
        </article>))}
      </div>
    </div></>);
}
