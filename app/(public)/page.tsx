import type { Metadata } from 'next';
import Link from 'next/link';
import { getFixtures, getStandings } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Home — Sports Week 2026 | SES, MUET',
  description:
    'Official live scoreboard, standings, and match schedules for SES Sports Week 2026 (8th–10th September) at MUET Gymnasium.',
};

export default async function HomePage() {
  const [fixtures, standings] = await Promise.all([
    getFixtures(),
    getStandings(),
  ]);

  const liveFixtures = fixtures.filter((f) => f.status === 'live');
  const recentFixtures = fixtures.slice(0, 5);
  const leaderBatch = standings[0];

  return (
    <main className="flex-1 flex flex-col w-full">
      {/* ─── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[500px] md:min-h-[580px] lg:min-h-[620px] flex items-center overflow-hidden bg-navy-mid border-b border-outline-variant/30">
        {/* Ghost background overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(10, 18, 64, 0.95) 0%, rgba(20, 40, 104, 0.8) 50%, rgba(10, 18, 64, 0.9) 100%), url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />

        <div className="relative z-10 w-full px-4 sm:px-6 md:px-10 py-12 md:py-16 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-stretch gap-6 md:gap-8 lg:gap-12">
            {/* Date Stack (Desktop: Left Anchored) */}
            <div className="hidden md:flex flex-col justify-between font-display text-on-surface-variant/80 uppercase leading-[0.85] py-2 border-l-4 border-gold-accent pl-6 text-4xl lg:text-5xl select-none">
              <span>8TH</span>
              <span className="text-gold-accent text-3xl">&mdash;</span>
              <span>10TH</span>
              <span className="text-2xl text-cream font-bold">SEPT</span>
              <span className="text-xl text-gold-accent">2026</span>
            </div>

            {/* Main Title & Action CTAs */}
            <div className="flex flex-col justify-center max-w-3xl">
              {/* Mobile date pill */}
              <div className="md:hidden inline-flex items-center gap-2 px-3 py-1 bg-navy-deep/80 border border-gold-accent/40 rounded text-gold-accent font-caps-label text-xs uppercase tracking-wider mb-3 w-fit">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                8TH &ndash; 10TH SEPT 2026 &bull; MUET GYMNASIUM
              </div>

              <h1
                className="font-display text-white uppercase tracking-tight text-left leading-[0.95] mb-4 sm:mb-6"
                style={{ fontSize: 'clamp(2.75rem, 8.5vw, 6.5rem)' }}
              >
                SPORTS
                <br />
                <span className="text-cream">WEEK 2026</span>
              </h1>

              <p className="font-body text-fog-text text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-xl leading-relaxed">
                Society of Software Engineers &amp; AI Department annual athletics and indoor games championship. 9 batches competing for the unified university trophy.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  href="/standings"
                  className="w-full sm:w-auto bg-gold-accent text-navy-deep font-caps-label uppercase px-7 py-4 flex items-center justify-center gap-3 hover:bg-white transition-all duration-200 font-bold text-sm tracking-wider shadow-lg active:scale-98"
                >
                  <span>View Live Standings</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>

                <Link
                  href="/live"
                  className="w-full sm:w-auto border-2 border-gold-accent text-gold-accent font-caps-label uppercase px-7 py-3.5 flex items-center justify-center gap-2 hover:bg-gold-accent/15 transition-all duration-200 text-sm tracking-wider font-bold active:scale-98"
                >
                  <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                  <span>Live Match Center</span>
                </Link>
              </div>

              {/* Leader Banner */}
              {leaderBatch && (
                <div className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-caps-label text-fog-text">
                  <span className="text-gold-accent flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">military_tech</span>
                    CURRENT #1 SEED:
                  </span>
                  <span className="text-white font-bold px-2 py-0.5 bg-surface-container-high rounded border border-gold-accent/40">
                    {leaderBatch.batch.code} ({leaderBatch.total_points} PTS)
                  </span>
                  <span className="text-on-surface-variant hidden sm:inline">&bull;</span>
                  <span className="text-on-surface-variant">
                    {leaderBatch.batch.department.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LATEST RESULTS & FIXTURES TICKER ──────────────────────────── */}
      <section className="w-full px-4 sm:px-6 md:px-10 py-10 md:py-16 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-outline-variant/30 pb-4">
          <div>
            <h2 className="font-display text-white uppercase text-2xl sm:text-3xl md:text-4xl tracking-tight">
              MATCH FEED &amp; SCORES
            </h2>
            <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
              Live updates and latest completed fixture results from the tournament
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/live"
              className="text-gold-accent hover:text-white font-caps-label uppercase text-xs tracking-wider flex items-center gap-1 transition-colors"
            >
              <span>See All Live</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Fixture Cards List */}
        <div className="flex flex-col gap-2.5">
          {recentFixtures.map((fixture) => {
            const isLive = fixture.status === 'live';
            const isCompleted = fixture.status === 'completed';

            const teamAName = fixture.team_a?.name || fixture.player_a?.name || 'TBD';
            const teamBName = fixture.team_b?.name || fixture.player_b?.name || 'TBD';
            const batchACode = fixture.team_a?.batch?.code || fixture.player_a?.batch?.code || '';
            const batchBCode = fixture.team_b?.batch?.code || fixture.player_b?.batch?.code || '';

            return (
              <div
                key={fixture.id}
                className={`p-3.5 sm:p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLive
                    ? 'bg-navy-mid border-l-4 border-live-red shadow-md'
                    : 'bg-surface-container border-l-4 border-transparent hover:bg-surface-container-high'
                }`}
              >
                {/* Left: Sport info & timing */}
                <div className="flex items-center gap-3 sm:w-1/3">
                  <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center text-gold-accent border border-outline-variant/30 shrink-0">
                    <span className="material-symbols-outlined text-xl">
                      {fixture.game.slug === 'cricket'
                        ? 'sports_cricket'
                        : fixture.game.slug === 'futsal'
                        ? 'sports_soccer'
                        : fixture.game.slug === 'volleyball'
                        ? 'sports_volleyball'
                        : fixture.game.slug === 'throwball'
                        ? 'sports_handball'
                        : fixture.game.slug === 'tug-of-war'
                        ? 'fitness_center'
                        : 'sports'}
                    </span>
                  </div>
                  <div>
                    <span className="font-caps-label text-xs text-white uppercase block font-bold">
                      {fixture.game.name}
                    </span>
                    <span className="font-table-numeral text-[11px] text-fog-text">
                      {fixture.venue || 'MUET Gymnasium'} &bull; {fixture.round || fixture.stage}
                    </span>
                  </div>
                </div>

                {/* Center: Teams & Scores */}
                <div className="flex items-center justify-between sm:justify-center gap-3 sm:gap-6 sm:w-1/3 py-1 sm:py-0 border-y border-outline-variant/10 sm:border-y-0">
                  <div className="text-right sm:w-28">
                    <div className="font-caps-label text-xs sm:text-sm font-bold text-on-surface truncate">
                      {teamAName}
                    </div>
                    {batchACode && (
                      <span className="font-table-numeral text-[10px] text-gold-accent">
                        {batchACode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-display text-base sm:text-2xl px-2">
                    {isLive || isCompleted ? (
                      <>
                        <span className="text-white font-bold font-table-numeral">
                          {fixture.game.slug === 'cricket' && fixture.cricket_details?.team_a_cricket
                            ? `${fixture.cricket_details.team_a_cricket.runs}/${fixture.cricket_details.team_a_cricket.wickets}`
                            : fixture.score_a ?? 0}
                        </span>
                        <span className="text-outline-variant text-base">&ndash;</span>
                        <span className="text-white font-bold font-table-numeral">
                          {fixture.game.slug === 'cricket' && fixture.cricket_details?.team_b_cricket
                            ? `${fixture.cricket_details.team_b_cricket.runs}/${fixture.cricket_details.team_b_cricket.wickets}`
                            : fixture.score_b ?? 0}
                        </span>
                      </>
                    ) : (
                      <span className="font-caps-label text-xs text-fog-text uppercase">VS</span>
                    )}
                  </div>

                  <div className="text-left sm:w-28">
                    <div className="font-caps-label text-xs sm:text-sm font-bold text-on-surface truncate">
                      {teamBName}
                    </div>
                    {batchBCode && (
                      <span className="font-table-numeral text-[10px] text-gold-accent">
                        {batchBCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Status badge */}
                <div className="flex items-center justify-end gap-2 sm:w-1/4 shrink-0">
                  {isLive ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest border border-live-red/50 text-live-red font-caps-label text-xs uppercase font-bold">
                      <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                      <span>Live</span>
                    </div>
                  ) : isCompleted ? (
                    <span className="font-caps-label text-xs text-win-green uppercase font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Final
                    </span>
                  ) : (
                    <span className="font-caps-label text-xs text-fog-text uppercase">
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── QUICK EXPLORE HUB ─────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-6 md:px-10 py-10 md:py-16 bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-white uppercase text-2xl sm:text-3xl mb-8 tracking-tight">
            TOURNAMENT HUB
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'STANDINGS',
                desc: 'Combined 9-batch leaderboard with full sport points breakdown.',
                href: '/standings',
                icon: 'leaderboard',
                tag: 'Leaderboard',
              },
              {
                title: 'EVENT SCHEDULE',
                desc: 'Day 1 (Sep 8), Day 2 (Sep 9), and Day 3 (Sep 10) fixtures.',
                href: '/schedule',
                icon: 'calendar_today',
                tag: 'Timeline',
              },
              {
                title: 'GAMES CATALOG',
                desc: 'Rules, formats, and schedules for all 10 championship sports.',
                href: '/games',
                icon: 'sports',
                tag: '10 Sports',
              },
              {
                title: 'LIVE SCORES',
                desc: 'Instant updates with score progression as matches happen.',
                href: '/live',
                icon: 'sensors',
                tag: 'Realtime',
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group p-6 bg-surface-container hover:bg-navy-mid border-b-2 border-transparent hover:border-gold-accent transition-all duration-200 flex flex-col justify-between min-h-[190px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-gold-accent text-3xl group-hover:scale-110 transition-transform">
                      {card.icon}
                    </span>
                    <span className="font-caps-label text-[11px] text-fog-text px-2 py-0.5 bg-surface-container-high rounded">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-h2 text-white text-lg uppercase tracking-tight group-hover:text-gold-accent transition-colors">
                    {card.title}
                  </h3>
                  <p className="font-body text-fog-text text-xs sm:text-sm mt-2 line-clamp-2">
                    {card.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-gold-accent font-caps-label text-xs uppercase font-bold mt-4">
                  <span>Explore</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
