/**
 * Development-only logging utility for frontend (Vite)
 * Automatically disables logs in production
 * 
 * Usage:
 *   import { devLog, devError } from '@/utils/devLogger'
 *   devLog('Debug message', { data: 'value' })
 */

const isDev = import.meta.env.DEV;

export const devLog = (message, data = null) => {
  if (isDev) {
    console.log(`[DEV] ${message}`, data || '');
  }
};

export const devWarn = (message, data = null) => {
  if (isDev) {
    console.warn(`[DEV WARN] ${message}`, data || '');
  }
};

export const devError = (message, error = null) => {
  if (isDev) {
    console.error(`[DEV ERROR] ${message}`, error || '');
  }
};

export default { devLog, devWarn, devError };
