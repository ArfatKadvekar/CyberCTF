import { ShieldAlert } from 'lucide-react';

export default function BannedPage({ reason = 'Violation of rules', onDismiss }) {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border border-destructive/30 bg-card/70 p-8 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">You are banned</h1>
        <p className="text-muted-foreground mb-6">
          Your account is blocked from accessing protected resources.
        </p>

        <div className="rounded-lg border border-border/30 bg-background/60 p-4 text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reason</p>
          <p className="text-foreground">{reason}</p>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Contact admin if this is a mistake.
        </p>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-5 px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
