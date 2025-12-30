'use client';

import { useState, useEffect, useCallback } from 'react';
import { Job, JobFilters, JobCategory, JobStatus } from '@/lib/types/job';
import { Application } from '@/lib/types/application';
import { querySubgraph, fetchIPFSMetadata } from '@/lib/graphql/client';
import {
  JOBS_QUERY,
  JOBS_BY_STATUS_QUERY,
  OPEN_JOBS_QUERY,
  JOB_BY_ID_QUERY,
  JOBS_BY_CLIENT_QUERY,
  JOBS_BY_FREELANCER_QUERY,
  APPLICATIONS_BY_JOB_QUERY,
  JobsResponse,
  JobResult,
  ApplicationsResponse,
} from '@/lib/graphql/queries/pumasi-queries';

interface JobMetadata {
  title: string;
  description: string;
  category: JobCategory;
}

interface UseJobsResult {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
}

interface UseJobResult {
  job: Job | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseJobApplicationsResult {
  applications: Application[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Map subgraph status to app status
function mapStatus(status: string): JobStatus {
  const statusMap: Record<string, JobStatus> = {
    Open: 'open',
    InProgress: 'in_progress',
    Delivered: 'delivered',
    Completed: 'completed',
    Disputed: 'disputed',
    Cancelled: 'cancelled',
  };
  return statusMap[status] || 'open';
}

/**
 * Check if job has an accepted application
 */
function hasAcceptedApplication(applications?: { id: string; status?: string }[]): boolean {
  if (!applications) return false;
  return applications.some((app) => app.status?.toLowerCase() === 'accepted');
}

/**
 * Compute effective status: if job has freelancer or accepted application but status is 'open', show as 'in_progress'
 */
function computeEffectiveJobStatus(
  status: JobStatus,
  hasFreelancer: boolean,
  applications?: { id: string; status?: string }[]
): JobStatus {
  // If job is open but has a freelancer assigned OR has an accepted application, it's in progress
  if (status === 'open' && (hasFreelancer || hasAcceptedApplication(applications))) {
    return 'in_progress';
  }
  return status;
}

// Transform subgraph job to app Job type
async function transformJob(result: JobResult): Promise<Job> {
  const metadata = await fetchIPFSMetadata<JobMetadata>(result.metadataURI);
  const rawStatus = mapStatus(result.status);
  const hasFreelancer = !!result.freelancer?.id;
  const effectiveStatus = computeEffectiveJobStatus(rawStatus, hasFreelancer, result.applications);

  return {
    id: result.id,
    client: result.client?.id || '',
    freelancer: result.freelancer?.id,
    title: metadata?.title || `Job #${result.id}`,
    description: metadata?.description || '',
    category: metadata?.category || 'misc',
    budget: BigInt(result.budget),
    deadline: parseInt(result.deadline),
    status: effectiveStatus,
    metadataURI: result.metadataURI,
    createdAt: parseInt(result.createdAt),
    applicationCount: result.applications?.length || 0,
  };
}

/**
 * Hook to fetch jobs list with optional filters
 */
export function useJobs(filters?: JobFilters): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      setError(null);

      try {
        // Select query based on whether status filter is provided
        // Reduced from 100 to 25 for better performance
        let query = JOBS_QUERY;
        let variables: Record<string, unknown> = { first: 25, skip: 0 };

        if (filters?.status?.length) {
          if (filters.status.includes('open')) {
            query = OPEN_JOBS_QUERY;
          } else {
            query = JOBS_BY_STATUS_QUERY;
            // Map frontend status to subgraph enum format
            const statusMap: Record<string, string> = {
              open: 'Open',
              in_progress: 'InProgress',
              delivered: 'Delivered',
              completed: 'Completed',
              disputed: 'Disputed',
              cancelled: 'Cancelled',
            };
            variables.status = statusMap[filters.status[0]] || filters.status[0];
          }
        }

        const data = await querySubgraph<JobsResponse>(query, variables);
        const transformedJobs = await Promise.all(data.jobs.map(transformJob));

        // Apply client-side filters
        let result = transformedJobs;

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          result = result.filter(
            (job) =>
              job.title.toLowerCase().includes(searchLower) ||
              job.description.toLowerCase().includes(searchLower)
          );
        }

        if (filters?.categories?.length) {
          result = result.filter((job) => filters.categories!.includes(job.category));
        }

        if (filters?.minBudget) {
          result = result.filter((job) => job.budget >= filters.minBudget!);
        }

        if (filters?.maxBudget) {
          result = result.filter((job) => job.budget <= filters.maxBudget!);
        }

        setJobs(result);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [filters, refreshKey]);

  return { jobs, isLoading, error, totalCount: jobs.length, refetch };
}

/**
 * Hook to fetch a single job by ID
 */
export function useJob(id: string): UseJobResult {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchJob() {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{ job: JobResult | null }>(JOB_BY_ID_QUERY, { id });

        if (data.job) {
          const transformedJob = await transformJob(data.job);
          setJob(transformedJob);
        } else {
          setJob(null);
          setError('Job not found');
        }
      } catch (err) {
        console.error('Failed to fetch job:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJob();
  }, [id, refreshKey]);

  return { job, isLoading, error, refetch };
}

/**
 * Hook to fetch jobs posted by current user
 */
export function useMyJobs(address?: string): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchJobs() {
      if (!address) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<JobsResponse>(JOBS_BY_CLIENT_QUERY, {
          client: address.toLowerCase(),
          first: 25,
          skip: 0,
        });

        const transformedJobs = await Promise.all(data.jobs.map(transformJob));
        setJobs(transformedJobs);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [address, refreshKey]);

  return { jobs, isLoading, error, totalCount: jobs.length, refetch };
}

/**
 * Hook to fetch jobs where current user has applied
 */
export function useMyApplications(address?: string): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchJobs() {
      if (!address) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch applications by freelancer, then get job details
        interface ApplicationWithFullJob {
          applications: Array<{ job: JobResult }>;
        }
        const appData = await querySubgraph<ApplicationWithFullJob>(
          `query GetMyApplications($freelancer: String!, $first: Int!, $skip: Int!) {
            applications(
              first: $first
              skip: $skip
              where: { freelancer: $freelancer }
            ) {
              job { id client { id } budget deadline status metadataURI createdAt }
            }
          }`,
          { freelancer: address.toLowerCase(), first: 25, skip: 0 }
        );

        const jobResults = appData.applications.map((app) => app.job);
        const transformedJobs = await Promise.all(jobResults.map(transformJob));
        setJobs(transformedJobs);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [address, refreshKey]);

  return { jobs, isLoading, error, totalCount: jobs.length, refetch };
}

/**
 * Hook to fetch completed jobs where user was the freelancer
 */
export function useMyCompletedJobs(address?: string): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchJobs() {
      if (!address) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<JobsResponse>(JOBS_BY_FREELANCER_QUERY, {
          freelancer: address.toLowerCase(),
          first: 25,
          skip: 0,
        });

        const transformedJobs = await Promise.all(data.jobs.map(transformJob));
        // Filter to only completed jobs
        const completedJobs = transformedJobs.filter((job) => job.status === 'completed');
        setJobs(completedJobs);
      } catch (err) {
        console.error('Failed to fetch completed jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch completed jobs');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [address, refreshKey]);

  return { jobs, isLoading, error, totalCount: jobs.length, refetch };
}

/**
 * Hook to fetch active jobs where user is freelancer
 */
export function useMyActiveJobs(address?: string): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchJobs() {
      if (!address) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<JobsResponse>(JOBS_BY_FREELANCER_QUERY, {
          freelancer: address.toLowerCase(),
          first: 25,
          skip: 0,
        });

        const transformedJobs = await Promise.all(data.jobs.map(transformJob));
        // Filter to only active jobs (in_progress or delivered)
        const activeJobs = transformedJobs.filter(
          (job) => job.status === 'in_progress' || job.status === 'delivered'
        );
        setJobs(activeJobs);
      } catch (err) {
        console.error('Failed to fetch active jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch active jobs');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [address, refreshKey]);

  return { jobs, isLoading, error, totalCount: jobs.length, refetch };
}

/**
 * Hook to fetch applications for a specific job
 */
export function useJobApplications(jobId: string): UseJobApplicationsResult {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchApplications() {
      if (!jobId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<ApplicationsResponse>(APPLICATIONS_BY_JOB_QUERY, {
          jobId,
          first: 25,
          skip: 0,
        });

        const apps: Application[] = await Promise.all(
          data.applications.map(async (app) => {
            const metadata = await fetchIPFSMetadata<{ coverLetter: string; proposedBudget: string }>(
              app.proposalURI
            );
            return {
              id: app.id,
              jobId: app.job.id,
              freelancer: app.freelancer.id,
              proposalURI: app.proposalURI,
              coverLetter: metadata?.coverLetter || '',
              proposedBudget: BigInt(metadata?.proposedBudget || '0'),
              status: app.status.toLowerCase() as Application['status'],
              createdAt: parseInt(app.createdAt),
            };
          })
        );

        setApplications(apps);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplications();
  }, [jobId, refreshKey]);

  return { applications, isLoading, error, refetch };
}
