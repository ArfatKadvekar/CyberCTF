/**
 * Development-only logging utility
 * Automatically disables logs in production
 */

export const devLog = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  }
};

export const devWarn = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, data);
  }
};

export const devError = (message, error = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  }
};

export default { devLog, devWarn, devError };
