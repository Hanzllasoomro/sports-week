import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameBySlug, getFixtures, getGames } from '@/lib/data/public';
import { fixtureTime } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const games = await getGames();
  return games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: 'Game Not Found' };

  return {
    title: `${game.name} — Sports Week 2026`,
    description: `Official rules, tournament fixtures, and match results for ${game.name} at SES Sports Week 2026.`,
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const [game, allFixtures] = await Promise.all([
    getGameBySlug(slug),
    getFixtures(),
  ]);

  if (!game) notFound();

  const gameFixtures = allFixtures.filter((f) => f.game.slug === game.slug);

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/games"
          className="text-xs font-caps-label text-gold-accent hover:text-white uppercase flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to All Games
        </Link>
      </div>

      {/* Header Banner */}
      <div className="mb-8 p-6 sm:p-8 bg-navy-mid border-l-4 border-gold-accent rounded-r shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-navy-deep border border-gold-accent/40 flex items-center justify-center text-gold-accent shrink-0">
            <span className="material-symbols-outlined text-3xl">{game.icon}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-caps-label text-[10px] uppercase px-2 py-0.5 rounded bg-surface-container-high text-gold-accent font-bold">
                {game.format} Championship
              </span>
              <span className="font-caps-label text-[10px] uppercase px-2 py-0.5 rounded bg-surface-container text-fog-text">
                Category: {game.gender}
              </span>
            </div>
            <h1 className="font-display text-white text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight">
              {game.name}
            </h1>
            <p className="font-body text-fog-text text-xs sm:text-sm mt-2 max-w-xl">
              {game.description}
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6 shrink-0 text-right">
          <div>
            <span className="text-xs text-fog-text font-caps-label uppercase block">
              Scheduled Fixtures
            </span>
            <span className="font-display text-gold-accent text-2xl sm:text-3xl">
              {gameFixtures.length} Matches
            </span>
          </div>
        </div>
      </div>

      {/* Tournament Rules Section */}
      <section className="mb-10 p-5 sm:p-6 bg-surface-container border border-outline-variant/20 rounded">
        <h2 className="font-caps-label text-sm uppercase text-white font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-gold-accent text-lg">gavel</span>
          OFFICIAL SPORT REGULATIONS &amp; RULES
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {game.rules.map((rule, idx) => (
            <li
              key={idx}
              className="text-xs sm:text-sm text-fog-text flex items-start gap-2 bg-surface-container-low p-2.5 rounded border border-outline-variant/10"
            >
              <span className="text-gold-accent font-bold">&bull;</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Fixtures for this sport */}
      <section>
        <h2 className="font-display text-white uppercase text-2xl mb-4 tracking-tight">
          TOURNAMENT FIXTURES
        </h2>

        {gameFixtures.length === 0 ? (
          <div className="p-8 text-center bg-surface-container rounded border border-outline-variant/20">
            <p className="text-xs sm:text-sm text-fog-text">
              Fixture draws for {game.name} are being finalized by tournament officials. Check the event schedule shortly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {gameFixtures.map((fixture) => {
              const isLive = fixture.status === 'live';
              const isCompleted = fixture.status === 'completed';

              return (
                <div
                  key={fixture.id}
                  className={`p-4 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLive
                      ? 'bg-navy-mid border-live-red/60 shadow'
                      : 'bg-surface-container border-outline-variant/20'
                  }`}
                >
                  <div>
                    <span className="font-caps-label text-xs text-gold-accent uppercase font-bold block">
                      {fixture.round || fixture.stage} &bull; {fixtureTime(fixture.scheduled_at)}
                    </span>
                    <div className="font-caps-label text-sm sm:text-base text-white mt-1">
                      {fixture.team_a?.name || fixture.player_a?.name || 'TBD'} vs{' '}
                      {fixture.team_b?.name || fixture.player_b?.name || 'TBD'}
                    </div>
                    <span className="text-xs text-fog-text">
                      {fixture.venue || 'MUET Gymnasium'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {(isLive || isCompleted) && (
                      <div className="font-display text-xl sm:text-2xl text-gold-accent">
                        {fixture.score_a ?? 0} &ndash; {fixture.score_b ?? 0}
                      </div>
                    )}
                    <div>
                      {isLive ? (
                        <span className="px-2.5 py-1 bg-surface-container-highest border border-live-red/50 text-live-red font-caps-label text-xs uppercase font-bold rounded flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-live-red pulse-live" />
                          Live
                        </span>
                      ) : isCompleted ? (
                        <span className="font-caps-label text-xs text-win-green uppercase font-semibold">
                          Final
                        </span>
                      ) : (
                        <span className="font-caps-label text-xs text-fog-text uppercase">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
