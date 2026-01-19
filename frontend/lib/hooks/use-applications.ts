'use client';

import { useState, useEffect, useCallback } from 'react';
import { Application, ApplicationFormData } from '@/lib/types/application';
import { Job, JobCategory } from '@/lib/types/job';
import { querySubgraph, fetchIPFSMetadata } from '@/lib/graphql/client';
import {
  APPLICATIONS_BY_JOB_QUERY,
  APPLICATIONS_BY_FREELANCER_QUERY,
  APPLICATION_BY_ID_QUERY,
  ApplicationsResponse,
  ApplicationResult,
  JobResult,
} from '@/lib/graphql/queries/pumasi-queries';
import { useWriteContract, useWaitForTransaction, useChainId, usePublicClient, useAccount } from '@/lib/web3';
import { getContractAddress } from '@/lib/config/contracts';
import ApplicationRegistryABI from '@/lib/abis/ApplicationRegistry.json';
import { decodeErrorResult } from 'viem';

// Custom error signatures from ApplicationRegistry contract
const APPLICATION_ERRORS: Record<string, string> = {
  'InvalidJob()': 'This job does not exist.',
  'JobNotOpen()': 'This job is no longer accepting applications.',
  'CannotApplyToOwnJob()': 'You cannot apply to your own job.',
  'AlreadyApplied()': 'You have already applied to this job.',
};

interface UseApplicationsResult {
  applications: Application[];
  jobs: Job[];
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

interface UseSubmitApplicationResult {
  submit: (data: ApplicationFormData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

interface UseAcceptApplicationResult {
  accept: () => Promise<void>;
  isAccepting: boolean;
  error: string | null;
}

interface UseRejectApplicationResult {
  reject: () => Promise<void>;
  isRejecting: boolean;
  error: string | null;
}

// Transform subgraph application to app Application type
async function transformApplication(result: ApplicationResult): Promise<Application> {
  interface ProposalMetadata {
    coverLetter: string;
    proposedBudget?: string;
    proposedTimeline?: string;
    portfolioLinks?: string[];
  }
  const metadata = await fetchIPFSMetadata<ProposalMetadata>(result.proposalURI);

  return {
    id: result.id,
    jobId: result.job.id,
    freelancer: result.freelancer.id,
    proposalURI: result.proposalURI,
    coverLetter: metadata?.coverLetter || '',
    proposedTimeline: metadata?.proposedTimeline,
    portfolioLinks: metadata?.portfolioLinks,
    status: result.status.toLowerCase() as Application['status'],
    createdAt: parseInt(result.createdAt),
  };
}

// Transform subgraph job to app Job type
async function transformJob(result: JobResult): Promise<Job> {
  interface JobMetadata { title: string; description: string; category: JobCategory; }
  const metadata = await fetchIPFSMetadata<JobMetadata>(result.metadataURI);

  return {
    id: result.id,
    client: result.client.id,
    freelancer: result.freelancer?.id,
    title: metadata?.title || `Job #${result.id}`,
    description: metadata?.description || '',
    category: metadata?.category || 'misc',
    budget: BigInt(result.budget),
    deadline: parseInt(result.deadline),
    status: result.status.toLowerCase() as Job['status'],
    metadataURI: result.metadataURI,
    createdAt: parseInt(result.createdAt),
  };
}

/**
 * Check if job has an accepted application (other than the current one)
 */
function hasOtherAcceptedApplication(
  applications: { id: string; status?: string }[] | undefined,
  currentAppId: string
): boolean {
  if (!applications) return false;
  return applications.some(
    (app) => app.id !== currentAppId && app.status?.toLowerCase() === 'accepted'
  );
}

/**
 * Compute effective status: if job has a different freelancer or accepted application, pending becomes rejected
 */
function computeEffectiveStatus(
  appStatus: Application['status'],
  appId: string,
  appFreelancer: string,
  job: Job,
  jobApplications?: { id: string; status?: string }[]
): Application['status'] {
  // If already accepted or rejected, keep the status
  if (appStatus !== 'pending') return appStatus;

  // If job has a freelancer assigned and it's not this applicant, mark as rejected
  if (job.freelancer && job.freelancer.toLowerCase() !== appFreelancer.toLowerCase()) {
    return 'rejected';
  }

  // If another application was accepted, mark this one as rejected
  if (hasOtherAcceptedApplication(jobApplications, appId)) {
    return 'rejected';
  }

  return 'pending';
}

/**
 * Hook to fetch a single application by ID with its job
 */
export function useApplication(applicationId: string): {
  application: Application | null;
  job: Job | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [application, setApplication] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchApplication() {
      if (!applicationId) {
        setApplication(null);
        setJob(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{
          application: (ApplicationResult & { job: JobResult }) | null;
        }>(APPLICATION_BY_ID_QUERY, { id: applicationId });

        if (!data.application) {
          setApplication(null);
          setJob(null);
          setError('Application not found');
          return;
        }

        const app = await transformApplication(data.application);
        const jobData = await transformJob(data.application.job);

        // Compute effective status based on job's freelancer assignment and other accepted apps
        const jobApplications = data.application.job.applications;
        const effectiveStatus = computeEffectiveStatus(
          app.status,
          app.id,
          app.freelancer,
          jobData,
          jobApplications
        );
        const appWithEffectiveStatus = { ...app, status: effectiveStatus };

        setApplication(appWithEffectiveStatus);
        setJob(jobData);
      } catch (err) {
        console.error('Failed to fetch application:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch application');
        setApplication(null);
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplication();
  }, [applicationId, refreshKey]);

  return { application, job, isLoading, error, refetch };
}

/**
 * Hook to fetch current user's applications with their corresponding jobs
 */
export function useApplications(address?: string): UseApplicationsResult {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchApplications() {
      if (!address) {
        setApplications([]);
        setJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch applications with job data including all applications for effective status check
        const data = await querySubgraph<{
          applications: Array<ApplicationResult & { job: JobResult & { applications?: { id: string; status: string }[] } }>;
        }>(
          `query GetMyApplicationsWithJobs($freelancer: String!, $first: Int!, $skip: Int!) {
            applications(
              first: $first
              skip: $skip
              where: { freelancer: $freelancer }
              orderBy: createdAt
              orderDirection: desc
            ) {
              id
              job {
                id
                client { id }
                budget
                deadline
                status
                metadataURI
                createdAt
                freelancer { id }
                applications { id status }
              }
              freelancer { id }
              status
              proposalURI
              createdAt
            }
          }`,
          { freelancer: address.toLowerCase(), first: 25, skip: 0 }
        );

        const apps = await Promise.all(data.applications.map(transformApplication));
        const jobResults = await Promise.all(
          data.applications.map((app) => transformJob(app.job))
        );

        // Apply effective status to each application based on job's freelancer and other accepted apps
        const appsWithEffectiveStatus = apps.map((app, index) => {
          const job = jobResults[index];
          const jobApplications = data.applications[index].job.applications;
          const effectiveStatus = computeEffectiveStatus(
            app.status,
            app.id,
            app.freelancer,
            job,
            jobApplications
          );
          return { ...app, status: effectiveStatus };
        });

        setApplications(appsWithEffectiveStatus);
        setJobs(jobResults);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
        setApplications([]);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplications();
  }, [address, refreshKey]);

  return { applications, jobs, isLoading, error, refetch };
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

        const apps = await Promise.all(data.applications.map(transformApplication));
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

/**
 * Hook to submit an application to a job
 */
export function useSubmitApplication(jobId: string): UseSubmitApplicationResult & {
  isConfirming: boolean;
  isSuccess: boolean;
  txHash: `0x${string}` | null;
} {
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const chainId = useChainId();
  const { publicClient } = usePublicClient();
  const { address } = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransaction({
    hash: txHash ?? undefined,
  });

  const applicationRegistryAddress = chainId ? getContractAddress(chainId, 'applicationRegistry') : undefined;

  const submit = useCallback(
    async (data: ApplicationFormData) => {
      setUploadError(null);
      setTxHash(null);

      // Check if wallet is connected
      if (!chainId) {
        const message = 'Please connect your wallet first.';
        setUploadError(message);
        return;
      }

      // Validate contract address
      if (!applicationRegistryAddress) {
        const message = `ApplicationRegistry not deployed on chain ${chainId}. Please switch to VeryChain.`;
        setUploadError(message);
        return;
      }

      // Step 1: Upload proposal data to IPFS
      setIsUploading(true);
      let ipfsHash: string;
      try {
        const proposalData = {
          coverLetter: data.coverLetter,
          proposedTimeline: data.proposedTimeline,
          portfolioLinks: data.portfolioLinks,
        };

        const response = await fetch('/api/ipfs/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: proposalData,
            name: `application-job-${jobId}-${Date.now()}`,
            metadata: { type: 'application-proposal', jobId },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload proposal to IPFS');
        }

        const result = await response.json();
        ipfsHash = result.ipfsHash;
        console.log('[SubmitApplication] IPFS upload success:', ipfsHash);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'IPFS upload failed';
        console.error('[SubmitApplication] IPFS upload error:', err);
        setUploadError(message);
        return;
      } finally {
        setIsUploading(false);
      }

      // Step 2: Simulate transaction to catch revert reasons before sending
      const contractCallParams = {
        address: applicationRegistryAddress as `0x${string}`,
        abi: ApplicationRegistryABI,
        functionName: 'submitApplication' as const,
        args: [BigInt(jobId), `ipfs://${ipfsHash}`] as const,
        account: address as `0x${string}`,
      };

      console.log('[SubmitApplication] Simulating transaction:', {
        address: applicationRegistryAddress,
        chainId,
        jobId,
        proposalURI: `ipfs://${ipfsHash}`,
        account: address,
      });

      // Simulate first to get detailed revert reason
      if (publicClient) {
        try {
          await publicClient.simulateContract(contractCallParams);
          console.log('[SubmitApplication] Simulation passed');
        } catch (simError) {
          console.error('[SubmitApplication] Simulation failed:', simError);

          // Try to extract the revert reason
          const errorStr = simError instanceof Error ? simError.message : String(simError);

          // Check for known custom errors
          for (const [errorSig, userMessage] of Object.entries(APPLICATION_ERRORS)) {
            const errorName = errorSig.replace('()', '');
            if (errorStr.includes(errorName)) {
              setUploadError(userMessage);
              return;
            }
          }

          // Try to decode the error data if present
          const hexMatch = errorStr.match(/0x[a-fA-F0-9]+/);
          if (hexMatch) {
            try {
              const decoded = decodeErrorResult({
                abi: ApplicationRegistryABI,
                data: hexMatch[0] as `0x${string}`,
              });
              const knownError = APPLICATION_ERRORS[`${decoded.errorName}()`];
              if (knownError) {
                setUploadError(knownError);
                return;
              }
              setUploadError(`Contract error: ${decoded.errorName}`);
              return;
            } catch {
              // Couldn't decode, use raw message
            }
          }

          setUploadError(`Transaction will fail: ${errorStr.slice(0, 200)}`);
          return;
        }
      }

      // Step 3: Call contract's submitApplication function
      try {
        const hash = await writeContract({
          address: applicationRegistryAddress,
          abi: ApplicationRegistryABI,
          functionName: 'submitApplication',
          args: [BigInt(jobId), `ipfs://${ipfsHash}`],
        });

        console.log('[SubmitApplication] Transaction sent:', hash);
        setTxHash(hash);
        return;
      } catch (err) {
        console.error('[SubmitApplication] Contract write error:', err);
        // Handle user rejection and other errors gracefully via state
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        const isUserRejection = errorMessage.toLowerCase().includes('reject') ||
                                errorMessage.toLowerCase().includes('denied') ||
                                errorMessage.toLowerCase().includes('cancelled');
        setUploadError(isUserRejection ? 'Transaction cancelled by user.' : errorMessage);
        return;
      }
    },
    [jobId, writeContract, applicationRegistryAddress, chainId, publicClient, address]
  );

  const isSubmitting = isUploading || isPending || isConfirming;
  const error = uploadError || (writeError?.message ?? null) || (isTxError ? 'Transaction failed. The contract rejected the application.' : null);

  // Log state changes for debugging
  useEffect(() => {
    if (txHash) {
      console.log('[useSubmitApplication] State:', { isConfirming, isSuccess, isTxError, error });
    }
  }, [txHash, isConfirming, isSuccess, isTxError, error]);

  return { submit, isSubmitting, error, isConfirming, isSuccess, txHash };
}

/**
 * Hook to accept an application and assign freelancer (hire freelancer)
 * This calls both acceptApplication AND assignFreelancer in sequence
 */
export function useAcceptApplication(
  applicationId: string,
  jobId: string,
  freelancerAddress: string
): UseAcceptApplicationResult & {
  isConfirming: boolean;
  isSuccess: boolean;
  txHash: `0x${string}` | null;
  step: 'idle' | 'accepting' | 'assigning' | 'done';
} {
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'accepting' | 'assigning' | 'done'>('idle');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const applicationRegistryAddress = chainId ? getContractAddress(chainId, 'applicationRegistry') : undefined;
  const jobFactoryAddress = chainId ? getContractAddress(chainId, 'jobFactory') : undefined;

  const accept = useCallback(async () => {
    setAcceptError(null);
    setTxHash(null);
    setStep('idle');
    setIsDone(false);

    if (!chainId) {
      setAcceptError('Please connect your wallet first.');
      return;
    }

    if (!applicationRegistryAddress || !jobFactoryAddress) {
      setAcceptError(`Contracts not deployed on chain ${chainId}.`);
      return;
    }

    try {
      // Step 1: Accept the application
      setStep('accepting');
      setIsConfirming(true);
      console.log('[AcceptApplication] Step 1 - Accepting application:', applicationId);

      const acceptHash = await writeContract({
        address: applicationRegistryAddress,
        abi: ApplicationRegistryABI,
        functionName: 'acceptApplication',
        args: [BigInt(applicationId)],
      });

      console.log('[AcceptApplication] Accept tx sent:', acceptHash);
      setTxHash(acceptHash);

      // Brief delay to allow tx propagation (reduced from 5s)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 2: Assign freelancer
      setStep('assigning');
      console.log('[AcceptApplication] Step 2 - Assigning freelancer:', { jobId, freelancerAddress });

      const assignHash = await writeContract({
        address: jobFactoryAddress,
        abi: [
          {
            name: 'assignFreelancer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'jobId', type: 'uint256' },
              { name: 'freelancer', type: 'address' },
            ],
            outputs: [],
          },
        ],
        functionName: 'assignFreelancer',
        args: [BigInt(jobId), freelancerAddress as `0x${string}`],
      });

      console.log('[AcceptApplication] Assign tx sent:', assignHash);
      setTxHash(assignHash);

      // Brief delay to allow tx propagation (reduced from 5s)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setStep('done');
      setIsDone(true);
      setIsConfirming(false);
    } catch (err) {
      console.error('[AcceptApplication] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      const isUserRejection = errorMessage.toLowerCase().includes('reject') ||
                              errorMessage.toLowerCase().includes('denied') ||
                              errorMessage.toLowerCase().includes('cancelled');
      setAcceptError(isUserRejection ? 'Transaction cancelled by user.' : errorMessage);
      setStep('idle');
      setIsConfirming(false);
    }
  }, [applicationId, jobId, freelancerAddress, writeContract, applicationRegistryAddress, jobFactoryAddress, chainId]);

  const isAccepting = isPending || isConfirming || step === 'accepting' || step === 'assigning';
  const error = acceptError || (writeError?.message ?? null);

  return { accept, isAccepting, error, isConfirming, isSuccess: isDone, txHash, step };
}

// LocalStorage key for rejected applications
const REJECTED_APPS_KEY = 'pumasi_rejected_applications';

/**
 * Get rejected application IDs from localStorage
 */
export function getRejectedApplications(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(REJECTED_APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add an application ID to rejected list in localStorage
 */
function addRejectedApplication(applicationId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const rejected = getRejectedApplications();
    if (!rejected.includes(applicationId)) {
      rejected.push(applicationId);
      localStorage.setItem(REJECTED_APPS_KEY, JSON.stringify(rejected));
    }
  } catch (err) {
    console.error('Failed to save rejected application:', err);
  }
}

/**
 * Hook to reject an application (localStorage only - no transaction)
 */
export function useRejectApplication(applicationId: string): UseRejectApplicationResult {
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reject = useCallback(async () => {
    setIsRejecting(true);
    setError(null);

    try {
      console.log('[RejectApplication] Storing rejection in localStorage:', applicationId);
      addRejectedApplication(applicationId);
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error('Failed to reject application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject';
      setError(errorMessage);
      throw err;
    } finally {
      setIsRejecting(false);
    }
  }, [applicationId]);

  return { reject, isRejecting, error };
}

/**
 * Hook to withdraw an application
 * TODO: Connect to contract when deployed
 */
export function useWithdrawApplication(applicationId: string) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = useCallback(async () => {
    setIsWithdrawing(true);
    setError(null);

    try {
      // TODO: Replace with actual contract interaction
      console.log('Withdrawing application:', applicationId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw';
      setError(errorMessage);
      throw err;
    } finally {
      setIsWithdrawing(false);
    }
  }, [applicationId]);

  return { withdraw, isWithdrawing, error };
}
