import { requireUser } from '@/lib/auth';
import { VERIFY } from '@/lib/labels';
import { requestVerification } from '@/app/actions';

export const dynamic = 'force-dynamic';
export default async function Verify({ searchParams }) {
  const u = await requireUser(); const { error } = await searchParams;
  const st = u.role === 'admin' ? 'approved' : u.verify_status;
  const canSubmit = st === 'unverified' || st === 'rejected';
  return (<>
    <div className="page-head"><div><h1>ยืนยันตัวตน</h1><p>เฉพาะบุคลากรที่ผู้ดูแลระบบอนุมัติแล้วเท่านั้นที่แจ้งซ่อมได้</p></div></div>
    <div className="stack" style={{ maxWidth: 640 }}>
      <div className="card pad-lg">
        <div className="row"><b className="grow">สถานะคำขอ</b>
          <span className={`badge ${st === 'approved' ? 'done' : st === 'rejected' ? 'rejected' : 'pending'}`}>{u.role === 'admin' ? 'ผู้ดูแลระบบ' : VERIFY[st]}</span></div>
        {st === 'rejected' && <p className="err">คำขอไม่ผ่าน{u.verify_reply ? `: ${u.verify_reply}` : ''} — แก้ไขข้อมูลแล้วส่งใหม่ได้</p>}
        {st === 'pending' && <p className="muted">ส่งคำขอแล้ว รอผู้ดูแลระบบตรวจสอบ</p>}
        {st === 'approved' && u.role !== 'admin' && <p>คุณแจ้งซ่อมได้แล้ว</p>}
        {u.real_name && (st === 'pending' || st === 'approved') && <dl className="kv" style={{ margin: 0 }}>
          <dt>ชื่อ-นามสกุล</dt><dd>{u.real_name}</dd><dt>หน่วยงาน</dt><dd>{u.department}</dd><dt>ตึก/สถานที่</dt><dd>{u.building}</dd></dl>}
      </div>
      {canSubmit && <form action={requestVerification} className="card pad-lg">
        <h2>ส่งคำขอยืนยันตัวตน</h2>{error && <p className="err">กรุณากรอกข้อมูลให้ครบถ้วน</p>}
        <label className="field"><span>ชื่อ-นามสกุลจริง</span><input name="real_name" defaultValue={u.real_name ?? ''} required maxLength={80} /></label>
        <label className="field"><span>หน่วยงาน/ตำแหน่ง</span><input name="department" placeholder="เช่น ฝ่ายบัญชี" defaultValue={u.department ?? ''} required maxLength={80} /></label>
        <label className="field"><span>ตึกหรือสถานที่ที่สังกัด</span><input name="building" placeholder="เช่น ตึก A" defaultValue={u.building ?? ''} required maxLength={60} /></label>
        <label className="field"><span>เหตุผลที่ขอใช้งาน / ช่องทางติดต่อ</span><textarea name="reason" required minLength={5} maxLength={300} /></label>
        <div className="row end"><button>ส่งคำขอ</button></div></form>}
    </div></>);
}
