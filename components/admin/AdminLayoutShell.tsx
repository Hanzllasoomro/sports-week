'use client';

import { usePathname } from 'next/navigation';
import type { AuthSessionUser } from '@/types';
import { AdminNav } from './AdminNav';
import { AdminHeader } from './AdminHeader';

export function AdminLayoutShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: AuthSessionUser | null;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative overflow-x-hidden selection:bg-gold-accent selection:text-navy-deep">
      {/* Top Header */}
      <AdminHeader user={user} />

      {/* Desktop SideNav */}
      <AdminNav user={user} />

      {/* Main Content Area */}
      <div className="flex-1 w-full lg:pl-64 pt-16 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
