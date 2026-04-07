import { Trophy, User, Award } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TopPlayersCards({ leaderboard = [] }) {
  const topThree = leaderboard.slice(0, 3);

  const getMedalStyle = (rank) => {
    if (rank === 1) {
      return {
        bg: 'bg-gradient-to-br from-amber-500/15 to-amber-600/5',
        border: 'border-amber-500/40 hover:border-amber-500/60',
        icon: 'text-amber-500',
        accent: 'bg-amber-500/10 border-amber-500/30',
        medal: '🥇'
      };
    }
    if (rank === 2) {
      return {
        bg: 'bg-gradient-to-br from-slate-500/10 to-slate-600/5',
        border: 'border-slate-400/40 hover:border-slate-400/60',
        icon: 'text-slate-300',
        accent: 'bg-slate-500/10 border-slate-400/30',
        medal: '🥈'
      };
    }
    return {
      bg: 'bg-gradient-to-br from-orange-500/15 to-orange-600/5',
      border: 'border-orange-500/40 hover:border-orange-500/60',
      icon: 'text-orange-400',
      accent: 'bg-orange-500/10 border-orange-500/30',
      medal: '🥉'
    };
  };

  if (topThree.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {[1, 2, 3].map((rank) => (
          <div
            key={rank}
            className="rounded-lg border border-border/20 p-6 bg-card/30 flex items-center justify-center min-h-[220px]"
          >
            <div className="text-center">
              <Trophy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Rank #{rank} - Awaiting...</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {topThree.map((player, index) => {
        const rank = index + 1;
        const style = getMedalStyle(rank);

        return (
          <div
            key={player.username}
            className={cn(
              'rounded-lg border-2 p-5 transition-all duration-200 hover:shadow-md backdrop-blur-sm',
              style.bg,
              style.border
            )}
          >
            {/* Medal */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/20">
              <span className="text-4xl">{style.medal}</span>
              <span className={cn('px-2.5 py-1 rounded-md text-xs font-bold text-foreground', style.accent)}>
                Rank #{rank}
              </span>
            </div>

            {/* Player Name */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <User className={cn('w-4 h-4 flex-shrink-0', style.icon)} />
                <p className={cn('font-bold text-lg truncate', style.icon)}>
                  {player.username}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              {/* Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="font-mono font-bold text-lg text-primary">
                  {player.score}
                </span>
              </div>

              {/* Solves */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Solved</span>
                <span className="font-mono font-bold text-lg text-foreground">
                  {player.solveCount || 0}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
