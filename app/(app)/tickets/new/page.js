import Link from 'next/link';
import { requireApproved } from '@/lib/auth';
import { CATEGORY } from '@/lib/labels';
import TicketFields from '@/app/ticket-form';
import { createTicket } from '@/app/actions';
export default async function New({ searchParams }) {
  await requireApproved();
  const { cat } = await searchParams;
  return (<>
    <div className="page-head"><div><h1>แจ้งซ่อมใหม่</h1><p>กรอกรายละเอียดให้ครบ ช่างจะได้ดำเนินการได้เร็วขึ้น</p></div></div>
    <form action={createTicket} className="card pad-lg" style={{ maxWidth: 640 }}>
      <TicketFields t={{ category: cat in CATEGORY ? cat : undefined }} />
      <div className="row end"><Link href="/" className="btn ghost">ยกเลิก</Link><button>ส่งใบแจ้งซ่อม</button></div>
    </form></>);
}
