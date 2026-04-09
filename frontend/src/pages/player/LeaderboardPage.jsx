import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../../components/ui';
import { Trophy, Search, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import LeaderboardHistoryChart from '../../components/charts/LeaderboardHistoryChart';
import { useLeaderboard } from '../../context/LeaderboardContext';

export default function LeaderboardPage() {
  const { leaderboard, currentUser, totalPlayers, loading } = useLeaderboard();
  const [search, setSearch] = useState('');

  const filteredLeaderboard = leaderboard.filter((player) =>
    player.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="w-8 h-8 text-warning" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          {totalPlayers} players
        </p>
      </div>

      {/* Score Progression Chart */}
      <LeaderboardHistoryChart />

      {/* Current User Card */}
      {currentUser && (
        <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-mono text-primary font-bold">
                #{currentUser.rank}
              </div>
              <div>
                <p className="font-mono font-semibold text-foreground">{currentUser.username}</p>
                <p className="text-sm text-muted-foreground">Your Rank: #{currentUser.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-bold text-primary">{currentUser.score}</p>
              <p className="text-sm text-muted-foreground">{currentUser.solveCount} solves</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-16">Rank</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Player</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Solves</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No players found
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((player) => (
                    <tr
                      key={player.id}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        player.isCurrentUser && 'bg-primary/5',
                        player.rank <= 3 && 'bg-card'
                      )}
                    >
                      <td className="p-4">
                        <span className="font-mono text-muted-foreground">#{player.rank}</span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          'font-mono',
                          player.isCurrentUser && 'text-primary font-semibold'
                        )}>
                          {player.username}
                          {player.isCurrentUser && ' (You)'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-muted-foreground">{player.solveCount}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={cn(
                          'font-mono font-bold',
                          player.rank === 1 && 'text-yellow-500',
                          player.rank === 2 && 'text-gray-400',
                          player.rank === 3 && 'text-amber-600',
                          player.rank > 3 && 'text-foreground'
                        )}>
                          {player.score}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
