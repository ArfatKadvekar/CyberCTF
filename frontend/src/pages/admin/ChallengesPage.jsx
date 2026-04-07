import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, CategoryBadge, DifficultyBadge } from '../../components/ui';
import { Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDialog } from '../../context/DialogContext';

const difficulties = ['Easy', 'Medium', 'Hard'];

const defaultChallenge = {
  title: '',
  description: '',
  category: '',
  difficulty: 'Easy',
  points: 100,
  flag: '',
  flagFormat: 'FLAG{...}',
  eventId: '',
  hints: [],
  attachments: []
};

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [formData, setFormData] = useState(defaultChallenge);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [copyEventId, setCopyEventId] = useState('');
  const [copying, setCopying] = useState(false);
  const { showAlert, showConfirm } = useDialog();

  // First load: Get events and auto-select first one
  useEffect(() => {
    const initializeEvents = async () => {
      try {
        const eventsRes = await adminApi.getEvents();
        setEvents(eventsRes.data.events);
        
        // Auto-select first event if none selected
        if (eventsRes.data.events.length > 0 && !selectedEvent) {
          setSelectedEvent(eventsRes.data.events[0]._id);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    initializeEvents();
  }, []); // Only run on mount

  // Fetch challenges and categories when event is selected
  const refetchChallengesAndCategories = async (eventId) => {
    try {
      setLoading(true);
      const [challengesRes, categoriesRes] = await Promise.all([
        adminApi.getChallenges(eventId),
        adminApi.getCategories(eventId)
      ]);
      setChallenges(challengesRes.data.challenges);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEvent) return;
    refetchChallengesAndCategories(selectedEvent);
  }, [selectedEvent]);

  const openEditModal = (challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      flag: challenge.flag,
      flagFormat: challenge.flagFormat || 'FLAG{...}',
      eventId: challenge.eventId?._id || challenge.eventId,
      hints: challenge.hints || [],
      attachments: challenge.attachments || []
    });
    setModalError('');
    setCopyEventId('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    try {
      if (editingChallenge) {
        await adminApi.updateChallenge(editingChallenge._id, formData);
      } else {
        await adminApi.createChallenge(formData);
      }
      setShowModal(false);
      refetchChallengesAndCategories(selectedEvent);
    } catch (error) {
      console.error('Save challenge error:', error.response?.data || error.message);
      setModalError(error.response?.data?.message || 'Error saving challenge. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToEvent = async () => {
    if (!copyEventId) return;
    setCopying(true);
    setModalError('');
    try {
      await adminApi.createChallenge({ ...formData, eventId: copyEventId });
      setShowModal(false);
      refetchChallengesAndCategories(selectedEvent);
    } catch (error) {
      console.error('Copy error:', error.response?.data || error.message);
      setModalError(error.response?.data?.message || 'Error copying challenge.');
    } finally {
      setCopying(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm({
      title: 'Delete Challenge',
      message: 'Are you sure you want to permanently delete this challenge?',
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await adminApi.deleteChallenge(id);
          refetchChallengesAndCategories(selectedEvent);
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Error deleting challenge', 'destructive');
        }
      }
    });
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, { content: '', cost: 0 }]
    });
  };

  const updateHint = (index, field, value) => {
    const newHints = [...formData.hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setFormData({ ...formData, hints: newHints });
  };

  const removeHint = (index) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter((_, i) => i !== index)
    });
  };

  const addAttachment = () => {
    setFormData({
      ...formData,
      attachments: [...formData.attachments, { type: 'url', name: '', url: '' }]
    });
  };

  const updateAttachment = (index, field, value) => {
    const newAttachments = [...formData.attachments];
    newAttachments[index] = { ...newAttachments[index], [field]: value };
    setFormData({ ...formData, attachments: newAttachments });
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold text-foreground">Challenges</h1>
          <p className="text-muted-foreground">{challenges.length} challenges</p>
        </div>
        <Link to="/admin/challenges/new">
          <Button disabled={events.length === 0} className="shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Plus className="w-4 h-4 mr-2" />
            Add Challenge
          </Button>
        </Link>
      </div>

      {/* Event Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Filter by Event:</label>
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

      {/* Challenges List */}
      <Card>
        <CardContent className="p-0">
          {challenges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No challenges yet. Create your first challenge!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Difficulty</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Points</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Solves</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((challenge) => (
                    <tr key={challenge._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <span className="font-mono font-medium text-foreground">{challenge.title}</span>
                      </td>
                      <td className="p-4">
                        <CategoryBadge category={challenge.category} />
                      </td>
                      <td className="p-4">
                        <DifficultyBadge difficulty={challenge.difficulty} />
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-primary font-bold">{challenge.points}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Users className="w-4 h-4 text-cyan-400" />
                          {challenge.solveCount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {challenge.eventId?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(challenge)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(challenge._id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8">
          <Card className="w-full max-w-2xl mx-4 my-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingChallenge ? 'Edit Challenge' : 'Create Challenge'}</CardTitle>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Event Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Event</label>
                  <select
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-border bg-input text-foreground"
                    required
                  >
                    <option value="">Select Event</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>{event.name}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Challenge title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Challenge description..."
                    className="flex min-h-[100px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                {/* Category & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-input text-foreground"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-amber-500">⚠ No categories found. Create one from the Categories page.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-input text-foreground"
                    >
                      {difficulties.map((diff) => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Points & Flag */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">Points</label>
                    <Input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">Flag Format</label>
                    <Input
                      value={formData.flagFormat}
                      onChange={(e) => setFormData({ ...formData, flagFormat: e.target.value })}
                      placeholder="FLAG{...}"
                    />
                  </div>
                </div>

                {/* Flag */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Flag (exact match)</label>
                  <Input
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    placeholder="FLAG{example_flag}"
                    className="font-mono"
                    required
                  />
                </div>

                {/* Hints */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Hints</label>
                    <Button type="button" variant="outline" size="sm" onClick={addHint}>
                      <Plus className="w-3 h-3" /> Add Hint
                    </Button>
                  </div>
                  {formData.hints.map((hint, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        value={hint.content}
                        onChange={(e) => updateHint(index, 'content', e.target.value)}
                        placeholder="Hint content"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={hint.cost}
                        onChange={(e) => updateHint(index, 'cost', parseInt(e.target.value) || 0)}
                        placeholder="Cost"
                        className="w-24"
                        min="0"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeHint(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Attachments */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Attachments</label>
                    <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
                      <Plus className="w-3 h-3" /> Add Attachment
                    </Button>
                  </div>
                  {formData.attachments.map((att, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        value={att.name}
                        onChange={(e) => updateAttachment(index, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-32"
                      />
                      <Input
                        value={att.url}
                        onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                        placeholder="URL"
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Error display */}
                {modalError && (
                  <p className="text-sm text-destructive text-center px-2 py-2 bg-destructive/10 rounded-lg border border-destructive/30">{modalError}</p>
                )}

                {/* Copy to Another Event (only when editing) */}
                {editingChallenge && (
                  <div className="border-t border-border/50 pt-4 mt-2">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Copy this challenge to another event</p>
                    <div className="flex gap-2">
                      <select
                        value={copyEventId}
                        onChange={(e) => setCopyEventId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                      >
                        <option value="">Select target event...</option>
                        {events.filter(ev => ev._id !== (formData.eventId?._id || formData.eventId)).map((event) => (
                          <option key={event._id} value={event._id}>{event.name}</option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        loading={copying}
                        disabled={!copyEventId}
                        onClick={handleCopyToEvent}
                        className="whitespace-nowrap"
                      >
                        Copy to Event
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    {editingChallenge ? 'Save Changes' : 'Create Challenge'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
