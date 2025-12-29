import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import type { JobCategory, JobStatus } from '@/lib/types/job'
import type { DisputeStatus, VoteDecision } from '@/lib/types/dispute'
import type { ApplicationStatus } from '@/lib/types/application'

export function useJobLabels() {
  const { t } = useTranslation()

  const categoryLabels = useMemo<Record<JobCategory, string>>(() => ({
    translation: t('jobCategory.translation'),
    design: t('jobCategory.design'),
    writing: t('jobCategory.writing'),
    development: t('jobCategory.development'),
    tutoring: t('jobCategory.tutoring'),
    data_entry: t('jobCategory.data_entry'),
    delivery: t('jobCategory.delivery'),
    misc: t('jobCategory.misc'),
  }), [t])

  const statusLabels = useMemo<Record<JobStatus, string>>(() => ({
    open: t('jobStatus.open'),
    in_progress: t('jobStatus.in_progress'),
    delivered: t('jobStatus.delivered'),
    completed: t('jobStatus.completed'),
    disputed: t('jobStatus.disputed'),
    cancelled: t('jobStatus.cancelled'),
  }), [t])

  return { categoryLabels, statusLabels }
}

export function useDisputeLabels() {
  const { t } = useTranslation()

  const statusLabels = useMemo<Record<DisputeStatus, string>>(() => ({
    evidence: t('disputeStatus.evidence'),
    voting: t('disputeStatus.voting'),
    resolved: t('disputeStatus.resolved'),
  }), [t])

  const decisionLabels = useMemo<Record<VoteDecision, string>>(() => ({
    full_to_client: t('voteDecision.full_to_client'),
    full_to_freelancer: t('voteDecision.full_to_freelancer'),
    split: t('voteDecision.split'),
  }), [t])

  return { statusLabels, decisionLabels }
}

export function useApplicationLabels() {
  const { t } = useTranslation()

  const statusLabels = useMemo<Record<ApplicationStatus, string>>(() => ({
    pending: t('applicationStatus.pending'),
    accepted: t('applicationStatus.accepted'),
    rejected: t('applicationStatus.rejected'),
  }), [t])

  return { statusLabels }
}
