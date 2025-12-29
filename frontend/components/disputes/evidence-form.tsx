'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Send, Trash2, Upload, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EvidenceFormData } from '@/lib/types/dispute';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface EvidenceFormProps {
  disputeId: string;
  deadline: number;
  existingEvidence?: string;
  onSubmit?: (data: EvidenceFormData) => Promise<void>;
  isDisabled?: boolean;
}

const MIN_DESCRIPTION = 50;
const MAX_DESCRIPTION = 2000;

function formatTimeRemaining(deadline: number, t: (key: string, params?: Record<string, any>) => string): string {
  const now = Date.now();
  const remaining = deadline - now;

  if (remaining <= 0) return t('common.expired');

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return t('evidenceForm.daysHoursRemaining', { days, hours: hours % 24 });
  }
  return t('evidenceForm.hoursMinutesRemaining', { hours, minutes });
}

export function EvidenceForm({
  disputeId,
  deadline,
  existingEvidence,
  onSubmit,
  isDisabled = false,
}: EvidenceFormProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [formData, setFormData] = useState<EvidenceFormData>({
    description: existingEvidence || '',
    fileURIs: [],
  });

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (!existingEvidence && demoData.evidence.description) {
      setFormData({
        description: demoData.evidence.description,
        fileURIs: [...demoData.evidence.fileLinks],
      });
    }
  }, [demoData.evidence.description, existingEvidence]);
  const [newFile, setNewFile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(deadline, t));

  const isDeadlinePassed = Date.now() > deadline;
  const isValidDescription =
    formData.description.length >= MIN_DESCRIPTION &&
    formData.description.length <= MAX_DESCRIPTION;

  const canSubmit = isValidDescription && !isDeadlinePassed && !isDisabled;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(deadline, t));
    }, 60000);
    return () => clearInterval(interval);
  }, [deadline, t]);

  const handleAddFile = () => {
    if (!newFile.trim()) return;
    try {
      new URL(newFile);
      setFormData((prev) => ({
        ...prev,
        fileURIs: [...prev.fileURIs, newFile.trim()],
      }));
      setNewFile('');
      setError(null);
    } catch {
      setError(t('evidenceForm.invalidUrl'));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fileURIs: prev.fileURIs.filter((_, i) => i !== index),
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
        console.log('Submitting evidence:', { disputeId, ...formData });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error('Failed to submit evidence:', err);
      setError(err instanceof Error ? err.message : t('evidenceForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('evidenceForm.title')}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className={isDeadlinePassed ? 'text-destructive' : 'text-sky'}>
            {timeRemaining}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isDeadlinePassed && (
          <Alert variant="destructive">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {t('evidenceForm.deadlinePassed')}
            </AlertDescription>
          </Alert>
        )}

        {existingEvidence && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {t('evidenceForm.alreadySubmitted')}
            </AlertDescription>
          </Alert>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="evidence-description">{t('evidenceForm.description')} *</Label>
          <Textarea
            id="evidence-description"
            placeholder={t('evidenceForm.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={6}
            className="resize-none"
            disabled={isDeadlinePassed || isDisabled}
          />
          <p className="text-xs text-muted-foreground">
            {t('evidenceForm.descriptionLength', { current: formData.description.length, max: MAX_DESCRIPTION, min: MIN_DESCRIPTION })}
          </p>
        </div>

        {/* File URLs */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('evidenceForm.attachments')}
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={newFile}
              onChange={(e) => setNewFile(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFile())}
              disabled={isDeadlinePassed || isDisabled}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddFile}
              disabled={isDeadlinePassed || isDisabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.fileURIs.length > 0 && (
            <ul className="space-y-1 mt-2">
              {formData.fileURIs.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-sm bg-muted/50 px-3 py-2 rounded-md"
                >
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky hover:underline truncate max-w-[350px]"
                  >
                    {file}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isDeadlinePassed || isDisabled}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full bg-sky hover:bg-sky/90"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            t('evidenceForm.submitting')
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t('evidenceForm.submit')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
