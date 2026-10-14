'use client';
// ปุ่มที่ถามยืนยันก่อนส่งฟอร์ม (ใช้กับการลบ)
export default function ConfirmButton({ message, children, ...p }) {
  return <button {...p} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}
