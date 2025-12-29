'use client';

import { useState, useEffect } from 'react';
import { Gavel, Send, User, FileText, Scale } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { VoteDecision, VoteFormData, VOTE_DECISION_LABELS, Dispute } from '@/lib/types/dispute';
import { Job } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface VoteFormProps {
  dispute: Dispute;
  job: Job;
  onSubmit?: (data: VoteFormData) => Promise<void>;
  hasVoted?: boolean;
}

const MIN_RATIONALE = 50;
const MAX_RATIONALE = 500;

export function VoteForm({ dispute, job, onSubmit, hasVoted = false }: VoteFormProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [formData, setFormData] = useState<VoteFormData>({
    decision: 'split',
    rationale: '',
  });

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.vote.rationale) {
      setFormData((prev) => ({
        ...prev,
        rationale: demoData.vote.rationale,
      }));
    }
  }, [demoData.vote.rationale]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidRationale =
    formData.rationale.length >= MIN_RATIONALE &&
    formData.rationale.length <= MAX_RATIONALE;

  const canSubmit = formData.decision && isValidRationale && !hasVoted;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        console.log('Casting vote:', { disputeId: dispute.id, ...formData });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error('Failed to cast vote:', err);
      setError(err instanceof Error ? err.message : t('voteForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-green" />
            {t('voteForm.voteComplete')}
          </CardTitle>
          <CardDescription>{t('voteForm.voteCompleteDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          {t('voteForm.title')}
        </CardTitle>
        <CardDescription>{t('voteForm.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Job Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('voteForm.jobInfo')}
          </h4>
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <p className="font-medium">{job.title}</p>
            <p className="text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{t('disputes.client')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-mono truncate">{dispute.client.slice(0, 10)}...</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{t('disputes.freelancer')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-mono truncate">{dispute.freelancer.slice(0, 10)}...</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Evidence Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Scale className="h-4 w-4" />
            {t('voteForm.submittedEvidence')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {dispute.clientEvidence ? (
              <a
                href={dispute.clientEvidence}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky hover:underline"
              >
                {t('voteForm.viewClientEvidence')}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">{t('voteForm.noClientEvidence')}</span>
            )}
            {dispute.freelancerEvidence ? (
              <a
                href={dispute.freelancerEvidence}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky hover:underline"
              >
                {t('voteForm.viewFreelancerEvidence')}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">{t('voteForm.noFreelancerEvidence')}</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Decision */}
        <div className="space-y-3">
          <Label>{t('voteForm.decision')} *</Label>
          <RadioGroup
            value={formData.decision}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, decision: value as VoteDecision }))
            }
            className="space-y-2"
          >
            {(Object.keys(VOTE_DECISION_LABELS) as VoteDecision[]).map((decision) => (
              <div key={decision} className="flex items-center space-x-3">
                <RadioGroupItem value={decision} id={decision} />
                <Label htmlFor={decision} className="font-normal cursor-pointer">
                  {VOTE_DECISION_LABELS[decision]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <Label htmlFor="rationale">{t('voteForm.rationale')} *</Label>
          <Textarea
            id="rationale"
            placeholder={t('voteForm.rationalePlaceholder')}
            value={formData.rationale}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rationale: e.target.value }))
            }
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {t('voteForm.rationaleLength', { current: formData.rationale.length, max: MAX_RATIONALE, min: MIN_RATIONALE })}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full bg-violet hover:bg-violet-light"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            t('voteForm.submitting')
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t('voteForm.submit')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
