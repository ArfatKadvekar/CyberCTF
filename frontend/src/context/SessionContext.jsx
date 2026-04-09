import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';
import { clearBanBlock } from '../lib/api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('ctf_token');
      
      if (token) {
        try {
          const response = await authApi.getMe();
          clearBanBlock();
          window.dispatchEvent(new CustomEvent('ctf:user-unbanned'));
          setUser(response.data.user);
          setEvent(response.data.event);
        } catch (error) {
          console.error('Session init error:', error);
          localStorage.removeItem('ctf_token');
          localStorage.removeItem('ctf_user');
        }
      }
      
      setLoading(false);
    };

    initSession();

    const onUserBanned = () => {
      setUser(null);
      setEvent(null);
      setLoading(false);
    };

    window.addEventListener('ctf:user-banned', onUserBanned);
    return () => window.removeEventListener('ctf:user-banned', onUserBanned);
  }, []);

  const login = (userData, eventData, token) => {
    localStorage.setItem('ctf_token', token);
    localStorage.setItem('ctf_user', JSON.stringify(userData));
    clearBanBlock();
    window.dispatchEvent(new CustomEvent('ctf:user-unbanned'));
    setUser(userData);
    setEvent(eventData);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('ctf_token');
    localStorage.removeItem('ctf_user');
    setUser(null);
    setEvent(null);
  };

  const updateScore = (newScore) => {
    setUser((prev) => prev ? { ...prev, score: newScore } : null);
  };

  const isAdmin = user?.role === 'admin';
  const isPlayer = user?.role === 'player';

  return (
    <SessionContext.Provider
      value={{
        user,
        event,
        loading,
        login,
        logout,
        updateScore,
        isAdmin,
        isPlayer,
        isAuthenticated: !!user
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
