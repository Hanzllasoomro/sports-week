import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Points Rules — Admin Console | Sports Week 2026',
  description: 'Official points calculation rules matrix and scoring criteria.',
};

export default function AdminPointsRulesPage() {
  const teamRules = [
    { stage: 'Group Stage Win', points: 3, description: 'Awarded to the winner of any pool/league match.' },
    { stage: 'Semi-Final Win', points: 5, description: 'Awarded to the winner advancing to the Grand Final.' },
    { stage: 'Final Runner-Up', points: 7, description: 'Awarded to the 2nd place finalist.' },
    { stage: 'Final Champion (1st)', points: 10, description: 'Awarded to the gold champion squad.' },
  ];

  const individualRules = [
    { position: '1st Place (Gold Medal)', points: 10, description: 'Highest points credited to the winner’s batch.' },
    { position: '2nd Place (Silver Medal)', points: 7, description: 'Credited to the runner-up athlete’s batch.' },
    { position: '3rd Place (Bronze Medal)', points: 5, description: 'Credited to the bronze medalist’s batch.' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6 border-b border-outline-variant/30 pb-4">
        <h1 className="font-display text-white text-2xl sm:text-3xl uppercase tracking-tight">
          TOURNAMENT POINTS RULES
        </h1>
        <p className="font-body text-fog-text text-xs sm:text-sm mt-1">
          Rule configurations that govern automatic standings calculation via <code className="text-gold-accent">lib/points.ts</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Sports Matrix */}
        <div className="bg-surface-container border border-outline-variant/20 rounded p-6 shadow">
          <div className="flex items-center gap-2.5 mb-4 text-gold-accent font-caps-label text-sm uppercase font-bold">
            <span className="material-symbols-outlined">groups</span>
            <span>Team Sports Matrix</span>
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/15">
            {teamRules.map((rule) => (
              <div key={rule.stage} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block font-caps-label">
                    {rule.stage}
                  </span>
                  <span className="text-xs text-fog-text">{rule.description}</span>
                </div>
                <span className="font-display text-gold-accent text-2xl pl-4">
                  +{rule.points} <span className="text-xs font-caps-label text-fog-text">PTS</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Sports Matrix */}
        <div className="bg-surface-container border border-outline-variant/20 rounded p-6 shadow">
          <div className="flex items-center gap-2.5 mb-4 text-primary font-caps-label text-sm uppercase font-bold">
            <span className="material-symbols-outlined">military_tech</span>
            <span>Individual Sports Podium</span>
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/15">
            {individualRules.map((rule) => (
              <div key={rule.position} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block font-caps-label">
                    {rule.position}
                  </span>
                  <span className="text-xs text-fog-text">{rule.description}</span>
                </div>
                <span className="font-display text-primary text-2xl pl-4">
                  +{rule.points} <span className="text-xs font-caps-label text-fog-text">PTS</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
