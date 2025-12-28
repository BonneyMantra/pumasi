'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  User,
  Wallet,
} from 'lucide-react';
import { formatEther } from 'viem';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Application } from '@/lib/types/application';
import { Job } from '@/lib/types/job';
import { getShinroeTier, SHINROE_TIER_LABELS } from '@/lib/types/profile';
import { useTranslation } from '@/lib/i18n';

interface HireModalProps {
  application: Application;
  job: Job;
  shinroeScore?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => Promise<void>;
}

type HireStep = 'confirm' | 'processing' | 'success';

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700/20 text-amber-500',
  silver: 'bg-slate-400/20 text-slate-300',
  gold: 'bg-yellow-500/20 text-yellow-400',
  platinum: 'bg-violet/20 text-violet-light',
};

export function HireModal({
  application,
  job,
  shinroeScore,
  open,
  onOpenChange,
  onConfirm,
}: HireModalProps) {
  const [step, setStep] = useState<HireStep>('confirm');
  const [error, setError] = useState<string | null>(null);

  const tier = shinroeScore !== undefined ? getShinroeTier(shinroeScore) : null;

  const { t } = useTranslation();

  const handleConfirm = async () => {
    setStep('processing');
    setError(null);

    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        // Default: simulate transaction
        console.log('Hiring freelancer:', application.freelancer, 'for job:', job.id);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      setStep('success');
    } catch (err) {
      console.error('Failed to hire:', err);
      setError(err instanceof Error ? err.message : t('hireModal.error'));
      setStep('confirm');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep('confirm');
      setError(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        {step === 'confirm' && (
          <ConfirmStep
            application={application}
            job={job}
            tier={tier}
            shinroeScore={shinroeScore}
            error={error}
            onCancel={handleClose}
            onConfirm={handleConfirm}
          />
        )}

        {step === 'processing' && <ProcessingStep />}

        {step === 'success' && (
          <SuccessStep application={application} job={job} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmStepProps {
  application: Application;
  job: Job;
  tier: string | null;
  shinroeScore?: number;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmStep({
  application,
  job,
  tier,
  shinroeScore,
  error,
  onCancel,
  onConfirm,
}: ConfirmStepProps) {
  const { t } = useTranslation();
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('hireModal.title')}</DialogTitle>
        <DialogDescription>{t('hireModal.description')}</DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {/* Freelancer Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-mono text-sm">
              {application.freelancer.slice(0, 6)}...{application.freelancer.slice(-4)}
            </p>
            {tier && (
              <Badge className={`text-xs mt-1 ${TIER_COLORS[tier]}`}>
                {SHINROE_TIER_LABELS[tier as keyof typeof SHINROE_TIER_LABELS]} (
                {shinroeScore})
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Job Terms */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{t('hireModal.contractTerms')}</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('hireModal.job')}</span>
              <span className="font-medium truncate max-w-[200px]">{job.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('hireModal.budget')}</span>
              <span className="font-medium text-sky">{formatEther(job.budget)} VERY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('hireModal.estimatedTime')}</span>
              <span>{application.proposedTimeline || '-'}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-sky/10 rounded-lg text-sm">
          <p className="text-sky">
            {t('hireModal.escrowWarning')}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button className="bg-sky hover:bg-sky/90" onClick={onConfirm}>
          {t('hireModal.confirm')}
        </Button>
      </DialogFooter>
    </>
  );
}

function ProcessingStep() {
  const { t } = useTranslation();
  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <div className="h-12 w-12 border-4 border-sky border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-medium">{t('hireModal.processing')}</p>
      <p className="text-sm text-muted-foreground mt-1">{t('hireModal.pleaseWait')}</p>
    </div>
  );
}

interface SuccessStepProps {
  application: Application;
  job: Job;
  onClose: () => void;
}

function SuccessStep({ application, job, onClose }: SuccessStepProps) {
  const { t } = useTranslation();
  const chatUrl = `/verychat?job=${job.id}&freelancer=${application.freelancer}`;

  return (
    <>
      <div className="py-8 flex flex-col items-center text-center">
        <div className="h-16 w-16 bg-green/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('hireModal.success.title')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('hireModal.success.message')}
        </p>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          {t('common.close')}
        </Button>
        <Button className="bg-sky hover:bg-sky/90 flex-1" asChild>
          <a href={chatUrl}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('hireModal.startChat')}
          </a>
        </Button>
      </DialogFooter>
    </>
  );
}
