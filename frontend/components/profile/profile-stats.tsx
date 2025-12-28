'use client';

import { Briefcase, Wallet, Star, FileText } from 'lucide-react';
import { formatEther } from 'viem';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/lib/types/profile';
import { useTranslation } from '@/lib/i18n';

interface ProfileStatsProps {
  profile: UserProfile;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
}

function StatCard({ icon, label, value, subValue }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="p-2 bg-sky/10 rounded-lg text-sky">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
          {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const { t, locale } = useTranslation();
  const formattedEarnings = parseFloat(formatEther(profile.totalEarnings)).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Briefcase className="h-5 w-5" />}
        label={t('profile.stats.jobsCompleted')}
        value={profile.jobsCompleted}
      />
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        label={t('profile.stats.jobsPosted')}
        value={profile.jobsPosted}
      />
      <StatCard
        icon={<Wallet className="h-5 w-5" />}
        label={t('profile.stats.totalEarned')}
        value={`${formattedEarnings}`}
        subValue="VERY"
      />
      <StatCard
        icon={<Star className="h-5 w-5" />}
        label={t('profile.stats.averageRating')}
        value={profile.averageRating.toFixed(1)}
        subValue={t('profile.stats.reviewCount', { count: profile.totalReviews })}
      />
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
