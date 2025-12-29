'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Send, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Job } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface RaiseDisputeFormData {
  reason: string;
  description: string;
  evidenceFiles: string[];
  confirmAction: boolean;
}

interface RaiseDisputeModalProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: RaiseDisputeFormData) => Promise<void>;
}

const MIN_REASON = 20;
const MAX_REASON = 200;
const MIN_DESCRIPTION = 50;
const MAX_DESCRIPTION = 1000;

export function RaiseDisputeModal({ job, open, onOpenChange, onSubmit }: RaiseDisputeModalProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [formData, setFormData] = useState<RaiseDisputeFormData>({
    reason: '',
    description: '',
    evidenceFiles: [],
    confirmAction: false,
  });

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.dispute.reason) {
      setFormData((prev) => ({
        reason: demoData.dispute.reason,
        description: demoData.dispute.description,
        evidenceFiles: [...demoData.dispute.fileLinks],
        confirmAction: prev.confirmAction,
      }));
    }
  }, [demoData.dispute.reason, demoData.dispute.description]);
  const [newFile, setNewFile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidReason =
    formData.reason.length >= MIN_REASON && formData.reason.length <= MAX_REASON;
  const isValidDescription =
    formData.description.length >= MIN_DESCRIPTION &&
    formData.description.length <= MAX_DESCRIPTION;

  const canSubmit = isValidReason && isValidDescription && formData.confirmAction;

  const handleAddFile = () => {
    if (!newFile.trim()) return;
    try {
      new URL(newFile);
      setFormData((prev) => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, newFile.trim()],
      }));
      setNewFile('');
      setError(null);
    } catch {
      setError(t('raiseDisputeModal.invalidUrl'));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        console.log('Raising dispute:', { jobId: job.id, ...formData });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error('Failed to raise dispute:', err);
      setError(err instanceof Error ? err.message : t('raiseDisputeModal.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      reason: demoData.dispute.reason,
      description: demoData.dispute.description,
      evidenceFiles: [...demoData.dispute.fileLinks],
      confirmAction: false,
    });
    setNewFile('');
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('raiseDisputeModal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('raiseDisputeModal.description', { jobTitle: job.title })}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('raiseDisputeModal.warning')}
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('raiseDisputeModal.reason')} *</Label>
            <Input
              id="reason"
              placeholder={t('raiseDisputeModal.reasonPlaceholder')}
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t('raiseDisputeModal.reasonLength', { current: formData.reason.length, max: MAX_REASON, min: MIN_REASON })}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('raiseDisputeModal.detailedDescription')} *</Label>
            <Textarea
              id="description"
              placeholder={t('raiseDisputeModal.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t('raiseDisputeModal.descriptionLength', { current: formData.description.length, max: MAX_DESCRIPTION, min: MIN_DESCRIPTION })}
            </p>
          </div>

          {/* Evidence Files */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('raiseDisputeModal.evidenceFiles')}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/..."
                value={newFile}
                onChange={(e) => setNewFile(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFile())}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddFile}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('raiseDisputeModal.evidenceHelp')}
            </p>
            {formData.evidenceFiles.length > 0 && (
              <ul className="space-y-1 mt-2">
                {formData.evidenceFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-sm bg-muted/50 px-3 py-2 rounded-md"
                  >
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky hover:underline truncate max-w-[380px]"
                    >
                      {file}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="confirm"
              checked={formData.confirmAction}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, confirmAction: checked === true }))
              }
            />
            <Label htmlFor="confirm" className="text-sm font-normal leading-relaxed">
              {t('raiseDisputeModal.confirmation')}
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              t('raiseDisputeModal.submitting')
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('raiseDisputeModal.submit')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
