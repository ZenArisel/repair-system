import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { requireApproved } from '@/lib/auth';
import { updateTicket } from '@/app/actions';
import TicketFields from '@/app/ticket-form';

export default async function Edit({ params }) {
  const u = await requireApproved(); const id = Number((await params).id);
  const t = Number.isInteger(id) ? (await sql`SELECT * FROM tickets WHERE id=${id} AND user_id=${u.id} AND status='pending'`)[0] : null;
  if (!t) notFound(); // ของคนอื่น หรือไม่ใช่สถานะรอดำเนินการ = 404
  return (<>
    <div className="page-head"><div><h1>แก้ไขใบแจ้งซ่อม #{id}</h1><p>แก้ไขได้จนกว่าผู้ดูแลจะรับเรื่อง</p></div></div>
    <form action={updateTicket.bind(null, id)} className="card pad-lg" style={{ maxWidth: 640 }}>
      <TicketFields t={t} />
      <div className="row end"><Link href="/" className="btn ghost">ยกเลิก</Link><button>บันทึก</button></div>
    </form></>);
}
