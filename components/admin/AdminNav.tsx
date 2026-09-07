'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logoutAdmin } from '@/app/actions/admin';

import type { AuthSessionUser } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Manage Fixtures', href: '/admin/fixtures', icon: 'edit_calendar' },
  { label: 'Enter Results', href: '/admin/results', icon: 'scoreboard', badge: 'Live' },
  { label: 'Manage Games', href: '/admin/games', icon: 'sports' },
  { label: 'Manage Batches', href: '/admin/batches', icon: 'school' },
  { label: 'Manage Teams', href: '/admin/teams', icon: 'groups' },
  { label: 'Manage Players', href: '/admin/players', icon: 'person' },
  { label: 'Points Rules', href: '/admin/points-rules', icon: 'tune' },
];

const SCORER_NAV_ITEMS: NavItem[] = [
  { label: 'Score & Results Entry', href: '/admin/results', icon: 'scoreboard', badge: 'Live' },
];

export function AdminNav({ user }: { user?: AuthSessionUser | null }) {
  const pathname = usePathname();
  const isScorer = user?.role === 'scorer';
  const navItems = isScorer ? SCORER_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const brandHref = isScorer ? '/admin/results' : '/admin/dashboard';

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 bg-surface-container-low border-r border-outline-variant/20 w-64 pt-6 pb-6 select-none">
      {/* Brand Header */}
      <div className="px-6 mb-6">
        <Link href={brandHref} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-navy-mid flex items-center justify-center border border-gold-accent/40 text-gold-accent font-display text-lg">
            <span className="material-symbols-outlined text-xl">
              {isScorer ? 'sports_score' : 'shield'}
            </span>
          </div>
          <div>
            <h2 className="font-h2 text-gold-accent leading-none text-base uppercase">
              {isScorer ? 'SCORER PORTAL' : 'ADMIN PANEL'}
            </h2>
            <p className="font-caps-label text-on-surface-variant uppercase text-[10px] mt-1 tracking-wider">
              {isScorer ? `Official • ${user?.name || 'Scorer'}` : 'Sports Week • SES MUET'}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav Section Label */}
      <div className="px-6 py-2">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
          {isScorer ? 'Scoring Console' : 'Management'}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-3 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 font-caps-label uppercase text-xs transition-all duration-200 ease-in-out rounded-sm',
                isActive
                  ? 'bg-navy-mid text-gold-accent border-l-4 border-gold-accent font-bold pl-3'
                  : 'text-on-surface-variant hover:bg-navy-mid/40 hover:text-on-surface border-l-4 border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'material-symbols-outlined text-lg transition-transform duration-200',
                    isActive && 'text-gold-accent scale-110'
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded bg-live-red/20 text-live-red text-[9px] font-bold border border-live-red/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Official Scorer Info Card if Scorer */}
      {isScorer && (
        <div className="mx-3 mb-3 p-3 bg-navy-mid/60 border border-gold-accent/30 rounded text-center">
          <div className="font-caps-label text-[10px] text-gold-accent uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse" />
            <span>Official Scorer</span>
          </div>
          <div className="text-white text-xs font-semibold mt-1">
            {user?.name}
          </div>
          <div className="text-[10px] text-fog-text mt-0.5 leading-tight">
            Assigned: Game Match Scores &amp; Marathon Winner
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="px-4 mt-auto pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
        <Link
          href="/"
          target="_blank"
          className="w-full border border-gold-accent/40 text-gold-accent font-caps-label uppercase py-2.5 px-3 flex items-center justify-center gap-2 hover:bg-gold-accent hover:text-navy-deep transition-colors text-xs font-bold"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
          Public Scoreboard
        </Link>

        <form action={logoutAdmin} className="w-full">
          <button
            type="submit"
            className="w-full text-fog-text hover:text-live-red font-caps-label uppercase py-2 px-3 flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
