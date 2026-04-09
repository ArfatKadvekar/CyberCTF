import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { leaderboardApi } from '../lib/api';
import { useSession } from './SessionContext';

const LeaderboardContext = createContext(null);

const CACHE_KEY = 'ctf_leaderboard_cache_v1';
const LOCK_KEY = 'ctf_leaderboard_lock_v1';
const CHANNEL_NAME = 'ctf_leaderboard_channel_v1';
const CACHE_TTL_MS = 25000;
const POLL_INTERVAL_MS = 25000;
const MAX_RETRY_DELAY_MS = 120000;
const BASE_RETRY_DELAY_MS = 5000;

function isDebugEnabled() {
  return String(import.meta.env.VITE_DEBUG || '').toLowerCase() === 'true';
}

function debugLog(...args) {
  if (isDebugEnabled()) {
    console.log('[LeaderboardContext]', ...args);
  }
}

function emptyState() {
  return {
    leaderboard: [],
    currentUser: null,
    totalPlayers: 0,
    loading: true,
    error: null,
    cachedAt: 0
  };
}

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readCachedLeaderboard(eventId) {
  const cached = readRaw(CACHE_KEY);
  if (!cached || cached.eventId !== eventId) return null;
  if (!cached.cachedAt || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
  return cached;
}

function writeCachedLeaderboard(payload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors and keep the in-memory state.
  }
}

function readLock(eventId) {
  const lock = readRaw(LOCK_KEY);
  if (!lock || lock.eventId !== eventId) return null;
  if (!lock.expiresAt || lock.expiresAt <= Date.now()) return null;
  return lock;
}

function writeLock(eventId, ownerId, ttlMs = 5000) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify({
      eventId,
      ownerId,
      expiresAt: Date.now() + ttlMs
    }));
  } catch {
    // Ignore storage errors.
  }
}

function clearLock(ownerId) {
  const lock = readRaw(LOCK_KEY);
  if (!lock || lock.ownerId !== ownerId) return;

  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function normalizeResponse(eventId, responseData) {
  return {
    eventId,
    leaderboard: responseData?.leaderboard || [],
    currentUser: responseData?.currentUser || null,
    totalPlayers: responseData?.totalPlayers || 0,
    cachedAt: responseData?.cachedAt || Date.now()
  };
}

export function LeaderboardProvider({ children }) {
  const { event, isPlayer } = useSession();
  const eventId = event?._id?.toString?.() || event?._id || event?.id?.toString?.() || event?.id || null;
  const [state, setState] = useState(emptyState());
  const inFlightRef = useRef(null);
  const isFetchingRef = useRef(false);
  const failureCountRef = useRef(0);
  const nextRetryAtRef = useRef(0);
  const tabIdRef = useRef(`leaderboard-${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const channelRef = useRef(null);
  const mountedRef = useRef(true);

  const applyPayload = useCallback((payload) => {
    if (!payload || payload.eventId !== eventId) return;

    setState({
      leaderboard: payload.leaderboard || [],
      currentUser: payload.currentUser || null,
      totalPlayers: payload.totalPlayers || 0,
      loading: false,
      error: null,
      cachedAt: payload.cachedAt || Date.now()
    });
  }, [eventId]);

  const fetchLeaderboard = useCallback(async ({ force = false } = {}) => {
    if (!isPlayer || !eventId) {
      debugLog('Skipping fetch: missing player or event context', { isPlayer, eventId });
      return null;
    }

    const now = Date.now();
    if (!force && nextRetryAtRef.current > now) {
      debugLog('Skipping fetch due to backoff window', {
        eventId,
        retryInMs: nextRetryAtRef.current - now,
        failures: failureCountRef.current
      });
      return null;
    }

    const cached = readCachedLeaderboard(eventId);
    if (cached && !force) {
      debugLog('Using cached leaderboard payload', { eventId, cachedAt: cached.cachedAt });
      applyPayload(cached);
      return cached;
    }

    if (isFetchingRef.current || inFlightRef.current) {
      debugLog('Fetch skipped: request already in flight', { eventId });
      return inFlightRef.current;
    }

    const lock = readLock(eventId);
    if (!force && lock && lock.ownerId !== tabIdRef.current) {
      if (cached) {
        applyPayload(cached);
        return cached;
      }

      return null;
    }

    writeLock(eventId, tabIdRef.current);
    isFetchingRef.current = true;
    debugLog('Fetching leaderboard...', { eventId, force });

    const request = leaderboardApi.get()
      .then((response) => {
        const payload = normalizeResponse(eventId, response.data);
        failureCountRef.current = 0;
        nextRetryAtRef.current = 0;
        debugLog('Leaderboard response received', {
          eventId,
          rows: payload.leaderboard.length,
          totalPlayers: payload.totalPlayers,
          cachedAt: payload.cachedAt
        });
        applyPayload(payload);
        writeCachedLeaderboard(payload);

        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'leaderboard-updated', payload });
        }

        return payload;
      })
      .catch((error) => {
        if (error?.response?.status === 403 && error?.response?.data?.banned) {
          debugLog('Banned response received, stopping leaderboard updates', { eventId });
          failureCountRef.current = 0;
          nextRetryAtRef.current = Number.MAX_SAFE_INTEGER;

          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              loading: false,
              error
            }));
          }

          return null;
        }

        failureCountRef.current += 1;
        const retryDelay = Math.min(
          MAX_RETRY_DELAY_MS,
          BASE_RETRY_DELAY_MS * (2 ** (failureCountRef.current - 1))
        );
        nextRetryAtRef.current = Date.now() + retryDelay;

        debugLog('Leaderboard fetch failed', {
          eventId,
          failures: failureCountRef.current,
          retryDelay,
          message: error?.message
        });

        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error
          }));
        }
        throw error;
      })
      .finally(() => {
        isFetchingRef.current = false;
        inFlightRef.current = null;
        clearLock(tabIdRef.current);
      });

    inFlightRef.current = request;
    return request;
  }, [applyPayload, eventId, isPlayer]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isPlayer) {
      setState({ ...emptyState(), loading: false });
      return;
    }

    if (!eventId) {
      setState((prev) => ({
        ...emptyState(),
        loading: false,
        error: prev.error || new Error('Missing event id for leaderboard')
      }));
      return;
    }

    const cached = readCachedLeaderboard(eventId);
    if (cached) {
      applyPayload(cached);
    } else {
      setState((prev) => ({ ...prev, loading: true }));
    }

    fetchLeaderboard({ force: !cached }).catch(() => {});
  }, [applyPayload, eventId, fetchLeaderboard, isPlayer]);

  useEffect(() => {
    if (!eventId || !isPlayer) {
      return undefined;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const cached = readCachedLeaderboard(eventId);
      const stale = !cached || Date.now() - cached.cachedAt >= POLL_INTERVAL_MS;
      if (stale) {
        fetchLeaderboard().catch(() => {});
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;

      const cached = readCachedLeaderboard(eventId);
      const stale = !cached || Date.now() - cached.cachedAt >= POLL_INTERVAL_MS;
      if (stale) {
        fetchLeaderboard().catch(() => {});
      }
    }, POLL_INTERVAL_MS);

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [eventId, fetchLeaderboard, isPlayer]);

  useEffect(() => {
    if (!eventId || !isPlayer || typeof BroadcastChannel === 'undefined') {
      return undefined;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (eventMessage) => {
      if (eventMessage?.data?.type === 'leaderboard-updated') {
        applyPayload(eventMessage.data.payload);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [applyPayload, eventId, isPlayer]);

  useEffect(() => {
    const onStorage = (storageEvent) => {
      if (storageEvent.key !== CACHE_KEY || !storageEvent.newValue) return;

      try {
        const payload = JSON.parse(storageEvent.newValue);
        applyPayload(payload);
      } catch {
        // Ignore invalid payloads.
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyPayload]);

  const value = {
    leaderboard: state.leaderboard,
    currentUser: state.currentUser,
    totalPlayers: state.totalPlayers,
    loading: state.loading,
    error: state.error,
    cachedAt: state.cachedAt,
    refreshLeaderboard: fetchLeaderboard
  };

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }

  return context;
}
