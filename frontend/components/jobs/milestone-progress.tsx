'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Check, Clock, Circle, Play, AlertTriangle, Wallet } from 'lucide-react';
import { formatEther } from 'viem';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useMilestones } from '@/lib/hooks/use-job-workflow';
import { Milestone } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

interface MilestoneProgressProps {
  jobId: string;
}

export function MilestoneProgress({ jobId }: MilestoneProgressProps) {
  const { t } = useTranslation();
  const { milestones, isLoading } = useMilestones(jobId);

  if (isLoading) return <MilestoneProgressSkeleton />;

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('milestoneProgress.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {t('milestoneProgress.noMilestones')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = milestones.filter((m) => m.status === 'approved').length;
  const progressPercent = (completedCount / milestones.length) * 100;
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, BigInt(0));
  const completedAmount = milestones
    .filter((m) => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, BigInt(0));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('milestoneProgress.progressTitle')}</CardTitle>
          <Badge variant="outline">
            {t('milestoneProgress.completed', { completed: completedCount, total: milestones.length })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t('milestoneProgress.paidAmount', { amount: formatEther(completedAmount) })}</span>
            <span>{t('milestoneProgress.totalAmount', { amount: formatEther(totalAmount) })}</span>
          </div>
        </div>

        {/* Milestone list */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              index={index}
              isLast={index === milestones.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneItem({
  milestone,
  index,
  isLast,
}: {
  milestone: Milestone;
  index: number;
  isLast: boolean;
}) {
  const { t, locale } = useTranslation();
  const deadlineDate = new Date(milestone.deadline * 1000);
  const isOverdue = deadlineDate < new Date() && milestone.status !== 'approved';
  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-4 top-10 w-0.5 h-[calc(100%+1rem)] bg-border" />
      )}

      <div className="flex gap-4">
        {/* Status icon */}
        <div className="relative z-10">
          <MilestoneStatusIcon status={milestone.status} />
        </div>

        {/* Content */}
        <div className="flex-1 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium">
                {index + 1}. {milestone.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
            </div>
            <MilestoneStatusBadge status={milestone.status} />
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-sky">
              <Wallet className="h-4 w-4" />
              {formatEther(milestone.amount)} VERY
            </span>
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {format(deadlineDate, locale === 'ko' ? 'M월 d일' : 'MMM d', { locale: locale === 'ko' ? ko : enUS })}
              {!isOverdue && daysLeft > 0 && daysLeft <= 7 && (
                <span className="text-yellow ml-1">({t('milestoneProgress.daysLeft', { days: daysLeft })})</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneStatusIcon({ status }: { status: Milestone['status'] }) {
  const baseClass = 'h-8 w-8 rounded-full flex items-center justify-center';

  switch (status) {
    case 'approved':
      return (
        <div className={`${baseClass} bg-green`}>
          <Check className="h-4 w-4 text-black" />
        </div>
      );
    case 'delivered':
      return (
        <div className={`${baseClass} bg-sky`}>
          <Clock className="h-4 w-4 text-white" />
        </div>
      );
    case 'in_progress':
      return (
        <div className={`${baseClass} bg-violet`}>
          <Play className="h-4 w-4 text-white" />
        </div>
      );
    default:
      return (
        <div className={`${baseClass} bg-muted`}>
          <Circle className="h-4 w-4 text-muted-foreground" />
        </div>
      );
  }
}

function MilestoneStatusBadge({ status }: { status: Milestone['status'] }) {
  const { t } = useTranslation();
  const config = {
    pending: { labelKey: 'milestoneProgress.status.pending', variant: 'outline' as const },
    in_progress: { labelKey: 'milestoneProgress.status.inProgress', variant: 'secondary' as const },
    delivered: { labelKey: 'milestoneProgress.status.delivered', variant: 'default' as const },
    approved: { labelKey: 'milestoneProgress.status.approved', variant: 'default' as const },
  };

  const { labelKey, variant } = config[status];

  return <Badge variant={variant}>{t(labelKey)}</Badge>;
}

function MilestoneProgressSkeleton() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-2 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
