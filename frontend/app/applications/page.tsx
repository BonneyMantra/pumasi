'use client';

import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { ArrowRight, Briefcase, Clock, Filter, Wallet } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplications } from '@/lib/hooks/use-applications';
import {
  ApplicationStatus,
  APPLICATION_STATUS_VARIANT,
} from '@/lib/types/application';
import { useTranslation } from '@/lib/i18n';
import { useAccount } from '@/lib/web3';

export default function MyApplicationsPage() {
  const { address } = useAccount();
  const { applications, jobs, isLoading } = useApplications(address);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const { t, locale } = useTranslation();

  const dateLocale = locale === 'ko' ? ko : enUS;

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('applicationsList.filter.all') },
    { value: 'pending', label: t('applicationStatus.pending') },
    { value: 'accepted', label: t('applicationStatus.accepted') },
    { value: 'rejected', label: t('applicationStatus.rejected') },
  ], [t]);

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('applications.title')}</h1>
        <p className="text-muted-foreground">{t('applications.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ApplicationStatus | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('applications.status')} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {t('applicationsList.count', { count: filteredApplications.length })}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <ApplicationsLoadingSkeleton />
      ) : filteredApplications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const job = jobs.find((j) => j.id === application.jobId);
            if (!job) return null;

            return (
              <Link key={application.id} href={`/applications/${application.id}?jobId=${job.id}`}>
              <Card className="hover:border-sky/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold line-clamp-1">{job.title}</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{t(`jobCategory.${job.category}`)}</Badge>
                        <Badge variant="secondary">{t(`jobStatus.${job.status}`)}</Badge>
                      </div>
                    </div>
                    <Badge variant={APPLICATION_STATUS_VARIANT[application.status]}>
                      {t(`applicationStatus.${application.status}`)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-sky shrink-0" />
                      <span>{formatEther(job.budget)} VERY</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(application.createdAt * 1000, {
                          locale: dateLocale,
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {application.proposedTimeline && (
                      <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {application.proposedTimeline}
                        </span>
                      </div>
                    )}

                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm">
                        {t('jobs.viewDetails')}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {application.coverLetter && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {application.coverLetter}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-16">
      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">{t('applications.empty')}</h2>
      <p className="text-muted-foreground mb-6">{t('applications.emptyDescription')}</p>
      <Link href="/jobs">
        <Button className="bg-sky hover:bg-sky/90">{t('applications.browseJobs')}</Button>
      </Link>
    </div>
  );
}

function ApplicationsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
