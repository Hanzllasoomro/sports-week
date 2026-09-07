import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';
import { verifyAndDecodeAdminSession } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Admin Console — Sports Week 2026',
  description: 'Tournament management console for SES Sports Week 2026.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const user = await verifyAndDecodeAdminSession(token);

  return <AdminLayoutShell user={user}>{children}</AdminLayoutShell>;
}
