import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBatchByCode, getBatches } from '@/lib/data/public';

interface Props {
  params: Promise<{ batchCode: string }>;
}

export async function generateStaticParams() {
  const batches = await getBatches();
  return batches.map((b) => ({ batchCode: b.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { batchCode } = await params;
  const data = await getBatchByCode(batchCode);
  if (!data) return { title: 'Batch Not Found' };

  return {
    title: `Batch ${data.batch.code} Roster & Points — Sports Week 2026`,
    description: `Official team roster, player lineup, and points statistics for Batch ${data.batch.code} (${data.batch.department.name}).`,
  };
}

export default async function BatchRosterPage({ params }: Props) {
  const { batchCode } = await params;
  const data = await getBatchByCode(batchCode);

  if (!data) notFound();

  const { batch, standing, fixtures, players } = data;

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/standings"
          className="text-xs font-caps-label text-gold-accent hover:text-white uppercase flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Standings Leaderboard
        </Link>
      </div>

      {/* Batch Header Banner */}
      <div className="mb-8 p-6 sm:p-8 bg-navy-mid border-l-4 border-gold-accent rounded-r shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-navy-deep border-2 border-gold-accent/50 flex items-center justify-center text-gold-accent font-display text-2xl font-bold shrink-0">
            {batch.code}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-caps-label text-xs uppercase px-2 py-0.5 rounded bg-surface-container-high text-gold-accent font-bold">
                {batch.department.code} Department
              </span>
              <span className="font-caps-label text-xs uppercase text-fog-text">
                Class of {batch.year}
              </span>
            </div>
            <h1 className="font-display text-white text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight">
              BATCH {batch.code}
            </h1>
            <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
              {batch.department.name} &bull; Mehran University of Engineering &amp; Technology
            </p>
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-8 shrink-0">
          <div>
            <span className="text-[11px] text-fog-text font-caps-label uppercase block">
              LEADERBOARD RANK
            </span>
            <span className="font-display text-gold-accent text-3xl sm:text-4xl">
              #{standing?.rank ?? '-'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-fog-text font-caps-label uppercase block">
              TOTAL POINTS
            </span>
            <span className="font-display text-white text-3xl sm:text-4xl">
              {standing?.total_points ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Sport Contribution Grid */}
      {standing && Object.keys(standing.breakdown).length > 0 && (
        <section className="mb-10">
          <h2 className="font-caps-label text-xs sm:text-sm uppercase text-gold-accent font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">leaderboard</span>
            SPORT POINTS CONTRIBUTION
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(standing.breakdown).map(([sport, pts]) => {
              const total = (pts.boys || 0) + (pts.girls || 0);
              if (total === 0) return null;

              return (
                <div
                  key={sport}
                  className="p-3 bg-surface-container rounded border border-outline-variant/20"
                >
                  <span className="text-[11px] font-caps-label text-fog-text uppercase block truncate">
                    {sport.replace('-', ' ')}
                  </span>
                  <div className="font-display text-gold-accent text-xl mt-1">
                    +{total} <span className="text-xs font-caps-label text-fog-text">PTS</span>
                  </div>
                  <div className="text-[10px] text-fog-text mt-0.5">
                    B: {pts.boys} &bull; G: {pts.girls}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Registered Players & Athletes Roster */}
      <section className="mb-10">
        <h2 className="font-display text-white uppercase text-2xl mb-4 tracking-tight">
          REGISTERED ATHLETES &amp; ROSTER ({players.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="p-4 bg-surface-container border border-outline-variant/20 rounded flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-mid flex items-center justify-center text-gold-accent font-display text-sm">
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-caps-label text-sm text-white font-bold block">
                    {player.name}
                  </span>
                  <span className="text-xs text-fog-text font-table-numeral">
                    {player.roll_no || 'Registered Competitor'}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-caps-label uppercase px-2 py-0.5 rounded bg-surface-container-high text-fog-text">
                {player.gender}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Batch Matches & History */}
      {fixtures.length > 0 && (
        <section>
          <h2 className="font-display text-white uppercase text-2xl mb-4 tracking-tight">
            BATCH FIXTURES &amp; MATCHES ({fixtures.length})
          </h2>

          <div className="flex flex-col gap-2.5">
            {fixtures.map((f) => (
              <div
                key={f.id}
                className="p-4 bg-surface-container border border-outline-variant/20 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-caps-label text-xs text-gold-accent uppercase font-bold block">
                    {f.game.name} &bull; {f.round || f.stage}
                  </span>
                  <div className="text-sm font-caps-label text-white mt-0.5">
                    {f.team_a?.name || f.player_a?.name || 'TBD'} vs{' '}
                    {f.team_b?.name || f.player_b?.name || 'TBD'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {f.status === 'completed' && (
                    <span className="font-display text-gold-accent text-lg">
                      {f.score_a} &ndash; {f.score_b}
                    </span>
                  )}
                  <span className="font-caps-label text-xs uppercase px-2 py-0.5 rounded bg-surface-container-high text-fog-text">
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
