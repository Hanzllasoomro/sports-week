export default function Loading() {
  return (
    <div className="flex-1 w-full min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Brand Emblem */}
        <div className="w-14 h-14 rounded-full bg-navy-mid border-2 border-gold-accent flex items-center justify-center text-gold-accent font-display text-xl animate-pulse shadow-lg">
          SW
        </div>
        <div className="flex items-center gap-2 text-xs font-caps-label text-gold-accent uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-gold-accent pulse-live" />
          <span>LOADING SCOREBOARD...</span>
        </div>
      </div>
    </div>
  );
}
