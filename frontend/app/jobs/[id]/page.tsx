'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, Wallet, ExternalLink, CheckCircle, Eye, User } from 'lucide-react';
import { formatEther } from 'viem';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplyModal, ApplicationDetailDialog } from '@/components/applications';
import { UserAvatar } from '@/components/shared';
import { useJob } from '@/lib/hooks/use-jobs';
import {
  useSubmitApplication,
  useJobApplications,
  useAcceptApplication,
  useRejectApplication,
  getRejectedApplications,
} from '@/lib/hooks/use-applications';
import { Job, JobStatus } from '@/lib/types/job';
import { Application, ApplicationFormData } from '@/lib/types/application';
import { useTranslation } from '@/lib/i18n';
import { useJobLabels } from '@/lib/hooks/use-translated-labels';
import { getExplorerLink } from '@/lib/config/chains';
import { useChainId, useAccount } from '@/lib/web3';
import { toast } from 'sonner';

const STATUS_VARIANT: Record<JobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  in_progress: 'secondary',
  delivered: 'outline',
  completed: 'default',
  disputed: 'destructive',
  cancelled: 'outline',
};

export default function JobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const chainId = useChainId();
  const { address } = useAccount();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  // Optimistic UI: track if user just applied (before subgraph indexes)
  const [justApplied, setJustApplied] = useState(false);
  // Track if we've shown the success toast for current tx
  const [toastShownForTx, setToastShownForTx] = useState<string | null>(null);

  // Fetch job from subgraph
  const { job, isLoading, refetch: refetchJob } = useJob(params.id as string);

  // Fetch applications for this job (for creator view and to check if user applied)
  const { applications, isLoading: applicationsLoading, refetch: refetchApplications } = useJobApplications(params.id as string);

  // Application submission hook
  const { submit, isSubmitting, isSuccess, isConfirming, txHash, error: submitError } = useSubmitApplication(params.id as string);

  // Check if current user is the job creator
  const isCreator = address && job?.client && address.toLowerCase() === job.client.toLowerCase();

  // Check if current user has already applied (from subgraph)
  const userApplicationFromSubgraph = useMemo(() => {
    if (!address || !applications) return null;
    return applications.find(app => app.freelancer.toLowerCase() === address.toLowerCase());
  }, [address, applications]);

  // User has applied if: subgraph shows it OR we just applied (optimistic)
  const hasApplied = !!userApplicationFromSubgraph || justApplied;
  const userApplication = userApplicationFromSubgraph;

  useEffect(() => {
    if (searchParams.get('apply') === 'true' && job?.status === 'open') {
      setShowApplyDialog(true);
    }
  }, [searchParams, job]);

  // Show success toast when application is confirmed (only once per tx)
  useEffect(() => {
    if (isSuccess && txHash && chainId && toastShownForTx !== txHash) {
      console.log('[JobDetailPage] Transaction confirmed, showing success toast for tx:', txHash);
      setToastShownForTx(txHash);
      setJustApplied(true); // Optimistic UI update
      const explorerLink = getExplorerLink(chainId, txHash, 'tx');
      toast.success(t('applyModal.toastSuccess'), {
        action: explorerLink
          ? {
              label: t('common.viewTx'),
              onClick: () => window.open(explorerLink, '_blank'),
            }
          : undefined,
        duration: 10000,
      });
    }
  }, [isSuccess, txHash, chainId, t, toastShownForTx]);

  // Show error toast when application fails
  useEffect(() => {
    if (submitError && !isSubmitting && !isConfirming) {
      console.log('[JobDetailPage] Application error:', submitError);
      toast.error(submitError, { duration: 8000 });
    }
  }, [submitError, isSubmitting, isConfirming]);

  // Refetch applications after successful submission
  useEffect(() => {
    if (isSuccess) {
      console.log('[JobDetailPage] Application successful, refetching applications...');
      refetchApplications();
    }
  }, [isSuccess, refetchApplications]);

  const handleSubmitApplication = async (data: ApplicationFormData) => {
    // Close dialog first to avoid z-index issues with WEPIN widget
    setShowApplyDialog(false);
    await submit(data);
  };

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (!job) {
    return <JobNotFound />;
  }

  const deadlineDate = new Date(job.deadline * 1000);
  const createdDate = new Date(job.createdAt * 1000);
  const isExpired = deadlineDate < new Date();
  // User can only apply if: job is open, not expired, not the creator, AND hasn't already applied
  const canApply = job.status === 'open' && !isExpired && !isCreator && !hasApplied;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('jobDetailPage.backToList')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <JobHeader job={job} />
          <JobDescription job={job} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <JobInfo job={job} deadlineDate={deadlineDate} createdDate={createdDate} isExpired={isExpired} />
          <ClientCard job={job} />
          {canApply && (
            <Button
              className="w-full bg-sky hover:bg-sky/90"
              size="lg"
              onClick={() => setShowApplyDialog(true)}
              disabled={isSubmitting || isConfirming}
            >
              {isSubmitting || isConfirming ? t('common.processing') : t('jobDetailPage.apply')}
            </Button>
          )}
          {hasApplied && userApplication?.status === 'accepted' && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {t('jobDetailPage.applicationAccepted')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('jobDetailPage.goToWorkspaceDescription')}
                    </p>
                  </div>
                </div>
                <Link href={`/jobs/${job.id}/workspace`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    {t('jobDetailPage.goToWorkspace')}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {hasApplied && userApplication?.status !== 'accepted' && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {t('jobDetailPage.alreadyApplied')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userApplication
                        ? `${t('jobDetailPage.applicationStatus')}: ${t(`jobDetailPage.applications.status.${userApplication.status}`)}`
                        : t('jobDetailPage.applicationSubmitted')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {isCreator && job.status === 'open' && (
            <Card className="border-sky/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {t('jobDetailPage.creatorNote')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('jobDetailPage.cannotApplyOwn')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Applications section for job creator */}
      {isCreator && job && (
        <div className="mt-8">
          <ApplicationsSection
            applications={applications}
            isLoading={applicationsLoading}
            jobId={params.id as string}
            jobStatus={job.status}
            onApplicationAccepted={() => {
              refetchApplications();
              refetchJob();
            }}
          />
        </div>
      )}

      {/* Apply dialog */}
      {job && (
        <ApplyModal
          job={job}
          open={showApplyDialog}
          onOpenChange={setShowApplyDialog}
          onSubmit={handleSubmitApplication}
        />
      )}
    </div>
  );
}

function JobHeader({ job }: { job: Job }) {
  const { statusLabels, categoryLabels } = useJobLabels();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant={STATUS_VARIANT[job.status]}>{statusLabels[job.status]}</Badge>
        <Badge variant="outline">{categoryLabels[job.category]}</Badge>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
    </div>
  );
}

function JobDescription({ job }: { job: Job }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('jobDetailPage.description')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
      </CardContent>
    </Card>
  );
}

function JobInfo({
  job,
  deadlineDate,
  createdDate,
  isExpired,
}: {
  job: Job;
  deadlineDate: Date;
  createdDate: Date;
  isExpired: boolean;
}) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === 'ko' ? ko : enUS;
  const dateFormat = locale === 'ko' ? 'yyyy년 M월 d일' : 'MMMM d, yyyy';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('jobDetailPage.jobInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-sky" />
          <div>
            <p className="text-sm text-muted-foreground">{t('jobDetailPage.budget')}</p>
            <p className="font-semibold">{formatEther(job.budget)} VERY</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">{t('jobDetailPage.deadline')}</p>
            <p className={`font-semibold ${isExpired ? 'text-destructive' : ''}`}>
              {format(deadlineDate, dateFormat, { locale: dateLocale })}
              {!isExpired && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({formatDistanceToNow(deadlineDate, { locale: dateLocale })} {t('jobDetailPage.remaining')})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">{t('jobDetailPage.postedOn')}</p>
            <p className="font-semibold">{format(createdDate, dateFormat, { locale: dateLocale })}</p>
          </div>
        </div>
        {job.metadataURI && (
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{t('jobDetailPage.metadata')}</p>
              <a
                href={job.metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky hover:underline"
              >
                {t('jobDetailPage.viewOnIpfs')}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClientCard({ job }: { job: Job }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('jobDetailPage.clientInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <UserAvatar
          address={job.client}
          size="lg"
          showName
          showAddress
          linkToProfile
        />
      </CardContent>
    </Card>
  );
}

function JobDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function JobNotFound() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">{t('jobDetailPage.notFound.title')}</h1>
      <p className="text-muted-foreground mb-6">{t('jobDetailPage.notFound.message')}</p>
      <Link href="/jobs">
        <Button>{t('jobDetailPage.notFound.backToList')}</Button>
      </Link>
    </div>
  );
}

function ApplicationsSection({
  applications,
  isLoading,
  jobId,
  jobStatus,
  onApplicationAccepted,
}: {
  applications: Application[];
  isLoading: boolean;
  jobId: string;
  jobStatus: JobStatus;
  onApplicationAccepted: () => void;
}) {
  const { t } = useTranslation();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [acceptingAppId, setAcceptingAppId] = useState<string | null>(null);

  useEffect(() => {
    setRejectedIds(getRejectedApplications());
  }, []);

  // Clear accepting state when application is successfully accepted
  const handleAcceptSuccess = () => {
    setAcceptingAppId(null);
    onApplicationAccepted();
  };

  // Find accepted application
  const acceptedApplication = useMemo(() => {
    return applications.find((app) => app.status === 'accepted');
  }, [applications]);

  // Filter out rejected applications (only when job is still open)
  const visibleApplications = useMemo(() => {
    return applications.filter((app) => !rejectedIds.includes(app.id));
  }, [applications, rejectedIds]);

  const isJobOpen = jobStatus === 'open';

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app);
    setDialogOpen(true);
  };

  const handleReject = (applicationId: string) => {
    setRejectedIds((prev) => [...prev, applicationId]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('jobDetailPage.applications.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show accepted application if there is one (regardless of job status for optimistic UI)
  if (acceptedApplication) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('jobDetailPage.applications.hiredFreelancer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AcceptedApplicationCard application={acceptedApplication} jobId={jobId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('jobDetailPage.applications.title')}
            <Badge variant="secondary">{visibleApplications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleApplications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('jobDetailPage.applications.empty')}
            </p>
          ) : (
            <div className="space-y-4">
              {visibleApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  jobId={jobId}
                  onViewDetails={() => handleViewDetails(app)}
                  onReject={() => handleReject(app.id)}
                  onAccepted={handleAcceptSuccess}
                  onAccepting={() => setAcceptingAppId(app.id)}
                  onAcceptError={() => setAcceptingAppId(null)}
                  isBeingAccepted={acceptingAppId === app.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ApplicationDetailDialog
        application={selectedApp}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

function ApplicationCard({
  application,
  jobId,
  onViewDetails,
  onReject,
  onAccepted,
  onAccepting,
  onAcceptError,
  isBeingAccepted,
}: {
  application: Application;
  jobId: string;
  onViewDetails: () => void;
  onReject: () => void;
  onAccepted: () => void;
  onAccepting: () => void;
  onAcceptError?: () => void;
  isBeingAccepted?: boolean;
}) {
  const { t } = useTranslation();
  const chainId = useChainId();
  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    accepted: 'default',
    rejected: 'destructive',
  };

  const { accept, isSuccess: acceptSuccess, txHash, error: acceptError, step } = useAcceptApplication(
    application.id,
    jobId,
    application.freelancer
  );
  const { reject, isRejecting } = useRejectApplication(application.id);

  useEffect(() => {
    if (acceptSuccess && txHash) {
      const explorerLink = chainId ? getExplorerLink(chainId, txHash, 'tx') : null;
      toast.success(t('jobDetailPage.applications.acceptSuccess'), {
        action: explorerLink
          ? { label: t('common.viewTx'), onClick: () => window.open(explorerLink, '_blank') }
          : undefined,
        duration: 10000,
      });
      onAccepted();
    }
  }, [acceptSuccess, txHash, chainId, t, onAccepted]);

  useEffect(() => {
    if (acceptError) {
      toast.error(acceptError, { duration: 8000 });
      onAcceptError?.();
    }
  }, [acceptError, onAcceptError]);

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAccepting();
    await accept();
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await reject();
    onReject();
    toast.success(t('jobDetailPage.applications.rejectSuccess'));
  };

  const isPending = application.status === 'pending';

  // Show loading state when being accepted
  if (isBeingAccepted) {
    return (
      <div className="border rounded-lg p-6 bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <UserAvatar address={application.freelancer} size="md" showName />
            </div>
            <p className="text-sm text-muted-foreground">
              {step === 'accepting' && t('jobDetailPage.applications.acceptingApplication')}
              {step === 'assigning' && t('jobDetailPage.applications.assigningFreelancer')}
              {(step === 'idle' || step === 'done') && t('jobDetailPage.applications.hiringInProgress')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar address={application.freelancer} size="md" showName linkToProfile />
          <p className="text-xs text-muted-foreground">
            {t('jobDetailPage.applications.appliedAt')}{' '}
            {format(new Date(application.createdAt * 1000), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant={statusVariant[application.status] || 'outline'}>
          {t(`jobDetailPage.applications.status.${application.status}`)}
        </Badge>
      </div>
      {application.coverLetter && (
        <p className="text-sm text-muted-foreground line-clamp-2">{application.coverLetter}</p>
      )}
      {isPending && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-1" />
            {t('jobDetailPage.applications.viewDetails')}
          </Button>
          <Link href={`/profile/${application.freelancer}`}>
            <Button size="sm" variant="outline">
              <User className="h-4 w-4 mr-1" />
              {t('jobDetailPage.applications.viewProfile')}
            </Button>
          </Link>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleAccept}>
            {t('jobDetailPage.applications.accept')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject} disabled={isRejecting}>
            {isRejecting ? t('common.processing') : t('jobDetailPage.applications.reject')}
          </Button>
        </div>
      )}
    </div>
  );
}

function AcceptingApplicationCard({ application }: { application?: Application }) {
  const { t } = useTranslation();
  if (!application) return null;

  return (
    <div className="border rounded-lg p-6 bg-muted/30">
      <div className="flex items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky" />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <UserAvatar address={application.freelancer} size="md" showName />
          </div>
          <p className="text-sm text-muted-foreground">{t('jobDetailPage.applications.hiringInProgress')}</p>
        </div>
      </div>
    </div>
  );
}

function AcceptedApplicationCard({ application, jobId }: { application: Application; jobId: string }) {
  const { t } = useTranslation();

  return (
    <Link href={`/jobs/${jobId}/workspace`}>
      <div className="border border-green-500/50 rounded-lg p-4 bg-green-500/5 hover:bg-green-500/10 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar address={application.freelancer} size="lg" showName showAddress />
            <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('jobDetailPage.applications.status.accepted')}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">{t('jobDetailPage.applications.viewWorkspace')}</span>
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
