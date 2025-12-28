'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Clock, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreBadge, ScoreBadgeSkeleton } from '@/components/shinroe';
import { UserAvatar } from '@/components/shared';
import { Job, JobStatus, JobCategory } from '@/lib/types/job';
import { ShinroeScore } from '@/lib/types/shinroe';
import { useTranslation } from '@/lib/i18n';

interface JobCardProps {
  job: Job;
  clientScore?: ShinroeScore | null;
  clientScoreLoading?: boolean;
  currentUserAddress?: string;
  onApply?: (jobId: string) => void;
}

const STATUS_VARIANT: Record<JobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  in_progress: 'secondary',
  delivered: 'secondary',
  completed: 'default',
  disputed: 'destructive',
  cancelled: 'outline',
};

const STATUS_CLASSNAME: Partial<Record<JobStatus, string>> = {
  delivered: 'bg-sky/20 text-sky/60 border-sky/30',
};

export function JobCard({ job, clientScore, clientScoreLoading, currentUserAddress, onApply }: JobCardProps) {
  const { t, locale } = useTranslation();
  const deadlineDate = new Date(job.deadline * 1000);
  const isExpired = deadlineDate < new Date();
  const isOwner = currentUserAddress && job.client.toLowerCase() === currentUserAddress.toLowerCase();
  const canApply = job.status === 'open' && !isExpired && !isOwner;

  const dateLocale = locale === 'ko' ? ko : enUS;

  return (
    <Card hoverable className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant={STATUS_VARIANT[job.status]}
            className={`shrink-0 ${STATUS_CLASSNAME[job.status] || ''}`}
          >
            {t(`jobStatus.${job.status}`)}
          </Badge>
          <Badge variant="outline" className="shrink-0">
            {t(`jobCategory.${job.category}`)}
          </Badge>
        </div>
        <Link href={`/jobs/${job.id}`} className="group">
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-sky transition-colors mt-2">
            {job.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {job.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-sky" />
            <span className="font-medium">{formatEther(job.budget)} VERY</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className={isExpired ? 'text-destructive' : ''}>
              {isExpired
                ? t('common.expired')
                : t('common.timeRemaining', { time: formatDistanceToNow(deadlineDate, { locale: dateLocale }) })}
            </span>
          </div>

          {job.applicationCount !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{t('jobCard.applicants', { count: job.applicationCount })}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar
              address={job.client}
              size="sm"
              showName
              linkToProfile
            />
            {clientScoreLoading ? (
              <ScoreBadgeSkeleton />
            ) : clientScore ? (
              <ScoreBadge score={clientScore} />
            ) : null}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border">
        <div className="flex gap-2 w-full">
          {canApply && (
            <Button
              className="flex-1 bg-sky hover:bg-sky/90"
              onClick={() => onApply?.(job.id)}
            >
              {t('jobs.apply')}
            </Button>
          )}
          <Link href={`/jobs/${job.id}`} className={canApply ? 'flex-1' : 'w-full'}>
            <Button variant="outline" className="w-full">
              {t('jobs.viewDetails')}
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export function JobCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-6 w-full mt-2" />
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
