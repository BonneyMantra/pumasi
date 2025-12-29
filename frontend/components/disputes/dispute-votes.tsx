'use client';

import { Gavel, User } from 'lucide-react';
import { ko, enUS } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dispute, VoteDecision, VOTE_DECISION_LABELS } from '@/lib/types/dispute';
import { useTranslation } from '@/lib/i18n';

interface DisputeVotesProps {
  dispute: Dispute;
}

function formatDate(timestamp: number, localeCode: string): string {
  return new Date(timestamp * 1000).toLocaleDateString(localeCode === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDecisionColor(decision: VoteDecision): string {
  switch (decision) {
    case 'full_to_client':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'full_to_freelancer':
      return 'bg-green/10 text-green border-green/20';
    case 'split':
      return 'bg-yellow/10 text-yellow border-yellow/20';
  }
}

export function DisputeVotes({ dispute }: DisputeVotesProps) {
  const { t, locale } = useTranslation();
  const requiredVotes = 3;
  const currentVotes = dispute.votes.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gavel className="h-5 w-5" />
            {t('disputeVotes.title')}
          </CardTitle>
          <Badge variant="outline">
            {currentVotes}/{requiredVotes}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {dispute.votes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('disputeVotes.noVotes')}
          </p>
        ) : (
          dispute.votes.map((vote, index) => (
            <div key={vote.arbitrator}>
              {index > 0 && <Separator className="my-3" />}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {vote.arbitrator.slice(0, 10)}...
                    </span>
                  </div>
                  <Badge className={getDecisionColor(vote.decision)} variant="outline">
                    {VOTE_DECISION_LABELS[vote.decision]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{vote.rationale}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(vote.timestamp, locale)}
                </p>
              </div>
            </div>
          ))
        )}

        {dispute.resolution && (
          <>
            <Separator />
            <div className="bg-muted/50 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-1">{t('disputeVotes.finalDecision')}</h4>
              <Badge className={getDecisionColor(dispute.resolution)}>
                {VOTE_DECISION_LABELS[dispute.resolution]}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
