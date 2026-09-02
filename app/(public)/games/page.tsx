import type { Metadata } from 'next';
import Link from 'next/link';
import { getGames } from '@/lib/data/public';

export const metadata: Metadata = {
  title: 'Games & Sports — Sports Week 2026',
  description:
    'Complete catalog of all 10 sports contested during SES Sports Week 2026: Cricket, Futsal, Volleyball, Throwball, Badminton, and more.',
};

export default async function GamesPage() {
  const games = await getGames();

  const teamGames = games.filter((g) => g.format === 'team');
  const individualGames = games.filter((g) => g.format === 'individual');

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 sm:mb-12 text-left border-l-4 border-gold-accent pl-4 sm:pl-6">
        <div className="font-caps-label text-gold-accent uppercase text-xs sm:text-sm tracking-wider mb-1">
          CHAMPIONSHIP CATALOG
        </div>
        <h1
          className="font-display text-white uppercase tracking-tight leading-none"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          EVENT <span className="text-gold-accent">GAMES</span>
        </h1>
        <p className="font-body text-fog-text text-xs sm:text-base mt-2 max-w-2xl">
          Overview of all 10 championship sports contested across the 3 days. Rules, formats, and point allocation standards.
        </p>
      </div>

      {/* Team Sports Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-3">
          <span className="material-symbols-outlined text-gold-accent text-2xl">groups</span>
          <h2 className="font-display text-white uppercase text-xl sm:text-2xl tracking-tight">
            TEAM SPORTS (6)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamGames.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="p-5 sm:p-6 bg-surface-container hover:bg-navy-mid border-b-2 border-transparent hover:border-gold-accent transition-all duration-200 rounded flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined text-gold-accent text-3xl group-hover:scale-110 transition-transform">
                    {game.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-caps-label uppercase px-2 py-0.5 rounded bg-surface-container-high text-fog-text">
                      {game.gender}
                    </span>
                    <span className="text-[10px] font-caps-label uppercase px-2 py-0.5 rounded bg-gold-accent/20 text-gold-accent font-bold">
                      Team
                    </span>
                  </div>
                </div>

                <h3 className="font-h2 text-white text-lg sm:text-xl uppercase group-hover:text-gold-accent transition-colors">
                  {game.name}
                </h3>
                <p className="font-body text-fog-text text-xs sm:text-sm mt-2 line-clamp-2">
                  {game.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-caps-label text-gold-accent font-bold uppercase">
                <span>View Fixtures &amp; Rules</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Individual Sports Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-3">
          <span className="material-symbols-outlined text-gold-accent text-2xl">person</span>
          <h2 className="font-display text-white uppercase text-xl sm:text-2xl tracking-tight">
            INDIVIDUAL &amp; BOARD SPORTS (4)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {individualGames.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="p-5 sm:p-6 bg-surface-container hover:bg-navy-mid border-b-2 border-transparent hover:border-gold-accent transition-all duration-200 rounded flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined text-gold-accent text-3xl group-hover:scale-110 transition-transform">
                    {game.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-caps-label uppercase px-2 py-0.5 rounded bg-surface-container-high text-fog-text">
                      {game.gender}
                    </span>
                    <span className="text-[10px] font-caps-label uppercase px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                      Individual
                    </span>
                  </div>
                </div>

                <h3 className="font-h2 text-white text-lg sm:text-xl uppercase group-hover:text-gold-accent transition-colors">
                  {game.name}
                </h3>
                <p className="font-body text-fog-text text-xs sm:text-sm mt-2 line-clamp-2">
                  {game.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-caps-label text-gold-accent font-bold uppercase">
                <span>View Podium &amp; Rules</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
