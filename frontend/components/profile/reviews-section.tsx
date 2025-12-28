'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Review } from '@/lib/types/profile';
import { useTranslation } from '@/lib/i18n';

interface ReviewsSectionProps {
  reviews: Review[];
  isLoading?: boolean;
}

interface ReviewItemProps {
  review: Review;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review }: ReviewItemProps) {
  const { locale } = useTranslation();
  const reviewDate = new Date(review.createdAt * 1000);
  const dateLocale = locale === 'ko' ? ko : enUS;

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm">
            {review.reviewer.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
              </span>
              <StarRating rating={review.rating} />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(reviewDate, { locale: dateLocale, addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-foreground">{review.comment}</p>

          <Link
            href={`/jobs/${review.jobId}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-sky transition-colors"
          >
            {review.jobTitle}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection({ reviews, isLoading }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();
  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);
  const hasMore = reviews.length > 5;

  if (isLoading) {
    return <ReviewsSectionSkeleton />;
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('profile.reviews.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t('profile.reviews.noReviews')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('profile.reviews.title')} ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {displayedReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? t('profile.reviews.showLess') : t('profile.reviews.showMore', { count: reviews.length - 5 })}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewsSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="py-4 border-b border-border last:border-0">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
