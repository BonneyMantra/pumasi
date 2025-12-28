'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { useVeryChatAuth } from '@/lib/hooks/use-verychat-auth';
import { cn } from '@/lib/utils';

interface VeryChatVerificationProps {
  currentHandle?: string;
  isVerified?: boolean;
  onVerified: (handleId: string) => void;
  disabled?: boolean;
}

export function VeryChatVerification({
  currentHandle,
  isVerified,
  onVerified,
  disabled,
}: VeryChatVerificationProps) {
  const { t } = useTranslation();
  const [handleId, setHandleId] = useState(currentHandle || '');
  const [verificationCode, setVerificationCode] = useState('');

  const {
    step,
    isLoading,
    error,
    requestCode,
    verifyCode,
    clearError,
    isConfigured,
  } = useVeryChatAuth();

  if (!isConfigured) {
    return (
      <div className="p-4 rounded-lg border border-border bg-muted/50">
        <p className="text-sm text-muted-foreground">
          {t('verychat.notConfigured')}
        </p>
      </div>
    );
  }

  const handleRequestCode = async () => {
    if (!handleId.trim()) return;
    clearError();
    await requestCode(handleId.trim());
  };

  const handleVerifyCode = async () => {
    const code = parseInt(verificationCode, 10);
    if (isNaN(code) || verificationCode.length !== 6) return;

    const success = await verifyCode(handleId, code);
    if (success) {
      onVerified(handleId.trim().replace(/^@/, ''));
    }
  };

  // Already verified state
  if (isVerified && currentHandle) {
    return (
      <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-500">
              {t('verychat.verified')}
            </p>
            <p className="text-sm text-muted-foreground">
              @{currentHandle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVerified('')}
            disabled={disabled}
          >
            {t('verychat.disconnect')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-sky" />
        <Label className="text-sm font-medium">{t('verychat.title')}</Label>
      </div>

      {step === 'idle' || step === 'requesting' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={t('verychat.handlePlaceholder')}
              value={handleId}
              onChange={(e) => setHandleId(e.target.value)}
              disabled={disabled || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleRequestCode}
              disabled={disabled || isLoading || !handleId.trim()}
              className="bg-sky hover:bg-sky/90"
            >
              {isLoading && step === 'requesting' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('verychat.handleHint')}
          </p>
        </div>
      ) : step === 'verifying' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('verychat.codeSent', { handle: handleId })}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={t('verychat.codePlaceholder')}
              value={verificationCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(val);
              }}
              disabled={disabled || isLoading}
              className="flex-1"
              maxLength={6}
            />
            <Button
              onClick={handleVerifyCode}
              disabled={disabled || isLoading || verificationCode.length !== 6}
              className="bg-sky hover:bg-sky/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearError();
              setVerificationCode('');
            }}
            disabled={isLoading}
          >
            {t('verychat.resend')}
          </Button>
        </div>
      ) : null}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
