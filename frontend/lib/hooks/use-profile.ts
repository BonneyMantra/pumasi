'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, Review, ReviewFormData } from '@/lib/types/profile';
import { querySubgraph, fetchIPFSMetadata } from '@/lib/graphql/client';
import {
  USER_PROFILE_QUERY,
  REVIEWS_BY_REVIEWEE_QUERY,
  UserResult,
  ReviewResult,
} from '@/lib/graphql/queries/pumasi-queries';

interface UseProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseUserReviewsResult {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseSubmitReviewResult {
  submitReview: (data: ReviewFormData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

// Transform subgraph user to app UserProfile type
function transformUserProfile(result: UserResult, jobsAsClient: number, jobsAsFreelancer: number): UserProfile {
  return {
    address: result.id,
    averageRating: parseFloat(result.averageRating || '0'),
    totalReviews: result.totalJobsCompleted,
    jobsCompleted: jobsAsFreelancer,
    jobsPosted: jobsAsClient,
    totalEarnings: BigInt(result.totalEarnings || '0'),
    isArbitrator: result.isArbitrator,
    arbitratorStake: result.arbitratorStake ? BigInt(result.arbitratorStake) : undefined,
    memberSince: result.profileCreatedAt ? parseInt(result.profileCreatedAt) : Math.floor(Date.now() / 1000)
  };
}

// Transform subgraph review to app Review type
async function transformReview(result: ReviewResult): Promise<Review> {
  const metadata = await fetchIPFSMetadata<{ comment: string }>(result.commentURI);

  return {
    id: result.id,
    jobId: result.job.id,
    jobTitle: '', // TODO: fetch from job metadata
    reviewer: result.reviewer.id,
    reviewee: result.reviewee.id,
    rating: result.rating,
    comment: metadata?.comment || '',
    createdAt: parseInt(result.createdAt),
  };
}

/**
 * Hook to fetch user profile by address
 */
export function useProfile(address: string): UseProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchProfile() {
      if (!address) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        interface ProfileResponse {
          user: (UserResult & {
            jobsAsClient: Array<{ id: string }>;
            jobsAsFreelancer: Array<{ id: string }>;
          }) | null;
        }

        const data = await querySubgraph<ProfileResponse>(USER_PROFILE_QUERY, {
          id: address.toLowerCase(),
          jobsFirst: 25,
          reviewsFirst: 25,
        });

        if (data.user) {
          const transformed = transformUserProfile(
            data.user,
            data.user.jobsAsClient?.length || 0,
            data.user.jobsAsFreelancer?.length || 0
          );
          setProfile(transformed);
        } else {
          // Return a default profile for unknown addresses
          setProfile({
            address,
            averageRating: 0,
            totalReviews: 0,
            jobsCompleted: 0,
            jobsPosted: 0,
            totalEarnings: BigInt(0),
            isArbitrator: false,
            memberSince: Math.floor(Date.now() / 1000),
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        // Still return a default profile on error
        setProfile({
          address,
          averageRating: 0,
          totalReviews: 0,
          jobsCompleted: 0,
          jobsPosted: 0,
          totalEarnings: BigInt(0),
          isArbitrator: false,
          memberSince: Math.floor(Date.now() / 1000),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [address, refreshKey]);

  return { profile, isLoading, error, refetch };
}

/**
 * Hook to fetch reviews for a user
 */
export function useUserReviews(address: string): UseUserReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchReviews() {
      if (!address) {
        setReviews([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{ reviews: ReviewResult[] }>(
          REVIEWS_BY_REVIEWEE_QUERY,
          { reviewee: address.toLowerCase(), first: 25, skip: 0 }
        );

        const transformed = await Promise.all(data.reviews.map(transformReview));
        setReviews(transformed);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [address, refreshKey]);

  return { reviews, isLoading, error, refetch };
}

/**
 * Hook to submit a review for a completed job
 * TODO: Connect to smart contract when deployed
 */
export function useSubmitReview(jobId: string): UseSubmitReviewResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = useCallback(
    async (data: ReviewFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // TODO: Replace with actual contract call
        // const tx = await contract.submitReview(jobId, data.rating, data.comment);
        // await tx.wait();

        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Review submitted:', { jobId, ...data });
      } catch (err) {
        console.error('Failed to submit review:', err);
        setError(err instanceof Error ? err.message : 'Failed to submit review');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [jobId]
  );

  return { submitReview, isSubmitting, error };
}
