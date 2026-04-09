import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearBanBlock } from '../lib/api';

const BanContext = createContext(null);

export function BanProvider({ children }) {
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    const onBanned = (event) => {
      setIsBanned(true);
      setBanReason(event?.detail?.reason || 'Violation of rules');
    };

    const onUnbanned = () => {
      setIsBanned(false);
      setBanReason('');
      clearBanBlock();
    };

    window.addEventListener('ctf:user-banned', onBanned);
    window.addEventListener('ctf:user-unbanned', onUnbanned);

    return () => {
      window.removeEventListener('ctf:user-banned', onBanned);
      window.removeEventListener('ctf:user-unbanned', onUnbanned);
    };
  }, []);

  const clearBanState = useCallback(() => {
    setIsBanned(false);
    setBanReason('');
    clearBanBlock();
  }, []);

  return (
    <BanContext.Provider value={{ isBanned, banReason, setIsBanned, setBanReason, clearBanState }}>
      {children}
    </BanContext.Provider>
  );
}

export function useBan() {
  const context = useContext(BanContext);
  if (!context) {
    throw new Error('useBan must be used within BanProvider');
  }
  return context;
}
