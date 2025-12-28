'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { AlertTriangle, Briefcase, Clock, Play, User } from 'lucide-react';
import { formatEther } from 'viem';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyJobs, useMyActiveJobs } from '@/lib/hooks/use-jobs';
import { Job, JobStatus } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';
import { useJobLabels } from '@/lib/hooks/use-translated-labels';

export default function ActiveJobsPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'freelancer'>('client');
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="h-7 w-7 text-sky" />
        <h1 className="text-2xl font-bold">{t('activeJobs.title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'client' | 'freelancer')}>
        <TabsList className="mb-6">
          <TabsTrigger value="client">{t('activeJobs.asClient')}</TabsTrigger>
          <TabsTrigger value="freelancer">{t('activeJobs.asFreelancer')}</TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <ClientActiveJobs />
        </TabsContent>

        <TabsContent value="freelancer">
          <FreelancerActiveJobs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientActiveJobs() {
  const { t } = useTranslation();
  // TODO: Get address from wallet context
  const address = '0x1234567890123456789012345678901234567890';
  const { jobs, isLoading } = useMyJobs(address);

  const activeJobs = jobs.filter(
    (job) => job.status === 'in_progress' || job.status === 'delivered'
  );

  if (isLoading) return <ActiveJobsSkeleton />;

  if (activeJobs.length === 0) {
    return <EmptyState message={t('activeJobs.noClientJobs')} />;
  }

  return (
    <div className="space-y-4">
      {activeJobs.map((job) => (
        <ActiveJobCard key={job.id} job={job} role="client" />
      ))}
    </div>
  );
}

function FreelancerActiveJobs() {
  const { t } = useTranslation();
  // TODO: Get address from wallet context
  const address = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01';
  const { jobs, isLoading } = useMyActiveJobs(address);

  if (isLoading) return <ActiveJobsSkeleton />;

  if (jobs.length === 0) {
    return <EmptyState message={t('activeJobs.noFreelancerJobs')} />;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <ActiveJobCard key={job.id} job={job} role="freelancer" />
      ))}
    </div>
  );
}

function ActiveJobCard({ job, role }: { job: Job; role: 'client' | 'freelancer' }) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === 'ko' ? ko : enUS;
  const deadlineDate = new Date(job.deadline * 1000);
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft <= 3 && daysLeft > 0;
  const isOverdue = daysLeft <= 0;

  return (
    <Card className={isOverdue ? 'border-destructive' : isUrgent ? 'border-yellow' : ''}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={job.status} />
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t('activeJobs.overdue')}
                </Badge>
              )}
              {isUrgent && !isOverdue && (
                <Badge className="bg-yellow text-black flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t('activeJobs.daysRemaining', { days: daysLeft.toString() })}
                </Badge>
              )}
            </div>

            <Link href={`/jobs/${job.id}/workspace`} className="group">
              <h3 className="font-semibold text-lg truncate group-hover:text-sky transition-colors">
                {job.title}
              </h3>
            </Link>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(deadlineDate, { locale: dateLocale, addSuffix: true })}
              </span>
              <span className="font-medium text-sky">{formatEther(job.budget)} VERY</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/jobs/${job.id}/workspace`}>
              <Button className="bg-sky hover:bg-sky/90">
                <Play className="h-4 w-4 mr-2" />
                {t('activeJobs.workspace')}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const { statusLabels } = useJobLabels();
  const variants: Record<JobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    open: 'default',
    in_progress: 'secondary',
    delivered: 'outline',
    completed: 'default',
    disputed: 'destructive',
    cancelled: 'outline',
  };

  return <Badge variant={variants[status]}>{statusLabels[status]}</Badge>;
}

function EmptyState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
        <Link href="/jobs">
          <Button variant="outline" className="mt-4">
            {t('activeJobs.browseJobs')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ActiveJobsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
