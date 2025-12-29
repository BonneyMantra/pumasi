'use client';

import Link from 'next/link';
import { Clock, User, ArrowRight, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dispute, DisputeStatus, DISPUTE_STATUS_LABELS } from '@/lib/types/dispute';
import { Job } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

interface DisputeCardProps {
  dispute: Dispute;
  job?: Job;
  isArbitratorView?: boolean;
}

function formatTimeRemaining(deadline: number, t: (key: string, params?: Record<string, any>) => string): string {
  const now = Date.now() / 1000;
  const remaining = deadline - now;

  if (remaining <= 0) return t('common.expired');

  const hours = Math.floor(remaining / 3600);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return t('disputeCard.daysRemaining', { days });
  }
  return t('disputeCard.hoursRemaining', { hours });
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

export function DisputeCard({ dispute, job, isArbitratorView = false }: DisputeCardProps) {
  const { t } = useTranslation();
  const deadline = dispute.status === 'evidence'
    ? dispute.evidenceDeadline
    : dispute.voteDeadline;

  return (
    <Card className="hover:border-sky/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t('disputes.disputeId', { id: dispute.id })}
          </CardTitle>
          <Badge variant={getStatusVariant(dispute.status)}>
            {DISPUTE_STATUS_LABELS[dispute.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {job && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('disputeCard.job')}: </span>
            <span className="font-medium">{job.title}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{dispute.client.slice(0, 8)}...</span>
            </div>
            <span className="text-muted-foreground">{t('disputeCard.vs')}</span>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{dispute.freelancer.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={dispute.status !== 'resolved' ? 'text-sky' : ''}>
            {formatTimeRemaining(deadline, t)}
          </span>
          {isArbitratorView && dispute.status === 'voting' && (
            <span className="text-muted-foreground">
              • {t('disputeCard.votesCount', { current: dispute.votes.length, total: 3 })}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link href={`/disputes/${dispute.id}`}>
            {isArbitratorView && dispute.status === 'voting' ? t('disputeCard.vote') : t('disputeCard.viewDetails')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
