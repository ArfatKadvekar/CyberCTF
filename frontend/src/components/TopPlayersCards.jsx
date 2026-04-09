import { Crown, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TopPlayersCards({ leaderboard = [] }) {
  const topThree = leaderboard.slice(0, 3);

  const getPodiumStyle = (rank) => {
    if (rank === 1) {
      return {
        card: 'bg-gradient-to-br from-amber-500/18 via-amber-500/8 to-background border-amber-400/60 shadow-[0_12px_40px_rgba(245,158,11,0.25)]',
        ribbon: 'bg-amber-400 text-black',
        icon: 'text-amber-300',
        score: 'text-amber-200',
        offset: '-translate-y-4 md:-translate-y-6 md:scale-[1.03]'
      };
    }
    if (rank === 2) {
      return {
        card: 'bg-gradient-to-br from-slate-400/14 via-slate-400/6 to-background border-slate-300/45',
        ribbon: 'bg-slate-300 text-black',
        icon: 'text-slate-200',
        score: 'text-slate-100',
        offset: 'translate-y-0'
      };
    }
    return {
      card: 'bg-gradient-to-br from-orange-500/14 via-orange-500/6 to-background border-orange-400/40',
      ribbon: 'bg-orange-400 text-black',
      icon: 'text-orange-300',
      score: 'text-orange-200',
      offset: 'translate-y-0'
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
              <Crown className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Rank #{rank} - Awaiting...</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const podium = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:items-end">
      {podium.map((player) => {
        const rank = player.rank;
        const style = getPodiumStyle(rank);
        const initials = (player.username || 'P').slice(0, 2).toUpperCase();

        return (
          <div
            key={player.username}
            className={cn(
              'relative rounded-lg border p-5 md:p-6 transition-all duration-300 backdrop-blur-sm hover:scale-[1.01]',
              style.card,
              style.offset
            )}
          >
            <div className={cn('absolute left-4 -top-3 px-3 py-1 rounded-sm text-xs font-extrabold', style.ribbon)}>
              #{rank}
            </div>

            <div className="mt-2 mb-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border border-border/40 bg-background/50 flex items-center justify-center font-mono text-sm font-bold text-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {rank === 1 ? <Crown className={cn('w-4 h-4', style.icon)} /> : <User className={cn('w-4 h-4', style.icon)} />}
                  <p className={cn('font-bold text-xl truncate', style.icon)}>{player.username}</p>
                </div>
                <p className="text-xs text-muted-foreground">Live rank #{rank}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
                <p className={cn('font-mono text-2xl font-bold mt-1', style.score)}>{player.score}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Flags</p>
                <p className="font-mono text-2xl font-bold mt-1 text-foreground">{player.solveCount || 0}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
