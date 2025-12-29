'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReviewFormData } from '@/lib/types/profile';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface ReviewFormProps {
  jobId: string;
  jobTitle: string;
  revieweeAddress: string;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
}

interface StarSelectorProps {
  rating: number;
  onChange: (rating: number) => void;
}

function StarSelector({ rating, onChange }: StarSelectorProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hovered ?? rating);

        return (
          <button
            key={i}
            type="button"
            className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-coral rounded"
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(starValue)}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                isFilled
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-muted-foreground hover:text-yellow-400'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewForm({
  jobId,
  jobTitle,
  revieweeAddress,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.review.comment) {
      setRating(demoData.review.rating);
      setComment(demoData.review.comment);
    }
  }, [demoData.review.comment, demoData.review.rating]);

  const RATING_LABELS: Record<number, string> = {
    1: t('reviewForm.ratings.poor'),
    2: t('reviewForm.ratings.fair'),
    3: t('reviewForm.ratings.good'),
    4: t('reviewForm.ratings.veryGood'),
    5: t('reviewForm.ratings.excellent'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = rating > 0 && comment.trim().length >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('reviewForm.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('reviewForm.description', { jobTitle })}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>{t('reviewForm.rating')}</Label>
            <div className="flex items-center gap-4">
              <StarSelector rating={rating} onChange={setRating} />
              {rating > 0 && (
                <span className="text-sm text-muted-foreground">
                  {RATING_LABELS[rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">{t('reviewForm.comment')}</Label>
            <Textarea
              id="comment"
              placeholder={t('reviewForm.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Reviewee Info */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">{t('reviewForm.reviewee')} </span>
            <span className="font-mono">
              {revieweeAddress.slice(0, 6)}...{revieweeAddress.slice(-4)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              className="bg-sky hover:bg-sky/90"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? t('reviewForm.submitting') : t('reviewForm.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
