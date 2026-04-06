import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getCategoryClass(category) {
  const classes = {
    Web: 'badge-web',
    Crypto: 'badge-crypto',
    Forensics: 'badge-forensics',
    OSINT: 'badge-osint',
    Misc: 'badge-misc',
    Reverse: 'badge-reverse',
    Pwn: 'badge-pwn'
  };
  return classes[category] || 'badge-misc';
}

export function getDifficultyClass(difficulty) {
  const classes = {
    Easy: 'badge-easy',
    Medium: 'badge-medium',
    Hard: 'badge-hard'
  };
  return classes[difficulty] || 'badge-medium';
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
