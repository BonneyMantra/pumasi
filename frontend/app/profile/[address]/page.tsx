'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from '@/lib/web3';
import { useProfile, useUserReviews } from '@/lib/hooks/use-profile';
import { useProfileMetadata } from '@/lib/hooks/use-profile-metadata';
import { useMyJobs, useMyCompletedJobs } from '@/lib/hooks/use-jobs';
import { useTranslation } from '@/lib/i18n';
import {
  ProfileHeader,
  ProfileHeaderSkeleton,
  ProfileStats,
  ProfileStatsSkeleton,
  ReviewsSection,
  ReviewsSectionSkeleton,
  ProfileJobsTab,
  EditProfileDialog,
} from '@/components/profile';

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const { address: connectedAddress } = useAccount();
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isOwnProfile =
    connectedAddress?.toLowerCase() === address.toLowerCase();

  const { profile, isLoading: profileLoading } = useProfile(address);
  const { metadata, saveProfile, isSaving } = useProfileMetadata(
    isOwnProfile ? connectedAddress : undefined
  );
  const { reviews, isLoading: reviewsLoading } = useUserReviews(address);
  const { jobs: postedJobs, isLoading: postedLoading } = useMyJobs(address);
  const { jobs: completedJobs, isLoading: completedLoading } =
    useMyCompletedJobs(address);

  if (profileLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
        <ProfileHeaderSkeleton />
        <ProfileStatsSkeleton />
        <ReviewsSectionSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">{t('profilePage.notFound')}</h1>
          <p className="text-muted-foreground">
            {t('profilePage.checkAddress', { address })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      <ProfileHeader
        profile={profile}
        metadata={metadata}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setEditDialogOpen(true)}
      />
      <ProfileStats profile={profile} />

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">
            {t('profilePage.tabs.reviews', { count: reviews.length })}
          </TabsTrigger>
          <TabsTrigger value="posted">
            {t('profilePage.tabs.posted', { count: postedJobs.length })}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('profilePage.tabs.completed', { count: completedJobs.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <ReviewsSection reviews={reviews} isLoading={reviewsLoading} />
        </TabsContent>

        <TabsContent value="posted" className="mt-6">
          <ProfileJobsTab
            jobs={postedJobs}
            isLoading={postedLoading}
            emptyMessage={t('profilePage.noPostedJobs')}
            currentUserAddress={connectedAddress}
            onApply={(jobId) => {
              window.location.href = `/jobs/${jobId}?apply=true`;
            }}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <ProfileJobsTab
            jobs={completedJobs}
            isLoading={completedLoading}
            emptyMessage={t('profilePage.noCompletedJobs')}
            currentUserAddress={connectedAddress}
            onApply={(jobId) => {
              window.location.href = `/jobs/${jobId}?apply=true`;
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          metadata={metadata}
          onSave={saveProfile}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
