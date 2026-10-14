export const maskEmail = (e) => { const [u, d] = e.split('@'); return `${u[0]}${'*'.repeat(Math.max(u.length - 1, 2))}@${d}`; };
export const maskPhone = (p) => (p ? `${p.slice(0, 3)}-xxx-${p.slice(-4)}` : 'ยังไม่ระบุ');
