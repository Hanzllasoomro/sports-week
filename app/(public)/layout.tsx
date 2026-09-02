import { SideNav } from '@/components/public/SideNav';
import { TopHeader } from '@/components/public/TopHeader';
import { BottomNav } from '@/components/public/BottomNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative overflow-x-hidden selection:bg-gold-accent selection:text-navy-deep">
      {/* Mobile / Tablet Top Header (fixed) */}
      <TopHeader />

      {/* Desktop Left Sidebar (fixed) */}
      <SideNav />

      {/* Main Content Canvas */}
      <div className="flex-1 w-full lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0 flex flex-col min-h-screen transition-all">
        {children}
      </div>

      {/* Mobile Bottom Navigation (fixed) */}
      <BottomNav />
    </div>
  );
}
