import { cookies } from 'next/headers';
import crypto from 'crypto';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: '관리자 | HD현대 식단 앱',
  robots: { index: false, follow: false },
};

function sessionToken() {
  return crypto.createHash('sha256').update(String(process.env.ADMIN_PASSWORD || '')).digest('hex');
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  const isAuthed = !!session && session === sessionToken();

  if (!isAuthed) return <AdminLogin />;
  return <AdminDashboard />;
}
