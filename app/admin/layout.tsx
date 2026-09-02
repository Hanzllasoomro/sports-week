import type { Metadata } from 'next';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Admin Console — Sports Week 2026',
  description: 'Tournament management console for SES Sports Week 2026.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
