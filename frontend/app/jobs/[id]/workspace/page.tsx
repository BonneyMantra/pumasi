'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  Lock,
  FileText,
  CheckCircle,
  Clock,
  Wallet,
  AlertTriangle,
  ExternalLink,
  Send,
  PartyPopper,
} from 'lucide-react';
import { formatEther } from 'viem';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/shared';
import { useJob } from '@/lib/hooks/use-jobs';
import { useJobApplications } from '@/lib/hooks/use-applications';
import { useSubmitDeliverable, useApproveDelivery, useAssignFreelancer, useJobEscrowBalance } from '@/lib/hooks/use-job-escrow';
import { JobStatus } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';
import { useAccount, useChainId } from '@/lib/web3';
import { getExplorerLink } from '@/lib/config/chains';
import { uploadDeliverableMetadata } from '@/lib/services/deliverable-metadata';
import { Textarea } from '@/components/ui/textarea';
import { useDemoData } from '@/lib/hooks/use-demo-data';

export default function WorkspacePage() {
  const params = useParams();
  const { t, locale } = useTranslation();
  const demoData = useDemoData();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const jobId = params.id as string;
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableDescription, setDeliverableDescription] = useState('');
  const [deliverableLinks, setDeliverableLinks] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.deliverable.title) {
      setDeliverableTitle(demoData.deliverable.title);
      setDeliverableDescription(demoData.deliverable.description);
      setDeliverableLinks(demoData.deliverable.links);
    }
  }, [demoData.deliverable.title, demoData.deliverable.description, demoData.deliverable.links]);

  const dateLocale = locale === 'ko' ? ko : enUS;

  const { job, isLoading: jobLoading, refetch: refetchJob } = useJob(jobId);
  const { applications, isLoading: appsLoading } = useJobApplications(jobId);

  // Read contract directly for immediate status updates
  const { status: contractStatus, refetch: refetchContract } = useJobEscrowBalance(jobId);

  // Optimistic status override after successful transactions
  const [optimisticStatus, setOptimisticStatus] = useState<JobStatus | null>(null);

  // Map contract status number to JobStatus string
  const mapContractStatus = (status: number | undefined): JobStatus | null => {
    if (status === undefined) return null;
    const statusMap: Record<number, JobStatus> = {
      0: 'open',
      1: 'in_progress',
      2: 'delivered',
      3: 'completed',
      4: 'disputed',
      5: 'cancelled',
    };
    return statusMap[status] ?? null;
  };

  // Effective status: optimistic > contract > subgraph
  const effectiveStatus = useMemo(() => {
    if (optimisticStatus) return optimisticStatus;
    const contractMapped = mapContractStatus(contractStatus);
    if (contractMapped) return contractMapped;
    return job?.status ?? 'open';
  }, [optimisticStatus, contractStatus, job?.status]);

  // Hooks for job actions
  const {
    submit: submitDeliverable,
    isSubmitting,
    isConfirming: isSubmitConfirming,
    isSuccess: isSubmitSuccess,
    txHash: submitTxHash,
    error: submitError,
  } = useSubmitDeliverable(jobId);

  const {
    approve: approveDelivery,
    isApproving,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    txHash: approveTxHash,
    error: approveError,
  } = useApproveDelivery(jobId);

  const acceptedApplication = useMemo(() => {
    return applications.find((app) => app.status === 'accepted');
  }, [applications]);

  // Hook to fix inconsistent state (accepted application but freelancer not assigned)
  const {
    assign: assignFreelancer,
    isAssigning,
    isConfirming: isAssignConfirming,
    isSuccess: isAssignSuccess,
    txHash: assignTxHash,
    error: assignError,
  } = useAssignFreelancer(jobId, acceptedApplication?.freelancer ?? '');

  // Detect inconsistent state: job is open but has accepted application
  const needsAssignment = useMemo(() => {
    return job?.status === 'open' && acceptedApplication && !job.freelancer;
  }, [job, acceptedApplication]);

  // Handle assign freelancer success
  useEffect(() => {
    if (isAssignSuccess && assignTxHash) {
      const explorerLink = chainId ? getExplorerLink(chainId, assignTxHash, 'tx') : null;
      toast.success(t('workspace.freelancerAssigned'), {
        action: explorerLink
          ? { label: t('common.viewTx'), onClick: () => window.open(explorerLink, '_blank') }
          : undefined,
        duration: 10000,
      });
      refetchJob();
    }
  }, [isAssignSuccess, assignTxHash, chainId, t, refetchJob]);

  useEffect(() => {
    if (assignError) toast.error(assignError);
  }, [assignError]);

  const handleAssignFreelancer = async () => {
    await assignFreelancer();
  };

  // Handle submit deliverable success
  useEffect(() => {
    if (isSubmitSuccess && submitTxHash) {
      const explorerLink = chainId ? getExplorerLink(chainId, submitTxHash, 'tx') : null;
      toast.success(t('workspace.deliverableSubmitted'), {
        action: explorerLink
          ? { label: t('common.viewTx'), onClick: () => window.open(explorerLink, '_blank') }
          : undefined,
        duration: 10000,
      });
      // Clear form
      setDeliverableTitle('');
      setDeliverableDescription('');
      setDeliverableLinks('');
      // Set optimistic status immediately
      setOptimisticStatus('delivered');
      // Refetch contract data (immediate) and subgraph (with delay)
      refetchContract();
      refetchJob();
      // Clear optimistic status after subgraph catches up (poll a few times)
      const pollInterval = setInterval(() => {
        refetchJob();
        refetchContract();
      }, 3000);
      setTimeout(() => {
        clearInterval(pollInterval);
        setOptimisticStatus(null);
      }, 15000);
    }
  }, [isSubmitSuccess, submitTxHash, chainId, t, refetchJob, refetchContract]);

  // Handle approve delivery success
  useEffect(() => {
    if (isApproveSuccess && approveTxHash) {
      const explorerLink = chainId ? getExplorerLink(chainId, approveTxHash, 'tx') : null;
      toast.success(t('workspace.deliveryApproved'), {
        action: explorerLink
          ? { label: t('common.viewTx'), onClick: () => window.open(explorerLink, '_blank') }
          : undefined,
        duration: 10000,
      });
      // Set optimistic status immediately
      setOptimisticStatus('completed');
      // Refetch contract data (immediate) and subgraph (with delay)
      refetchContract();
      refetchJob();
      // Clear optimistic status after subgraph catches up
      const pollInterval = setInterval(() => {
        refetchJob();
        refetchContract();
      }, 3000);
      setTimeout(() => {
        clearInterval(pollInterval);
        setOptimisticStatus(null);
      }, 15000);
    }
  }, [isApproveSuccess, approveTxHash, chainId, t, refetchJob, refetchContract]);

  // Handle errors
  useEffect(() => {
    if (submitError) toast.error(submitError);
  }, [submitError]);

  useEffect(() => {
    if (approveError) toast.error(approveError);
  }, [approveError]);

  const handleSubmitDeliverable = async () => {
    if (!deliverableTitle.trim()) {
      toast.error(t('workspace.deliverableTitleRequired'));
      return;
    }
    if (!deliverableDescription.trim()) {
      toast.error(t('workspace.deliverableDescriptionRequired'));
      return;
    }
    if (!address) {
      toast.error(t('workspace.connectWalletMessage'));
      return;
    }

    try {
      setIsUploading(true);

      // Parse links (comma or newline separated)
      const links = deliverableLinks
        .split(/[,\n]/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      // Upload metadata to IPFS
      const ipfsHash = await uploadDeliverableMetadata({
        title: deliverableTitle.trim(),
        description: deliverableDescription.trim(),
        links: links.length > 0 ? links : undefined,
        submittedAt: Math.floor(Date.now() / 1000),
        jobId,
        freelancer: address,
      });

      setIsUploading(false);

      // Submit to smart contract with IPFS URI
      await submitDeliverable(`ipfs://${ipfsHash}`);
    } catch (err) {
      setIsUploading(false);
      const message = err instanceof Error ? err.message : 'Failed to upload deliverable';
      toast.error(message);
    }
  };

  const handleApproveDelivery = async () => {
    await approveDelivery();
  };

  const accessCheck = useMemo(() => {
    if (!address || !job) {
      return { hasAccess: false, role: null, reason: 'loading' };
    }

    const isClient = address.toLowerCase() === job.client.toLowerCase();
    const isFreelancer =
      acceptedApplication &&
      address.toLowerCase() === acceptedApplication.freelancer.toLowerCase();

    if (isClient) return { hasAccess: true, role: 'client' as const, reason: null };
    if (isFreelancer) return { hasAccess: true, role: 'freelancer' as const, reason: null };
    return { hasAccess: false, role: null, reason: 'unauthorized' };
  }, [address, job, acceptedApplication]);

  const isLoading = jobLoading || appsLoading;

  if (isLoading) return <WorkspaceLoadingSkeleton />;

  if (!isConnected) {
    return (
      <AccessDenied
        title={t('workspace.connectWallet')}
        message={t('workspace.connectWalletMessage')}
        icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
        jobId={jobId}
      />
    );
  }

  if (!job) {
    return (
      <AccessDenied
        title={t('workspace.jobNotFound')}
        message={t('workspace.jobNotFoundMessage')}
        icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
        jobId={jobId}
      />
    );
  }

  if (!acceptedApplication) {
    return (
      <AccessDenied
        title={t('workspace.noFreelancer')}
        message={t('workspace.noFreelancerMessage')}
        icon={<Clock className="h-12 w-12 text-muted-foreground" />}
        jobId={jobId}
      />
    );
  }

  if (!accessCheck.hasAccess) {
    return (
      <AccessDenied
        title={t('workspace.accessDenied')}
        message={t('workspace.accessDeniedMessage')}
        icon={<Lock className="h-12 w-12 text-destructive" />}
        jobId={jobId}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/jobs/${jobId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t('workspace.title')}</h1>
          <p className="text-muted-foreground text-sm">
            {job.title} • {t(`workspace.role.${accessCheck.role}`)}
          </p>
        </div>
        <Badge variant="secondary">{t(`jobStatus.${effectiveStatus}`)}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('workspace.jobSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-sky" />
                <span className="font-medium">{formatEther(job.budget)} VERY</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {t('workspace.deadline')}: {format(job.deadline * 1000, 'PPP', { locale: dateLocale })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('workspace.participants')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar address={job.client} size="sm" showName linkToProfile />
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">{t('workspace.client')}</span>
                  {accessCheck.role === 'client' && (
                    <Badge variant="outline" className="text-xs">{t('workspace.you')}</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserAvatar address={acceptedApplication.freelancer} size="sm" showName linkToProfile />
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">{t('workspace.freelancer')}</span>
                  {accessCheck.role === 'freelancer' && (
                    <Badge variant="outline" className="text-xs">{t('workspace.you')}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Job Status Message */}
          <Card className={effectiveStatus === 'completed' ? 'border-green-500/50 bg-green-500/5' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {effectiveStatus === 'completed' ? (
                  <PartyPopper className="h-6 w-6 text-green-500" />
                ) : effectiveStatus === 'delivered' ? (
                  <FileText className="h-6 w-6 text-sky" />
                ) : (
                  <Clock className="h-6 w-6 text-muted-foreground" />
                )}
                <p className="text-sm">
                  {t(`workspace.jobStatus.${effectiveStatus}`)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fix Assignment: Client needs to assign freelancer (inconsistent state fix) */}
          {accessCheck.role === 'client' && needsAssignment && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {t('workspace.fixAssignmentTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('workspace.fixAssignmentDescription')}
                </p>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={handleAssignFreelancer}
                  disabled={isAssigning || isAssignConfirming}
                >
                  {isAssigning || isAssignConfirming
                    ? t('workspace.assigningFreelancer')
                    : t('workspace.fixAssignmentButton')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Freelancer: Submit Deliverable (when open or in_progress) */}
          {accessCheck.role === 'freelancer' && (effectiveStatus === 'in_progress' || effectiveStatus === 'open') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {t('workspace.submitDeliverableTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('workspace.submitDeliverableDescription')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="deliverableTitle">{t('workspace.deliverableTitleLabel')}</Label>
                  <Input
                    id="deliverableTitle"
                    placeholder={t('workspace.deliverableTitlePlaceholder')}
                    value={deliverableTitle}
                    onChange={(e) => setDeliverableTitle(e.target.value)}
                    disabled={isUploading || isSubmitting || isSubmitConfirming}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverableDescription">{t('workspace.deliverableDescriptionLabel')}</Label>
                  <Textarea
                    id="deliverableDescription"
                    placeholder={t('workspace.deliverableDescriptionPlaceholder')}
                    value={deliverableDescription}
                    onChange={(e) => setDeliverableDescription(e.target.value)}
                    disabled={isUploading || isSubmitting || isSubmitConfirming}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverableLinks">
                    {t('workspace.deliverableLinksLabel')}
                    <span className="text-muted-foreground ml-1 text-xs">({t('common.optional')})</span>
                  </Label>
                  <Textarea
                    id="deliverableLinks"
                    placeholder={t('workspace.deliverableLinksPlaceholder')}
                    value={deliverableLinks}
                    onChange={(e) => setDeliverableLinks(e.target.value)}
                    disabled={isUploading || isSubmitting || isSubmitConfirming}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">{t('workspace.deliverableLinksHint')}</p>
                </div>
                <Button
                  className="w-full bg-sky hover:bg-sky/90"
                  onClick={handleSubmitDeliverable}
                  disabled={isUploading || isSubmitting || isSubmitConfirming || !deliverableTitle.trim() || !deliverableDescription.trim()}
                >
                  {isUploading && t('workspace.uploadingToIPFS')}
                  {!isUploading && (isSubmitting || isSubmitConfirming) && t('workspace.submittingDeliverable')}
                  {!isUploading && !isSubmitting && !isSubmitConfirming && t('workspace.submitDeliverableButton')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Client: Approve Delivery (only when delivered) */}
          {accessCheck.role === 'client' && effectiveStatus === 'delivered' && (
            <Card className="border-sky/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t('workspace.approveDeliveryTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('workspace.approveDeliveryDescription')}
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleApproveDelivery}
                  disabled={isApproving || isApproveConfirming}
                >
                  {isApproving || isApproveConfirming
                    ? t('workspace.approvingDelivery')
                    : t('workspace.approveDeliveryButton')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Freelancer: Waiting for approval */}
          {accessCheck.role === 'freelancer' && effectiveStatus === 'delivered' && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Clock className="h-10 w-10 text-sky mx-auto mb-3" />
                <h3 className="font-medium mb-1">{t('workspace.submitWork')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t('workspace.jobStatus.delivered')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Client: Waiting for freelancer to submit (open or in_progress) */}
          {accessCheck.role === 'client' && (effectiveStatus === 'in_progress' || effectiveStatus === 'open') && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">{t('workspace.approveWork')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t(`workspace.jobStatus.${effectiveStatus}`)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Completed state */}
          {effectiveStatus === 'completed' && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="py-8 text-center">
                <PartyPopper className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h3 className="font-medium mb-1 text-green-600 dark:text-green-400">
                  {t('workspace.jobStatus.completed')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatEther(job.budget)} VERY
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AccessDenied({ title, message, icon, jobId }: {
  title: string; message: string; icon: React.ReactNode; jobId: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mb-4">{icon}</div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Link href={`/jobs/${jobId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('workspace.backToJob')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkspaceLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
