import { CATEGORY, PRIORITY } from '@/lib/labels';
export default function TicketFields({ t = {} }) {
  return (<>
    <label className="field"><span>หัวข้อปัญหา</span>
      <input name="title" placeholder="เช่น หลอดไฟห้องประชุมเสีย" defaultValue={t.title} required maxLength={100} /></label>
    <label className="field"><span>สถานที่</span>
      <input name="location" placeholder="เช่น อาคาร A ชั้น 2 ห้อง 204" defaultValue={t.location} required maxLength={100} /></label>
    <div className="cols">
      <label className="field"><span>ประเภทงาน</span>
        <select name="category" defaultValue={t.category || 'electric'}>{Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label className="field"><span>ความเร่งด่วน</span>
        <select name="priority" defaultValue={t.priority || 'normal'}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
    </div>
    <label className="field"><span>รายละเอียดอาการ</span>
      <textarea name="description" placeholder="เกิดอะไรขึ้น เริ่มเป็นตั้งแต่เมื่อไหร่" defaultValue={t.description} required maxLength={1000} /></label>
  </>);
}
