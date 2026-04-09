import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { MonitorPlay, X, Trophy, Users, BarChart3 } from 'lucide-react';
import LeaderboardProgressionChart from '../../components/charts/LeaderboardProgressionChart';
import TopPlayersCards from '../../components/TopPlayersCards';
import LeaderboardTable from '../../components/LeaderboardTable';
import EventStatsPanel from '../../components/EventStatsPanel';

export default function StreamerModePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlEventId = searchParams.get('eventId');
  const [eventId, setEventId] = useState(urlEventId);
  const [eventData, setEventData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize event from URL or first active event
  useEffect(() => {
    const initializeEvent = async () => {
      if (eventId) return;
      try {
        const res = await adminApi.getEvents();
        const activeEvents = res.data.events.filter(e => e.isActive);
        if (activeEvents.length > 0) {
          setEventId(activeEvents[0]._id);
        } else if (res.data.events.length > 0) {
          setEventId(res.data.events[0]._id);
        }
      } catch (err) {
        console.error('Failed to init event', err);
      }
    };
    initializeEvent();
  }, [eventId]);

  // Fetch leaderboard data and auto-refresh
  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        const res = await adminApi.getLeaderboard(eventId);
        setEventData(res.data.event);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 8 seconds
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (!eventId || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <h1 className="text-lg font-semibold text-foreground">Loading Broadcast</h1>
          <p className="text-sm text-muted-foreground">Connecting to event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/20 bg-gradient-to-r from-background/80 via-background to-background/80 backdrop-blur-md sticky top-0 z-40 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Event Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/15 rounded-lg flex-shrink-0 border border-primary/20">
              <MonitorPlay className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{eventData?.name || 'CTF Event'}</h1>
              <p className="text-xs text-muted-foreground">Live Broadcast Dashboard</p>
            </div>
          </div>

          {/* Right Section - PIN & Controls */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-right px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Event PIN</p>
              <p className="text-2xl font-mono font-bold text-primary mt-1">{eventData?.gamePin || '------'}</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="p-2.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded-lg flex-shrink-0 border border-border/20 hover:border-destructive/20"
              title="Close broadcaster"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-full">
          {/* Section 1: Leaderboard Progression Chart (FULL WIDTH) */}
          <div className="rounded-lg bg-gradient-to-br from-card/50 via-card/40 to-background/30 border border-border/20 p-6 shadow-md hover:shadow-lg transition-shadow hover:border-border/30">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Score Progression
            </h2>
            <LeaderboardProgressionChart eventId={eventId} />
          </div>

          {/* Section 2: Top 3 Player Highlight Cards */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-primary" />
              Podium
            </h2>
            <TopPlayersCards leaderboard={leaderboard} />
          </div>

          {/* Section 3: Full Leaderboard + Stats Panel (RESPONSIVE GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Leaderboard Table - Takes 3 columns on large screens */}
            <div className="lg:col-span-3">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Full Leaderboard
              </h2>
              <LeaderboardTable leaderboard={leaderboard} />
            </div>

            {/* Side Panel - Statistics */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Statistics
              </h2>
              <EventStatsPanel leaderboard={leaderboard} eventData={eventData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
