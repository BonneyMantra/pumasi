'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRequestRevision } from '@/lib/hooks/use-job-workflow';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface RevisionRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  deliveryId: string;
}

export function RevisionRequest({ open, onOpenChange, jobId, deliveryId }: RevisionRequestProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const { requestRevision, isRequesting } = useRequestRevision(jobId);

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.revision.reason) {
      setReason(demoData.revision.reason);
      setFeedback(demoData.revision.feedback);
    }
  }, [demoData.revision.reason, demoData.revision.feedback]);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    await requestRevision({
      deliveryId,
      reason,
      feedback,
    });

    setReason(demoData.revision.reason);
    setFeedback(demoData.revision.feedback);
    onOpenChange(false);
  };

  const canSubmit = reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow" />
            {t('revisionRequest.title')}
          </DialogTitle>
          <DialogDescription>
            {t('revisionRequest.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t('revisionRequest.reasonLabel')}</Label>
            <Textarea
              id="reason"
              placeholder={t('revisionRequest.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{t('revisionRequest.minChars', { count: reason.length })}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">{t('revisionRequest.feedbackLabel')}</Label>
            <Textarea
              id="feedback"
              placeholder={t('revisionRequest.feedbackPlaceholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <strong>{t('revisionRequest.noteLabel')}</strong> {t('revisionRequest.noteText')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isRequesting}
            className="bg-yellow hover:bg-yellow/90 text-black"
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('revisionRequest.requesting')}
              </>
            ) : (
              t('revisionRequest.submitButton')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
