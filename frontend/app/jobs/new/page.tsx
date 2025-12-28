'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PostJobForm, PostJobFormData } from '@/components/jobs/post-job-form';
import { MilestoneBuilder, Milestone } from '@/components/jobs/milestone-builder';
import { EscrowDeposit } from '@/components/jobs/escrow-deposit';
import { usePostJobWizard, WizardStep } from '@/lib/hooks/use-post-job-wizard';
import { cn } from '@/lib/utils';
import { JobCategory } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

const STEP_KEYS: WizardStep[] = ['details', 'payment', 'deposit', 'success'];

function getStepIndex(step: WizardStep): number {
  return STEP_KEYS.indexOf(step);
}

function getProgress(step: WizardStep, paymentType: 'full' | 'milestone'): number {
  const stepIndex = getStepIndex(step);
  // Skip payment step progress for full payment type
  if (paymentType === 'full') {
    if (step === 'details') return 33;
    if (step === 'deposit') return 66;
    if (step === 'success') return 100;
  }
  return ((stepIndex + 1) / STEP_KEYS.length) * 100;
}

export default function PostJobPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    step,
    formData,
    milestones,
    errors,
    setMilestones,
    goToPayment,
    goToDeposit,
    goBack,
    handleDeposit,
    handleFinish,
    isProcessing,
    isSuccess,
    error,
    txHash,
  } = usePostJobWizard();

  const steps = useMemo(() => [
    { key: 'details' as WizardStep, label: t('postJobWizard.steps.details') },
    { key: 'payment' as WizardStep, label: t('postJobWizard.steps.payment') },
    { key: 'deposit' as WizardStep, label: t('postJobWizard.steps.deposit') },
    { key: 'success' as WizardStep, label: t('postJobWizard.steps.success') },
  ], [t]);

  const progress = getProgress(step, formData.paymentType);
  const showPaymentStep = formData.paymentType === 'milestone';

  return (
    <div className="container max-w-2xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('postJobWizard.backToList')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('postJobWizard.title')}</h1>
        <p className="text-muted-foreground">{t('postJobWizard.subtitle')}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-3" />
        <div className="flex justify-between">
          {steps.filter((s) => showPaymentStep || s.key !== 'payment').map((s, i) => {
            const isActive = s.key === step;
            const isPast = getStepIndex(s.key) < getStepIndex(step);
            return (
              <div
                key={s.key}
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isActive && 'text-sky font-medium',
                  isPast && 'text-muted-foreground',
                  !isActive && !isPast && 'text-muted-foreground/50'
                )}
              >
                {isPast ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                      isActive ? 'bg-sky text-white' : 'bg-muted'
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('postJobWizard.detailsCard.title')}</CardTitle>
            <CardDescription>{t('postJobWizard.detailsCard.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PostJobForm
              initialData={formData}
              onSubmit={goToPayment}
              isSubmitting={false}
            />
          </CardContent>
        </Card>
      )}

      {step === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('postJobWizard.milestoneCard.title')}</CardTitle>
            <CardDescription>
              {t('postJobWizard.milestoneCard.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <MilestoneBuilder
              milestones={milestones}
              onChange={setMilestones}
              totalBudget={formData.budget}
              jobDeadline={formData.deadline}
            />

            {errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                {t('postJobWizard.previous')}
              </Button>
              <Button
                onClick={goToDeposit}
                className="flex-1 bg-sky hover:bg-sky/90"
              >
                {t('postJobWizard.nextStep')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'deposit' && formData.category && formData.deadline && (
        <EscrowDeposit
          jobSummary={{
            title: formData.title,
            category: formData.category as JobCategory,
            description: formData.description,
            budget: formData.budget,
            deadline: formData.deadline,
            paymentType: formData.paymentType,
            milestones: formData.paymentType === 'milestone' ? milestones : undefined,
          }}
          onDeposit={handleDeposit}
          onBack={goBack}
          isProcessing={isProcessing}
          txHash={txHash}
          isSuccess={isSuccess}
          error={error}
        />
      )}

      {step === 'success' && (
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('postJobWizard.success.title')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('postJobWizard.success.message')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/jobs">{t('postJobWizard.success.backToList')}</Link>
              </Button>
              <Button onClick={handleFinish} className="bg-sky hover:bg-sky/90">
                {t('postJobWizard.success.viewMyJobs')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
