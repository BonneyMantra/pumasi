'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Check, Clock, ExternalLink, User, X } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreBadge, ScoreBadgeSkeleton } from '@/components/shinroe';
import { Application, APPLICATION_STATUS_VARIANT } from '@/lib/types/application';
import { ShinroeScore } from '@/lib/types/shinroe';
import { useTranslation } from '@/lib/i18n';
import { useApplicationLabels } from '@/lib/hooks/use-translated-labels';

interface ApplicationCardProps {
  application: Application;
  freelancerScore?: ShinroeScore | null;
  freelancerScoreLoading?: boolean;
  isClient?: boolean;
  onAccept?: (applicationId: string) => void;
  onReject?: (applicationId: string) => void;
}

export function ApplicationCard({
  application,
  freelancerScore,
  freelancerScoreLoading,
  isClient = false,
  onAccept,
  onReject,
}: ApplicationCardProps) {
  const isPending = application.status === 'pending';
  const { t, locale } = useTranslation();
  const { statusLabels } = useApplicationLabels();
  const dateLocale = locale === 'ko' ? ko : enUS;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-mono text-sm">
                {application.freelancer.slice(0, 6)}...{application.freelancer.slice(-4)}
              </p>
              <div className="mt-1">
                {freelancerScoreLoading ? (
                  <ScoreBadgeSkeleton />
                ) : freelancerScore ? (
                  <ScoreBadge score={freelancerScore} />
                ) : null}
              </div>
            </div>
          </div>
          <Badge variant={APPLICATION_STATUS_VARIANT[application.status]}>
            {statusLabels[application.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Cover Letter Preview */}
        <div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {application.coverLetter || t('applicationCard.noCoverLetter')}
          </p>
        </div>

        {/* Timeline */}
        {application.proposedTimeline && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-sky shrink-0" />
            <span>{application.proposedTimeline}</span>
          </div>
        )}

        {/* Portfolio Links */}
        {application.portfolioLinks && application.portfolioLinks.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {t('applicationCard.portfolioCount', { count: application.portfolioLinks.length })}
            </span>
          </div>
        )}

        {/* Application Time */}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(application.createdAt * 1000, {
            locale: dateLocale,
            addSuffix: true,
          })}
        </p>
      </CardContent>

      {isClient && isPending && (
        <CardFooter className="pt-4 border-t border-border gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onReject?.(application.id)}
          >
            <X className="h-4 w-4 mr-2" />
            {t('applicationCard.reject')}
          </Button>
          <Button
            className="flex-1 bg-sky hover:bg-sky/90"
            onClick={() => onAccept?.(application.id)}
          >
            <Check className="h-4 w-4 mr-2" />
            {t('applicationCard.hire')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function ApplicationCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
