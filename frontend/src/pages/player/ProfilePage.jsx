import { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { challengesApi } from '../../lib/api';
import { useLeaderboard } from '../../context/LeaderboardContext';
import { Card, CardHeader, CardTitle, CardContent, CategoryBadge, DifficultyBadge } from '../../components/ui';
import { User, Trophy, Flag, Target, Clock, CheckCircle } from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';

export default function ProfilePage() {
  const { user, event } = useSession();
  const { currentUser, loading: leaderboardLoading } = useLeaderboard();
  const [stats, setStats] = useState({ solveCount: 0, totalChallenges: 0 });
  const [solvedChallenges, setSolvedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengesRes = await challengesApi.getAll();

        const challenges = challengesRes.data.challenges;
        const solved = challenges.filter(c => c.solved);

        setStats({
          solveCount: solved.length,
          totalChallenges: challenges.length
        });

        setSolvedChallenges(solved);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate category breakdown
  const categoryBreakdown = solvedChallenges.reduce((acc, challenge) => {
    acc[challenge.category] = (acc[challenge.category] || 0) + 1;
    return acc;
  }, {});

  if (loading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-mono text-2xl font-bold text-foreground">{user?.username}</h1>
              <p className="text-muted-foreground">{event?.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                Joined {formatDate(user?.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl font-bold text-primary">{user?.score || 0}</p>
              <p className="text-sm text-muted-foreground">points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rank</p>
              <p className="text-2xl font-mono font-bold text-foreground">#{currentUser?.rank ?? '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Flag className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solved</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {stats.solveCount} <span className="text-sm text-muted-foreground">/ {stats.totalChallenges}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {stats.totalChallenges > 0 ? Math.round((stats.solveCount / stats.totalChallenges) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryBreakdown).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                >
                  <CategoryBadge category={category} />
                  <span className="font-mono font-bold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solved Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Solved Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solvedChallenges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No challenges solved yet. Start solving!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {solvedChallenges.map((challenge) => (
                <div
                  key={challenge._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <div>
                      <p className="font-mono font-medium text-foreground">{challenge.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryBadge category={challenge.category} />
                        <DifficultyBadge difficulty={challenge.difficulty} />
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-primary font-bold">{challenge.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
