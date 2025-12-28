'use client';

import { useState, useEffect } from 'react';
import { Plus, Send, Trash2, X } from 'lucide-react';

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
import { Job } from '@/lib/types/job';
import { ApplicationFormData } from '@/lib/types/application';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface ApplyModalProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ApplicationFormData) => Promise<void>;
}

const MIN_COVER_LETTER = 50;
const MAX_COVER_LETTER = 500;

export function ApplyModal({ job, open, onOpenChange, onSubmit }: ApplyModalProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [formData, setFormData] = useState<ApplicationFormData>({
    coverLetter: '',
    proposedTimeline: '',
    portfolioLinks: [],
    termsAccepted: false,
  });

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.apply.coverLetter) {
      setFormData((prev) => ({
        coverLetter: demoData.apply.coverLetter,
        proposedTimeline: demoData.apply.timeline,
        portfolioLinks: [...demoData.apply.portfolioLinks],
        termsAccepted: prev.termsAccepted,
      }));
    }
  }, [demoData.apply.coverLetter, demoData.apply.timeline]);
  const [newLink, setNewLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidCoverLetter =
    formData.coverLetter.length >= MIN_COVER_LETTER &&
    formData.coverLetter.length <= MAX_COVER_LETTER;

  const canSubmit =
    isValidCoverLetter &&
    formData.proposedTimeline.trim().length > 0 &&
    formData.termsAccepted;

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    try {
      new URL(newLink);
      setFormData((prev) => ({
        ...prev,
        portfolioLinks: [...prev.portfolioLinks, newLink.trim()],
      }));
      setNewLink('');
      setError(null);
    } catch {
      setError(t('applyModal.invalidUrl'));
    }
  };

  const handleRemoveLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index),
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
        // Default behavior: log and simulate delay
        console.log('Submitting application:', { jobId: job.id, ...formData });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error('Failed to submit application:', err);
      setError(err instanceof Error ? err.message : t('applyModal.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      coverLetter: demoData.apply.coverLetter,
      proposedTimeline: demoData.apply.timeline,
      portfolioLinks: [...demoData.apply.portfolioLinks],
      termsAccepted: false,
    });
    setNewLink('');
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('applyModal.title')}</DialogTitle>
          <DialogDescription>
            {t('applyModal.description', { jobTitle: job.title })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">{t('applyModal.coverLetter')} *</Label>
            <Textarea
              id="coverLetter"
              placeholder={t('applyModal.coverLetterPlaceholder')}
              value={formData.coverLetter}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, coverLetter: e.target.value }))
              }
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t('applyModal.characterCount', {
                current: formData.coverLetter.length,
                max: MAX_COVER_LETTER,
                min: MIN_COVER_LETTER,
              })}
            </p>
          </div>

          {/* Proposed Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">{t('applyModal.proposedTimeline')} *</Label>
            <Input
              id="timeline"
              placeholder={t('applyModal.proposedTimelinePlaceholder')}
              value={formData.proposedTimeline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, proposedTimeline: e.target.value }))
              }
            />
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <Label>{t('applyModal.portfolioLinks')}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t('applyModal.portfolioLinksPlaceholder')}
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddLink}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.portfolioLinks.length > 0 && (
              <ul className="space-y-1 mt-2">
                {formData.portfolioLinks.map((link, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-sm bg-muted/50 px-3 py-2 rounded-md"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky hover:underline truncate max-w-[350px]"
                    >
                      {link}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleRemoveLink(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, termsAccepted: checked === true }))
              }
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
              {t('applyModal.termsAgreement')}
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            className="bg-sky hover:bg-sky/90"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              t('applyModal.submitting')
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('applyModal.submit')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
