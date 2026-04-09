import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../components/ui';
import { Users, Search, Trash2, Trophy, Flag, Ban, CheckCircle, RotateCcw } from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import { useDialog } from '../../context/DialogContext';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [search, setSearch] = useState('');
  const { showAlert, showConfirm, showPrompt } = useDialog();

  const fetchData = async () => {
    try {
      const [usersRes, eventsRes] = await Promise.all([
        adminApi.getUsers(selectedEvent || undefined, 'player'),
        adminApi.getEvents()
      ]);
      setUsers(usersRes.data.users);
      setEvents(eventsRes.data.events);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEvent]);

  const handleDelete = async (id, username) => {
    showConfirm({
      title: 'Delete Player',
      message: `Are you sure you want to permanently delete player "${username}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await adminApi.deleteUser(id);
          fetchData();
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Error deleting user', 'destructive');
        }
      }
    });
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const isCurrentlyBanned = currentStatus === true;

    if (isCurrentlyBanned) {
      showConfirm({
        title: 'Unban Player',
        message: 'Are you sure you want to UNBAN this player?',
        confirmText: 'Unban Player',
        variant: 'success',
        onConfirm: async () => {
          try {
            await adminApi.unbanUser(id);
            fetchData();
          } catch (error) {
            showAlert('Error', error.response?.data?.message || 'Error unbanning user', 'destructive');
          }
        }
      });
      return;
    }

    const reason = window.prompt('Ban reason', 'Violation of rules');
    if (reason === null) {
      return;
    }

    showConfirm({
      title: 'Ban Player',
      message: 'Are you sure you want to BAN this player?',
      confirmText: 'Ban Player',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await adminApi.banUser(id, reason.trim() || 'Violation of rules');
          fetchData();
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Error banning user', 'destructive');
        }
      }
    });
  };

  const handleReset = async (id, username) => {
    showPrompt({
      title: 'Reset Player Progress',
      message: `DANGER: This will wipe all points and challenge progress for ${username}. This action is irreversible.`,
      confirmText: 'Reset Progress',
      expectedValue: 'RESET',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await adminApi.resetUser(id);
          fetchData();
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Error resetting player', 'destructive');
        }
      }
    });
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-3xl font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-cyan-400" />
          Players
        </h1>
        <p className="text-muted-foreground">{users.length} players</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Event Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">Event:</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-input text-foreground"
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>{event.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No players found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Username</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Score</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Solves</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const banned = user.isBanned || user.status === 'banned';

                    return (
                    <tr key={user._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <span className={cn("font-mono font-medium", banned ? 'text-muted-foreground line-through' : 'text-foreground')}>
                          {user.username}
                        </span>
                      </td>
                      <td className="p-4">
                        {banned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-destructive/20 text-destructive border border-destructive/30 font-medium uppercase tracking-wider">Banned</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-success/20 text-success border border-success/30 font-medium uppercase tracking-wider">Active</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {user.eventId?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="flex items-center justify-end gap-1 font-mono text-primary font-bold">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          {user.score}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Flag className="w-4 h-4 text-blue-400" />
                          {user.solveCount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate(user._id, banned)}
                            title={banned ? 'Unban Player' : 'Ban Player'}
                            className={banned ? "text-success hover:text-success hover:bg-success/10" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                          >
                            {banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReset(user._id, user.username)}
                            title="Reset Progress"
                            className="text-warning hover:text-warning hover:bg-warning/10"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user._id, user.username)}
                            title="Delete Player"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
