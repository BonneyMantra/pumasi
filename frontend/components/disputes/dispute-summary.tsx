'use client';

import { Clock, User, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dispute, DisputeStatus } from '@/lib/types/dispute';
import { Job } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

interface DisputeSummaryProps {
  dispute: Dispute;
  job: Job;
}

function getStatusVariant(status: DisputeStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'evidence':
      return 'destructive';
    case 'voting':
      return 'secondary';
    case 'resolved':
      return 'default';
  }
}

function getStatusIcon(status: DisputeStatus) {
  switch (status) {
    case 'evidence':
      return <FileText className="h-4 w-4" />;
    case 'voting':
      return <AlertTriangle className="h-4 w-4" />;
    case 'resolved':
      return <CheckCircle className="h-4 w-4" />;
  }
}

export function DisputeSummary({ dispute, job }: DisputeSummaryProps) {
  const { t, locale } = useTranslation();

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('disputes.disputeId', { id: dispute.id })}
          </CardTitle>
          <Badge variant={getStatusVariant(dispute.status)}>
            {getStatusIcon(dispute.status)}
            <span className="ml-1">{t(`disputeStatus.${dispute.status}`)}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Job Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{t('jobDetail.relatedJob')}</h4>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {job.description}
            </p>
          </div>
        </div>

        <Separator />

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{t('disputes.client')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-mono text-xs">{dispute.client.slice(0, 12)}...</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{t('disputes.freelancer')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-mono text-xs">{dispute.freelancer.slice(0, 12)}...</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Deadlines */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{t('disputes.evidenceDeadline')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{formatDate(dispute.evidenceDeadline)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{t('disputes.votingDeadline')}</h4>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{formatDate(dispute.voteDeadline)}</span>
            </div>
          </div>
        </div>

        {/* Created At */}
        <div className="text-xs text-muted-foreground">
          {t('disputes.createdAt', { date: formatDate(dispute.createdAt) })}
        </div>
      </CardContent>
    </Card>
  );
}
