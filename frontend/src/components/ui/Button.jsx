import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
  ghost: 'hover:bg-muted text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10'
};

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
