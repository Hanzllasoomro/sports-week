'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function TopHeader() {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Live', href: '/live' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Standings', href: '/standings' },
    { label: 'Games', href: '/games' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-16 bg-navy-mid border-b border-outline-variant/30 lg:hidden shadow-md">
      {/* Brand logo & title */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-navy-deep border border-gold-accent/50 flex items-center justify-center text-gold-accent font-display text-sm">
          SW
        </div>
        <span className="font-display text-gold-accent text-lg sm:text-xl tracking-wider uppercase">
          SPORTS WEEK &apos;26
        </span>
      </Link>

      {/* Tablet middle links */}
      <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-caps-label text-xs uppercase tracking-wider transition-colors pb-1',
                isActive
                  ? 'text-gold-accent border-b-2 border-gold-accent'
                  : 'text-on-surface-variant hover:text-gold-accent'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side live status & admin link */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/live"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest border border-outline-variant/30 rounded text-live-red hover:border-live-red/50 transition-colors"
          title="Live scores"
        >
          <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
          <span className="font-caps-label text-[10px] uppercase font-bold tracking-wider">
            Live
          </span>
        </Link>
        <Link
          href="/admin/login"
          className="text-on-surface-variant hover:text-gold-accent transition-colors p-1.5"
          title="Admin Login"
        >
          <span className="material-symbols-outlined text-lg">lock</span>
        </Link>
      </div>
    </header>
  );
}
