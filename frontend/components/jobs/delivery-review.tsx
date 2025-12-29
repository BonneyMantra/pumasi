'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import {
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Image,
  FileArchive,
  FileCode,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RevisionRequest } from '@/components/jobs/revision-request';
import { useDeliveries, useApproveDelivery } from '@/lib/hooks/use-job-workflow';
import { useTranslation } from '@/lib/i18n';

interface DeliveryReviewProps {
  jobId: string;
}

export function DeliveryReview({ jobId }: DeliveryReviewProps) {
  const { t, locale } = useTranslation();
  const { deliveries, isLoading } = useDeliveries(jobId);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const { approve, isApproving } = useApproveDelivery(jobId);

  if (isLoading) return <DeliveryReviewSkeleton />;

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{t('deliveryReview.noDeliveries')}</h3>
          <p className="text-muted-foreground">{t('deliveryReview.noDeliveriesDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = async (deliveryId: string) => {
    await approve(deliveryId);
  };

  const handleRequestRevision = (deliveryId: string) => {
    setSelectedDeliveryId(deliveryId);
    setShowRevisionModal(true);
  };

  return (
    <>
      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('deliveryReview.deliveryTitle', { id: delivery.id })}</CardTitle>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <CardDescription>
                {t('deliveryReview.submittedOn', { date: format(delivery.submittedAt * 1000, locale === 'ko' ? 'yyyy년 M월 d일 HH:mm' : 'MMM d, yyyy HH:mm', { locale: locale === 'ko' ? ko : enUS }) })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">{t('deliveryReview.descriptionLabel')}</h4>
                <p className="text-muted-foreground">{delivery.description}</p>
              </div>

              {delivery.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('deliveryReview.freelancerNotes')}</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {delivery.notes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">{t('deliveryReview.attachedFiles')}</h4>
                <div className="space-y-2">
                  {delivery.fileURIs.map((uri, index) => (
                    <FilePreview key={index} uri={uri} index={index} />
                  ))}
                </div>
              </div>

              {delivery.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    className="flex-1 bg-green hover:bg-green/90 text-black"
                    onClick={() => handleApprove(delivery.id)}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t('deliveryReview.approve')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRequestRevision(delivery.id)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {t('deliveryReview.requestRevision')}
                  </Button>
                </div>
              )}

              {delivery.status === 'revision_requested' && delivery.revisionReason && (
                <div className="bg-yellow/10 border border-yellow rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow" />
                    {t('deliveryReview.revisionRequested')}
                  </h4>
                  <p className="text-sm text-muted-foreground">{delivery.revisionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <RevisionRequest
        open={showRevisionModal}
        onOpenChange={setShowRevisionModal}
        jobId={jobId}
        deliveryId={selectedDeliveryId || ''}
      />
    </>
  );
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config = {
    pending: { labelKey: 'deliveryReview.status.pending', variant: 'outline' as const },
    approved: { labelKey: 'deliveryReview.status.approved', variant: 'default' as const },
    revision_requested: { labelKey: 'deliveryReview.status.revisionRequested', variant: 'secondary' as const },
  };

  const { labelKey, variant } = config[status as keyof typeof config] || config.pending;

  return <Badge variant={variant}>{t(labelKey)}</Badge>;
}

function FilePreview({ uri, index }: { uri: string; index: number }) {
  const { t } = useTranslation();
  const fileName = t('deliveryReview.fileNumber', { number: index + 1 });
  const ipfsUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');

  const getFileIcon = () => {
    // In real app, detect file type from URI or metadata
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-3">
        {getFileIcon()}
        <span className="text-sm font-medium">{fileName}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={ipfsUrl} download>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function DeliveryReviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
