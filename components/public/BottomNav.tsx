'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  isSpecial?: boolean;
}

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Live', href: '/live', icon: 'sensors', isSpecial: true },
  { label: 'Schedule', href: '/schedule', icon: 'calendar_today' },
  { label: 'Standings', href: '/standings', icon: 'leaderboard' },
  { label: 'Games', href: '/games', icon: 'sports' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-highest border-t border-outline-variant/30 shadow-2xl backdrop-blur-md bg-opacity-95 pb-safe select-none"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 transition-all duration-200 active:scale-95',
              isActive
                ? 'text-gold-accent font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  'material-symbols-outlined text-2xl transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              >
                {item.icon}
              </span>
              {item.isSpecial && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-live-red pulse-live" />
              )}
            </div>
            <span
              className={cn(
                'font-caps-label text-[10px] tracking-wider uppercase mt-0.5',
                isActive && 'text-gold-accent'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
