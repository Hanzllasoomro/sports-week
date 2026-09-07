'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logoutAdmin } from '@/app/actions/admin';

import type { AuthSessionUser } from '@/types';

export function AdminHeader({ user }: { user?: AuthSessionUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isScorer = user?.role === 'scorer';

  const links = isScorer
    ? [{ label: 'Score & Marathon Results', href: '/admin/results', icon: 'scoreboard' }]
    : [
        { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
        { label: 'Fixtures', href: '/admin/fixtures', icon: 'edit_calendar' },
        { label: 'Results', href: '/admin/results', icon: 'scoreboard' },
        { label: 'Batches', href: '/admin/batches', icon: 'school' },
        { label: 'Games', href: '/admin/games', icon: 'sports' },
        { label: 'Teams', href: '/admin/teams', icon: 'groups' },
        { label: 'Players', href: '/admin/players', icon: 'person' },
      ];

  const brandHref = isScorer ? '/admin/results' : '/admin/dashboard';

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-8 h-16 bg-navy-mid border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gold-accent hover:text-white p-1 transition-colors"
            aria-label="Toggle admin menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>

          <Link href={brandHref} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-accent" />
            <span className="font-display text-gold-accent text-lg sm:text-xl uppercase tracking-wider">
              {isScorer ? 'SCORER CONSOLE' : 'ADMIN CONSOLE'}
            </span>
          </Link>
        </div>

        {/* Center: System status and user role identity */}
        <div className="hidden md:flex items-center gap-3">
          {isScorer ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-lowest border border-gold-accent/40 rounded-full text-xs font-caps-label text-gold-accent">
              <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
              <span>OFFICIAL SCORER: <strong className="text-white">{user?.name}</strong></span>
              <span className="text-[10px] text-fog-text">({user?.email})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-caps-label text-fog-text">
              <span className="w-2 h-2 rounded-full bg-win-green" />
              <span>DATABASE CONNECTED &bull; STATUS NOMINAL</span>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Mobile scorer badge if mobile */}
          {isScorer && (
            <span className="md:hidden px-2 py-0.5 rounded bg-gold-accent/20 border border-gold-accent/30 text-gold-accent text-[10px] font-caps-label uppercase font-bold">
              {user?.name}
            </span>
          )}

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high hover:bg-gold-accent hover:text-navy-deep text-gold-accent font-caps-label text-xs uppercase font-bold rounded transition-colors"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>Public Site</span>
          </Link>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="text-on-surface-variant hover:text-live-red font-caps-label text-xs uppercase flex items-center gap-1 transition-colors cursor-pointer p-1"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in-50 duration-200"
          onClick={() => setMobileOpen(false)}
        >
          <div className="font-caps-label text-xs uppercase text-gold-accent mb-4 tracking-widest">
            Admin Navigation
          </div>
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 font-caps-label uppercase text-sm rounded border',
                  pathname === link.href
                    ? 'bg-navy-mid text-gold-accent border-gold-accent font-bold'
                    : 'bg-surface-container text-white border-outline-variant/20'
                )}
              >
                <span className="material-symbols-outlined text-lg text-gold-accent">
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-outline-variant/30 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full bg-gold-accent text-navy-deep font-caps-label uppercase py-3 text-center text-xs font-bold"
            >
              Open Public Scoreboard
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
