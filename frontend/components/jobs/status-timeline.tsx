'use client';

import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import {
  PlusCircle,
  UserCheck,
  Play,
  Upload,
  CheckCircle,
  RotateCcw,
  Flag,
  AlertTriangle,
  XCircle,
  User,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobTimeline } from '@/lib/hooks/use-job-workflow';
import { JobEvent, JobTimelineEvent } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

interface StatusTimelineProps {
  jobId: string;
}

const EVENT_CONFIG: Record<
  JobEvent,
  { labelKey: string; icon: React.ElementType; color: string }
> = {
  created: {
    labelKey: 'statusTimeline.events.created',
    icon: PlusCircle,
    color: 'bg-violet',
  },
  freelancer_assigned: {
    labelKey: 'statusTimeline.events.freelancerAssigned',
    icon: UserCheck,
    color: 'bg-sky',
  },
  work_started: {
    labelKey: 'statusTimeline.events.workStarted',
    icon: Play,
    color: 'bg-violet',
  },
  delivery_submitted: {
    labelKey: 'statusTimeline.events.deliverySubmitted',
    icon: Upload,
    color: 'bg-sky',
  },
  delivery_approved: {
    labelKey: 'statusTimeline.events.deliveryApproved',
    icon: CheckCircle,
    color: 'bg-green',
  },
  revision_requested: {
    labelKey: 'statusTimeline.events.revisionRequested',
    icon: RotateCcw,
    color: 'bg-yellow',
  },
  completed: {
    labelKey: 'statusTimeline.events.completed',
    icon: Flag,
    color: 'bg-green',
  },
  disputed: {
    labelKey: 'statusTimeline.events.disputed',
    icon: AlertTriangle,
    color: 'bg-destructive',
  },
  cancelled: {
    labelKey: 'statusTimeline.events.cancelled',
    icon: XCircle,
    color: 'bg-muted',
  },
};

export function StatusTimeline({ jobId }: StatusTimelineProps) {
  const { t } = useTranslation();
  const { events, isLoading } = useJobTimeline(jobId);

  if (isLoading) return <StatusTimelineSkeleton />;

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('statusTimeline.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">{t('statusTimeline.noEvents')}</p>
        </CardContent>
      </Card>
    );
  }

  // Sort events by timestamp (newest first for display)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('statusTimeline.timelineTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {sortedEvents.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLast={index === sortedEvents.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({
  event,
  isLast,
}: {
  event: JobTimelineEvent;
  isLast: boolean;
}) {
  const { t, locale } = useTranslation();
  const config = EVENT_CONFIG[event.event];
  const Icon = config.icon;
  const eventDate = new Date(event.timestamp * 1000);

  return (
    <div className="relative pb-6">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-4 top-10 w-0.5 h-[calc(100%-2rem)] bg-border" />
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${config.color}`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{t(config.labelKey)}</p>
              {event.metadata?.milestoneId && (
                <p className="text-sm text-muted-foreground">
                  {t('statusTimeline.milestone', { id: event.metadata.milestoneId })}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {format(eventDate, locale === 'ko' ? 'M월 d일 HH:mm' : 'MMM d, HH:mm', { locale: locale === 'ko' ? ko : enUS })}
            </p>
          </div>

          {/* Actor info */}
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-mono text-muted-foreground">
              {event.actor.slice(0, 6)}...{event.actor.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTimelineSkeleton() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
