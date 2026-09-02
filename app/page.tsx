import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sports Week 2026 — SES, MUET',
  description:
    'Live scores, standings, and schedule for SES Sports Week 2026 — 8th–10th September at the MUET Gymnasium.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">

      {/* ── Hero Section ─────────────────────────────────── */}
      <section
        className="relative w-full min-h-[600px] flex items-center overflow-hidden bg-navy-mid border-b border-outline-variant/30"
        style={{ borderBottom: '1px solid rgba(70,70,79,0.3)' }}
      >
        {/* Ghost athlete background — Phase 1 will use a real image */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-navy-deep" />

        <div className="relative z-10 w-full px-4 md:px-8 flex flex-col justify-center h-full max-w-7xl mx-auto py-16">
          <div className="flex items-stretch gap-6 lg:gap-12 border-l-4 border-gold-accent pl-6">

            {/* Date stack */}
            <div className="hidden md:flex flex-col justify-between font-display text-on-surface-variant opacity-80 uppercase leading-none py-2 text-5xl">
              <span>8TH</span>
              <span>—</span>
              <span>10TH</span>
              <span className="text-2xl">SEPT</span>
              <span className="text-2xl">2026</span>
            </div>

            {/* Main title */}
            <div className="flex flex-col justify-center">
              <div className="md:hidden font-caps-label text-gold-accent mb-3">
                8TH–10TH SEPT 2026
              </div>
              <h1 className="font-display text-white uppercase leading-none tracking-tighter mb-6"
                  style={{ fontSize: 'clamp(3rem, 9vw, 7rem)', lineHeight: 1.05 }}>
                SPORTS<br />WEEK 2026
              </h1>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/standings"
                  className="inline-flex items-center gap-2 bg-gold-accent text-navy-deep font-caps-label px-8 py-4 hover:bg-white transition-colors duration-200"
                >
                  View Live Standings
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-2 border border-gold-accent text-gold-accent font-caps-label px-8 py-4 hover:bg-gold-accent/10 transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-base">sensors</span>
                  Live Scores
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick nav cards ───────────────────────────────── */}
      <section className="w-full px-4 md:px-8 py-16 max-w-7xl mx-auto">
        <h2 className="font-display text-on-surface uppercase tracking-tight mb-8 text-4xl">
          MUET GYMNASIUM
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { href: '/standings', icon: 'leaderboard', label: 'Standings', desc: 'Batch leaderboard' },
            { href: '/schedule',  icon: 'calendar_today', label: 'Schedule', desc: 'All fixtures by day' },
            { href: '/live',      icon: 'sensors',      label: 'Live Scores', desc: 'Matches in progress' },
            { href: '/games',     icon: 'sports',       label: 'Games',  desc: 'Rules & rosters' },
          ].map(({ href, icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group bg-surface-container hover:bg-navy-mid transition-colors duration-200 p-6 flex flex-col gap-3 border-b-2 border-transparent hover:border-gold-accent"
            >
              <span className="material-symbols-outlined text-gold-accent group-hover:scale-110 transition-transform text-3xl">
                {icon}
              </span>
              <div>
                <div className="font-caps-label text-on-surface">{label}</div>
                <div className="font-body text-fog-text text-sm mt-1">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
