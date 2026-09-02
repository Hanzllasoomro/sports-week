'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Live Scores', href: '/live', icon: 'sensors' },
  { label: 'Standings', href: '/standings', icon: 'leaderboard' },
  { label: 'Schedule', href: '/schedule', icon: 'calendar_today' },
  { label: 'Games', href: '/games', icon: 'sports' },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 bg-surface-container-low border-r border-outline-variant/20 w-64 pt-6 pb-6 select-none">
      {/* Brand & Crest Header */}
      <div className="px-6 mb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full bg-navy-mid flex items-center justify-center border border-gold-accent/40 text-gold-accent font-display text-xl tracking-wider shadow-inner group-hover:border-gold-accent transition-colors">
            SW
          </div>
          <div>
            <h2 className="font-h2 text-gold-accent leading-none tracking-tight text-xl">
              SPORTS WEEK
            </h2>
            <p className="font-caps-label text-on-surface-variant uppercase text-[11px] mt-1 tracking-wider">
              SES &bull; MUET 2026
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 font-caps-label uppercase text-sm transition-all duration-200 ease-in-out rounded-sm',
                isActive
                  ? 'bg-navy-mid text-gold-accent border-l-4 border-gold-accent font-bold pl-3'
                  : 'text-on-surface-variant hover:bg-navy-mid/40 hover:text-on-surface border-l-4 border-transparent'
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined text-xl transition-transform duration-200',
                  isActive && 'text-gold-accent scale-110'
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.href === '/live' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-live-red pulse-live" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-6 mt-auto flex flex-col gap-3 pt-4 border-t border-outline-variant/20">
        <Link
          href="/live"
          className="w-full bg-gold-accent text-navy-deep font-caps-label uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-white transition-colors text-xs tracking-wider shadow-sm font-bold"
        >
          <span className="material-symbols-outlined text-base">sensors</span>
          View Live Feed
        </Link>

        <div className="flex items-center justify-between text-xs font-caps-label text-on-surface-variant px-1 pt-1">
          <Link
            href="/admin/login"
            className="hover:text-gold-accent transition-colors flex items-center gap-1 text-[11px]"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            Admin Portal
          </Link>
          <span className="text-outline-variant text-[10px]">MUET &bull; Gym</span>
        </div>
      </div>
    </aside>
  );
}
