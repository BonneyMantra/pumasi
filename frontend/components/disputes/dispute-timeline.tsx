'use client';

import { CheckCircle, Clock, FileText, Gavel, AlertTriangle, Scale } from 'lucide-react';
import { ko, enUS } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dispute, VOTE_DECISION_LABELS } from '@/lib/types/dispute';
import { useTranslation } from '@/lib/i18n';

interface DisputeTimelineProps {
  dispute: Dispute;
}

interface TimelineEvent {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: number;
  completed: boolean;
}

function formatDate(timestamp: number, localeCode: string): string {
  return new Date(timestamp * 1000).toLocaleDateString(localeCode === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DisputeTimeline({ dispute }: DisputeTimelineProps) {
  const { t, locale } = useTranslation();

  const events: TimelineEvent[] = [
    {
      id: 'created',
      icon: <AlertTriangle className="h-4 w-4" />,
      title: t('disputeTimeline.created'),
      description: t('disputeTimeline.createdDescription'),
      timestamp: dispute.createdAt,
      completed: true,
    },
    {
      id: 'evidence_deadline',
      icon: <FileText className="h-4 w-4" />,
      title: t('disputeTimeline.evidenceDeadline'),
      description: dispute.status === 'evidence' ? t('disputeTimeline.evidenceInProgress') : t('disputeTimeline.evidenceCompleted'),
      timestamp: dispute.evidenceDeadline,
      completed: Date.now() / 1000 > dispute.evidenceDeadline,
    },
    {
      id: 'voting',
      icon: <Gavel className="h-4 w-4" />,
      title: t('disputeTimeline.voting'),
      description: t('disputeTimeline.votesCompleted', { count: dispute.votes.length }),
      timestamp: dispute.voteDeadline,
      completed: dispute.status === 'resolved',
    },
  ];

  if (dispute.resolution) {
    events.push({
      id: 'resolved',
      icon: <Scale className="h-4 w-4" />,
      title: t('disputeTimeline.resolved'),
      description: VOTE_DECISION_LABELS[dispute.resolution],
      timestamp: dispute.voteDeadline,
      completed: true,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5" />
          {t('disputeTimeline.title')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    event.completed
                      ? 'border-green bg-green/10 text-green'
                      : 'border-muted-foreground bg-muted text-muted-foreground'
                  }`}
                >
                  {event.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    event.icon
                  )}
                </div>
                {index < events.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 ${
                      event.completed ? 'bg-green' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{event.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.timestamp, locale)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
