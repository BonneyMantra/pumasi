'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { formatEther } from 'viem';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/shared';
import { useApplication } from '@/lib/hooks/use-applications';
import { useTranslation } from '@/lib/i18n';
import { ApplicationStatus } from '@/lib/types/application';

const STATUS_CONFIG: Record<ApplicationStatus, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  accepted: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10' },
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const jobId = searchParams.get('jobId');

  const { application, job, isLoading, error } = useApplication(params.id as string);

  const dateLocale = locale === 'ko' ? ko : enUS;
  const dateFormat = locale === 'ko' ? 'yyyy년 M월 d일' : 'MMMM d, yyyy';

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (error || !application || !job) {
    return <ApplicationNotFound />;
  }

  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;
  const isAccepted = application.status === 'accepted';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link
        href={jobId ? `/jobs/${jobId}` : '/jobs'}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('applicationPage.backToJob')}
      </Link>

      {/* Status Banner */}
      <Card className={`mb-6 border-l-4 ${isAccepted ? 'border-l-green-500' : 'border-l-muted'}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={application.status === 'accepted' ? 'default' : 'outline'}
                  className={application.status === 'accepted' ? 'bg-green-600' : ''}
                >
                  {t(`jobDetailPage.applications.status.${application.status}`)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t(`applicationPage.statusMessages.${application.status}`)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {t('applicationPage.jobInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/jobs/${job.id}`}>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-4 w-4 text-sky" />
                      {formatEther(job.budget)} VERY
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(job.deadline * 1000), dateFormat, { locale: dateLocale })}
                    </span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Proposal Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('applicationPage.proposal')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.coverLetter ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('applicationDetail.coverLetter')}</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{application.coverLetter}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">{t('applicationDetail.noCoverLetter')}</p>
              )}

              {application.proposedTimeline && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('applicationDetail.proposedTimeline')}</h4>
                  <p className="text-muted-foreground">{application.proposedTimeline}</p>
                </div>
              )}

              {application.portfolioLinks && application.portfolioLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('applicationDetail.portfolioLinks')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.portfolioLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-sky hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {application.proposalURI && (
                <div className="pt-2 border-t">
                  <a
                    href={application.proposalURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-sky hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t('applicationDetail.viewOnIpfs')}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Freelancer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('applicationPage.freelancerInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <UserAvatar
                  address={application.freelancer}
                  size="lg"
                  showName
                  showAddress
                  linkToProfile
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t('applicationPage.appliedOn')}{' '}
                  {format(new Date(application.createdAt * 1000), dateFormat, { locale: dateLocale })}
                </p>
              </div>
              <Link href={`/profile/${application.freelancer}`}>
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  {t('applicationDetail.viewProfile')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Next Steps (only for accepted applications) */}
          {isAccepted && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-green-600 dark:text-green-400">
                  {t('applicationPage.nextSteps')}
                </CardTitle>
                <CardDescription>{t('applicationPage.workspaceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/jobs/${job.id}/workspace`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    {t('applicationPage.goToWorkspace')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-6 w-32 mb-6" />
      <Skeleton className="h-24 w-full mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-48" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ApplicationNotFound() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">{t('applicationPage.notFound.title')}</h1>
      <p className="text-muted-foreground mb-6">{t('applicationPage.notFound.message')}</p>
      <Link href="/jobs">
        <Button>{t('applicationPage.notFound.backToJobs')}</Button>
      </Link>
    </div>
  );
}
