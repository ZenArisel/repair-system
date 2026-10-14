import './globals.css';
import { getSiteName } from '@/lib/settings';
export async function generateMetadata() { return { title: await getSiteName() }; }
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6821f' };
export default function L({ children }) { return <html lang="th"><body>{children}</body></html>; }
