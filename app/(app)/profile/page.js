import { requireUser } from '@/lib/auth';
import { maskEmail, maskPhone } from '@/lib/mask';
import { VERIFY } from '@/lib/labels';
import { updateProfile } from '@/app/actions';
export default async function Profile() {
  const u = await requireUser();
  return (<>
    <div className="page-head"><div><h1>โปรไฟล์</h1><p>ข้อมูลที่ผู้ดูแลระบบใช้ติดต่อกลับเรื่องงานซ่อม</p></div></div>
    <div className="cols">
      <form action={updateProfile} className="card pad-lg">
        <h2>แก้ไขข้อมูล</h2>
        <label className="field"><span>ชื่อ</span><input name="name" defaultValue={u.name} required minLength={2} maxLength={60} /></label>
        <label className="field"><span>เบอร์โทร</span><input name="phone" inputMode="tel" defaultValue={u.phone ?? ''} placeholder="0812345678" required /></label>
        <div className="row end"><button>บันทึก</button></div>
      </form>
      <div className="card pad-lg">
        <h2>บัญชี</h2>
        <dl className="kv" style={{ margin: 0 }}>
          <dt>อีเมล</dt><dd>{maskEmail(u.email)}</dd>
          <dt>เบอร์โทร</dt><dd>{maskPhone(u.phone)}</dd>
          <dt>สิทธิ์</dt><dd>{u.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}</dd>
          <dt>สถานะ</dt><dd>{u.role === 'admin' ? 'ผู้ดูแลระบบ' : VERIFY[u.verify_status]}</dd>
        </dl>
      </div>
    </div></>);
}
