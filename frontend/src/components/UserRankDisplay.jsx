import { Trophy } from 'lucide-react';
import { useLeaderboard } from '../context/LeaderboardContext';

export default function UserRankDisplay() {
  const { currentUser, loading } = useLeaderboard();

  if (loading || !currentUser) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Trophy className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-muted-foreground">Rank: —</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Trophy className="w-4 h-4 text-primary" />
      <span className="text-muted-foreground">Rank:</span>
      <span className="font-mono font-bold text-primary">#{currentUser.rank}</span>
      <span className="text-muted-foreground/60">|</span>
      <span className="text-muted-foreground">Score:</span>
      <span className="font-mono font-bold text-primary">{currentUser.score}</span>
    </div>
  );
}
