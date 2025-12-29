'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShinroeScore,
  ShinroeTier,
  SHINROE_TIER_LABELS,
  SHINROE_TIER_COLORS,
  SHINROE_TIER_ICONS,
} from '@/lib/types/shinroe';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface ScoreBadgeProps {
  score: ShinroeScore;
  variant?: 'small' | 'large';
  showLink?: boolean;
  className?: string;
}

const SHINROE_BASE_URL = 'https://shinroe.verychain.io';

export function ScoreBadge({
  score,
  variant = 'small',
  showLink = true,
  className,
}: ScoreBadgeProps) {
  const { t, locale } = useTranslation();
  const tierColor = SHINROE_TIER_COLORS[score.tier];
  const tierLabel = SHINROE_TIER_LABELS[score.tier];
  const tierIcon = SHINROE_TIER_ICONS[score.tier];

  const content = (
    <Badge
      variant="outline"
      className={cn(
        tierColor,
        'cursor-pointer hover:opacity-80 transition',
        variant === 'large' && 'text-base px-3 py-1',
        className
      )}
    >
      <span className="mr-1">{tierIcon}</span>
      {variant === 'large' ? (
        <>
          {tierLabel} ({t('scoreBadge.points', { score: score.score })})
        </>
      ) : (
        <>{score.score}</>
      )}
      {showLink && <ExternalLink className="h-3 w-3 ml-1" />}
    </Badge>
  );

  const dateLocale = locale === 'ko' ? ko : enUS;
  const lastUpdatedDate = score.lastUpdated > 0
    ? format(new Date(score.lastUpdated * 1000), 'PPP', { locale: dateLocale })
    : '';

  const tooltipContent = (
    <div className="space-y-2 text-sm">
      <div className="font-semibold">
        {t('scoreBadge.tier', { tier: tierLabel, score: score.score })}
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div>{t('scoreBadge.endorsements', { count: score.endorsements })}</div>
        <div>{t('scoreBadge.airdrops', { count: score.airdropsReceived })}</div>
        {score.lastUpdated > 0 && (
          <div>
            {t('scoreBadge.lastUpdated', { date: lastUpdatedDate })}
          </div>
        )}
      </div>
      {showLink && (
        <div className="text-xs text-sky mt-2">{t('scoreBadge.clickToView')}</div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`${SHINROE_BASE_URL}/profile/${score.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </Link>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ScoreBadgeSkeleton({
  variant = 'small',
}: {
  variant?: 'small' | 'large';
}) {
  return (
    <Skeleton
      className={cn('rounded-full', variant === 'large' ? 'h-8 w-28' : 'h-5 w-16')}
    />
  );
}

