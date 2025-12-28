'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PostJobFormData } from '@/components/jobs/post-job-form';
import { Milestone, validateMilestones } from '@/components/jobs/milestone-builder';
import { useCreateJob, CreateJobParams } from './use-job-escrow';
import { JobMetadata, MilestoneMetadata } from '@/lib/services/job-metadata';
import { JobCategory } from '@/lib/types/job';
import { useDemoData } from './use-demo-data';
import { useTranslation } from '@/lib/i18n';
import { getExplorerLink } from '@/lib/config/chains';
import { useChainId } from '@/lib/web3';

export type WizardStep = 'details' | 'payment' | 'deposit' | 'success';

interface WizardState {
  step: WizardStep;
  formData: PostJobFormData;
  milestones: Milestone[];
  errors: string[];
}

// Demo prefill: Set deadline to 2 weeks from now
function getDefaultDeadline() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14);
  return deadline;
}

export function usePostJobWizard() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const chainId = useChainId();
  const demoData = useDemoData();
  const {
    createJob,
    isUploading,
    isPending,
    isConfirming,
    isSuccess,
    uploadError,
    writeError,
    isTxError,
    txHash,
  } = useCreateJob();

  const [state, setState] = useState<WizardState>({
    step: 'details',
    formData: {
      title: '',
      category: 'translation',
      description: '',
      budget: '0.01',
      deadline: getDefaultDeadline(),
      paymentType: 'full',
      requirements: '',
    },
    milestones: [],
    errors: [],
  });

  // Initialize with demo data on mount and update when language/template changes
  useEffect(() => {
    if (demoData.postJob.title) {
      setState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          title: demoData.postJob.title,
          description: demoData.postJob.description,
          requirements: demoData.postJob.requirements,
          budget: demoData.postJob.budget || prev.formData.budget,
          category: (demoData.postJob.category as JobCategory) || prev.formData.category,
        },
      }));
    }
  }, [demoData.postJob.title, demoData.postJob.description, demoData.postJob.requirements, demoData.postJob.budget, demoData.postJob.category, locale]);

  // Show success toast when job is created
  useEffect(() => {
    if (isSuccess && txHash && chainId) {
      const explorerLink = getExplorerLink(chainId, txHash, 'tx');
      toast.success(t('postJobWizard.toastSuccess'), {
        action: explorerLink
          ? {
              label: t('common.viewTx'),
              onClick: () => window.open(explorerLink, '_blank'),
            }
          : undefined,
        duration: 10000,
      });
    }
  }, [isSuccess, txHash, chainId, t]);

  const setStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, step, errors: [] }));
  }, []);

  const setFormData = useCallback((data: PostJobFormData) => {
    setState((prev) => ({ ...prev, formData: data, errors: [] }));
  }, []);

  const setMilestones = useCallback((milestones: Milestone[]) => {
    setState((prev) => ({ ...prev, milestones, errors: [] }));
  }, []);

  const goToPayment = useCallback((data: PostJobFormData) => {
    setFormData(data);
    if (data.paymentType === 'full') {
      setStep('deposit');
    } else {
      setStep('payment');
    }
  }, [setFormData, setStep]);

  const goToDeposit = useCallback(() => {
    if (state.formData.paymentType === 'milestone') {
      const errors = validateMilestones(
        state.milestones,
        state.formData.budget,
        state.formData.deadline
      );
      if (errors.length > 0) {
        setState((prev) => ({ ...prev, errors }));
        return;
      }
    }
    setStep('deposit');
  }, [state.formData, state.milestones, setStep]);

  const goBack = useCallback(() => {
    if (state.step === 'deposit' && state.formData.paymentType === 'milestone') {
      setStep('payment');
    } else if (state.step === 'payment' || state.step === 'deposit') {
      setStep('details');
    }
  }, [state.step, state.formData.paymentType, setStep]);

  const handleDeposit = useCallback(async () => {
    const { formData, milestones } = state;

    if (!formData.deadline || !formData.category) return;

    const milestoneMetadata: MilestoneMetadata[] | undefined =
      formData.paymentType === 'milestone'
        ? milestones.map((m) => ({
            title: m.title,
            amount: m.amount,
            deadline: m.deadline ? Math.floor(m.deadline.getTime() / 1000) : 0,
          }))
        : undefined;

    const metadata: JobMetadata = {
      title: formData.title,
      description: formData.description,
      category: formData.category as JobCategory,
      requirements: formData.requirements || undefined,
      paymentType: formData.paymentType,
      milestones: milestoneMetadata,
    };

    const params: CreateJobParams = {
      metadata,
      budget: formData.budget,
      deadline: Math.floor(formData.deadline.getTime() / 1000),
    };

    try {
      await createJob(params);
      setStep('success');
    } catch {
      // Error handled by hook state
    }
  }, [state, createJob, setStep]);

  const handleFinish = useCallback(() => {
    router.push('/jobs');
  }, [router]);

  const isProcessing = isUploading || isPending || isConfirming;
  const error = uploadError || (writeError?.message ?? null) || (isTxError ? '트랜잭션 실패' : null);

  return {
    ...state,
    setFormData,
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
  };
}
