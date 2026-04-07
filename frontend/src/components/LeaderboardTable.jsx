import { Trophy, Award, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeaderboardTable({ leaderboard = [] }) {
  const getRowStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-500/10 to-transparent hover:from-amber-500/15 hover:to-transparent border-l-4 border-l-amber-500';
    if (rank === 2) return 'bg-gradient-to-r from-slate-400/8 to-transparent hover:from-slate-400/12 hover:to-transparent border-l-4 border-l-slate-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-500/10 to-transparent hover:from-orange-500/15 hover:to-transparent border-l-4 border-l-orange-500';
    return 'hover:bg-primary/5 border-l-4 border-l-border/10 transition-colors';
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-amber-500 font-bold';
    if (rank === 2) return 'text-slate-400 font-bold';
    if (rank === 3) return 'text-orange-500 font-bold';
    return 'text-muted-foreground';
  };

  return (
    <div className="w-full rounded-lg border border-border/20 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-border/30 transition-colors">
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/8 to-transparent border-b border-border/20 backdrop-blur-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4">
          <div className="col-span-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            #
          </div>
          <div className="col-span-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Player
          </div>
          <div className="col-span-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Solves
          </div>
          <div className="col-span-2 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Score
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border/10">
        {leaderboard.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Users className="w-8 h-8 opacity-40" />
            <p className="text-sm">No players yet. Waiting for submissions...</p>
          </div>
        ) : (
          leaderboard.map((player) => {
            const rank = player.rank;
            const medal = getMedalIcon(rank);

            return (
              <div
                key={player.username}
                className={cn(
                  'grid grid-cols-12 gap-4 px-6 py-4 transition-colors duration-150',
                  getRowStyle(rank)
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  <div className="flex items-center gap-2">
                    {medal && <span className="text-base">{medal}</span>}
                    <span className={cn('font-mono text-sm', getRankColor(rank))}>
                      {rank}
                    </span>
                  </div>
                </div>

                {/* Player Name */}
                <div className="col-span-6 flex items-center">
                  <span className="font-medium text-foreground truncate text-sm">{player.username}</span>
                </div>

                {/* Solves */}
                <div className="col-span-3 text-right">
                  <span className="text-sm font-medium text-foreground">{player.solveCount || 0}</span>
                </div>

                {/* Score */}
                <div className="col-span-2 text-right">
                  <span className="font-mono font-bold text-primary text-sm">{player.score}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
