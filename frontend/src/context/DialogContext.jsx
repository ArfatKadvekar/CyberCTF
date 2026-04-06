import React, { createContext, useContext, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui';
import { AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

const DialogContext = createContext(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    promptValue: '',
    expectedValue: '', // For validation (e.g., "RESET")
    variant: 'default', // 'default' | 'destructive' | 'warning' | 'success'
  });

  const [inputValue, setInputValue] = useState('');

  const closeDialog = useCallback(() => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    setInputValue('');
  }, []);

  const showAlert = useCallback((title, message, variant = 'default') => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText: 'OK',
      variant,
      onConfirm: () => closeDialog(),
    });
  }, [closeDialog]);

  const showConfirm = useCallback(({ title, message, confirmText, cancelText, variant = 'default', onConfirm, onCancel }) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
      variant,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        closeDialog();
      },
      onCancel: () => {
        if (onCancel) onCancel();
        closeDialog();
      },
    });
  }, [closeDialog]);

  const showPrompt = useCallback(({ title, message, confirmText, variant = 'destructive', expectedValue, onConfirm }) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      confirmText: confirmText || 'Confirm',
      cancelText: 'Cancel',
      variant,
      expectedValue,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        closeDialog();
      },
      onCancel: () => closeDialog(),
    });
    setInputValue('');
  }, [closeDialog]);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className={cn(
            "w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200",
            dialog.variant === 'destructive' && "border-destructive/30 shadow-destructive/10",
            dialog.variant === 'warning' && "border-warning/30 shadow-warning/10",
            dialog.variant === 'success' && "border-success/30 shadow-success/10",
            dialog.variant === 'default' && "border-primary/30 shadow-primary/10"
          )}>
            <CardHeader className="relative pb-2 border-b border-border/30">
              <div className="flex items-center gap-3">
                {dialog.variant === 'destructive' && <X className="w-5 h-5 text-destructive" />}
                {dialog.variant === 'warning' && <AlertCircle className="w-5 h-5 text-warning" />}
                {dialog.variant === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                {dialog.variant === 'default' && <HelpCircle className="w-5 h-5 text-primary" />}
                <CardTitle>{dialog.title}</CardTitle>
              </div>
              <button 
                onClick={closeDialog}
                className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {dialog.message}
              </p>

              {dialog.type === 'prompt' && (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Type <span className="text-foreground font-bold">"{dialog.expectedValue}"</span> to confirm
                  </p>
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={dialog.expectedValue}
                    className="font-mono bg-black/50 border-destructive/20 focus:border-destructive/50"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                {dialog.type !== 'alert' && (
                  <Button variant="outline" onClick={dialog.onCancel}>
                    {dialog.cancelText}
                  </Button>
                )}
                <Button 
                  variant={dialog.variant === 'destructive' ? 'destructive' : 'default'}
                  className={cn(
                    dialog.variant === 'warning' && "bg-warning hover:bg-warning/80 text-background",
                    dialog.variant === 'success' && "bg-success hover:bg-success/80 text-background",
                  )}
                  onClick={dialog.onConfirm}
                  disabled={dialog.type === 'prompt' && inputValue !== dialog.expectedValue}
                >
                  {dialog.confirmText}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DialogContext.Provider>
  );
}
