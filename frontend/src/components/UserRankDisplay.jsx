import { useEffect, useState } from 'react';
import { userApi } from '../lib/api';
import { Trophy } from 'lucide-react';

export default function UserRankDisplay() {
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRank = async () => {
    try {
      setLoading(true);
      const response = await userApi.getRank();
      setRank(response.data);
    } catch (error) {
      console.error('Error fetching rank:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchRank();

    // Set up periodic updates (every 5 seconds)
    const interval = setInterval(fetchRank, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !rank) {
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
      <span className="font-mono font-bold text-primary">#{rank.rank}</span>
      <span className="text-muted-foreground/60">|</span>
      <span className="text-muted-foreground">Score:</span>
      <span className="font-mono font-bold text-primary">{rank.score}</span>
    </div>
  );
}
