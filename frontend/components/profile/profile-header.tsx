'use client';

import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Copy, Check, Star, Shield, Edit, MapPin, Globe, Clock, MessageCircle } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreBadge, ScoreBadgeSkeleton } from '@/components/shinroe';
import { UserProfile, ProfileMetadata } from '@/lib/types/profile';
import { ShinroeScore } from '@/lib/types/shinroe';
import { useTranslation } from '@/lib/i18n';
import { ipfsToHttp } from '@/lib/web3/ipfs';

interface ProfileHeaderProps {
  profile: UserProfile;
  metadata?: ProfileMetadata | null;
  shinroeScore?: ShinroeScore | null;
  shinroeScoreLoading?: boolean;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
}

export function ProfileHeader({
  profile,
  metadata,
  shinroeScore,
  shinroeScoreLoading,
  isOwnProfile,
  onEditClick,
}: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { t, locale } = useTranslation();
  const memberSinceDate = new Date(profile.memberSince * 1000);
  const dateLocale = locale === 'ko' ? ko : enUS;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = locale === 'ko'
    ? format(memberSinceDate, 'yyyy년 MM월 dd일', { locale: dateLocale })
    : format(memberSinceDate, 'MMMM d, yyyy', { locale: dateLocale });

  const avatarUrl = metadata?.avatarHash ? ipfsToHttp(metadata.avatarHash) : null;
  const coverUrl = metadata?.coverImageHash ? ipfsToHttp(metadata.coverImageHash) : null;
  const displayName = metadata?.displayName || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;

  const availabilityColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    unavailable: 'bg-red-500',
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Cover Image */}
      <div
        className="h-32 md:h-40 bg-gradient-to-r from-sky/20 to-sky/5 relative"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {isOwnProfile && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3 gap-2"
            onClick={onEditClick}
          >
            <Edit className="h-4 w-4" />
            {t('profile.editProfile')}
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar - overlapping cover */}
        <div className="-mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-2xl bg-sky/20 text-sky">
              {profile.address.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Profile Info */}
          <div className="flex-1 space-y-3">
            {/* Name and Title */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{displayName}</h1>
                {metadata?.availability && (
                  <span className={`h-2.5 w-2.5 rounded-full ${availabilityColors[metadata.availability]}`} />
                )}
              </div>
              {metadata?.title && (
                <p className="text-muted-foreground">{metadata.title}</p>
              )}
            </div>

            {/* Address */}
            <div className="flex items-center gap-2">
              <code className="text-sm text-muted-foreground">
                {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
              </code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>

            {/* Bio */}
            {metadata?.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{metadata.bio}</p>
            )}

            {/* Meta info row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {metadata?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {metadata.location}
                </span>
              )}
              {metadata?.website && (
                <a href={metadata.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t('profile.memberSince', { date: formattedDate })}
              </span>
            </div>

            {/* Skills */}
            {metadata?.skills && metadata.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {metadata.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
                {metadata.skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">+{metadata.skills.length - 5}</Badge>
                )}
              </div>
            )}
          </div>

          {/* Badges Column */}
          <div className="flex flex-col gap-2 md:items-end">
            {shinroeScoreLoading ? (
              <ScoreBadgeSkeleton variant="large" />
            ) : shinroeScore ? (
              <ScoreBadge score={shinroeScore} variant="large" />
            ) : null}

            {metadata?.verychatVerified && metadata?.verychatHandle && (
              <Badge variant="outline" className="gap-1 w-fit border-sky/50 text-sky">
                <MessageCircle className="h-3 w-3" />
                @{metadata.verychatHandle}
              </Badge>
            )}

            {profile.isArbitrator && (
              <Badge variant="outline" className="gap-1 w-fit">
                <Shield className="h-3 w-3" />
                {t('profile.arbitrator')}
              </Badge>
            )}

            <Badge variant="secondary" className="gap-1 w-fit">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {profile.averageRating.toFixed(1)} ({profile.totalReviews})
            </Badge>

            {metadata?.hourlyRate && (
              <span className="text-sm font-medium">${metadata.hourlyRate}/hr</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Skeleton className="h-32 md:h-40" />
      <div className="px-6 pb-6">
        <div className="-mt-12 mb-4">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
