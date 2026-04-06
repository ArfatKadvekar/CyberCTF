import { cn } from '../../lib/utils';

export default function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2',
        'text-sm text-foreground placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all',
        className
      )}
      {...props}
    />
  );
}
