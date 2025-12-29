'use client';

import { useState, useCallback } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useReadContract, useWaitForTransaction, useChainId } from '@/lib/web3';
import { JobFactoryABI } from '@/lib/web3/abis';
import { uploadJobMetadata, JobMetadata } from '@/lib/services/job-metadata';
import { getJobFactoryAddress } from '@/lib/config/contracts';

export interface CreateJobParams {
  metadata: JobMetadata;
  budget: string; // In VERY
  deadline: number; // Unix timestamp
}

export interface CreateJobResult {
  txHash: `0x${string}`;
  ipfsHash: string;
}

/**
 * Hook to create a new job with escrow deposit
 */
export function useCreateJob() {
  const { writeContract, isPending: isWritePending, error: writeError } = useWriteContract();
  const chainId = useChainId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransaction({
    hash: txHash ?? undefined,
  });

  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const createJob = useCallback(
    async (params: CreateJobParams): Promise<CreateJobResult> => {
      setUploadError(null);
      setTxHash(null);

      // Validate contract address
      if (!jobFactoryAddress) {
        const message = `JobFactory not deployed on chain ${chainId}. Please switch to VeryChain.`;
        setUploadError(message);
        throw new Error(message);
      }

      // Step 1: Upload metadata to IPFS
      setIsUploading(true);
      let ipfsHash: string;
      try {
        ipfsHash = await uploadJobMetadata(params.metadata);
        console.log('[CreateJob] IPFS upload success:', ipfsHash);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'IPFS upload failed';
        console.error('[CreateJob] IPFS upload error:', err);
        setUploadError(message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }

      // Step 2: Create job on-chain with escrow deposit
      try {
        console.log('[CreateJob] Calling contract:', {
          address: jobFactoryAddress,
          chainId,
          deadline: params.deadline,
          metadataURI: `ipfs://${ipfsHash}`,
          value: params.budget,
        });

        const hash = await writeContract({
          address: jobFactoryAddress,
          abi: JobFactoryABI,
          functionName: 'createJob',
          args: [BigInt(params.deadline), `ipfs://${ipfsHash}`],
          value: parseEther(params.budget),
        });

        console.log('[CreateJob] Transaction sent:', hash);
        setTxHash(hash);
        return { txHash: hash, ipfsHash };
      } catch (err) {
        console.error('[CreateJob] Contract write error:', err);
        throw err;
      }
    },
    [writeContract, jobFactoryAddress, chainId]
  );

  return {
    createJob,
    isUploading,
    isPending: isWritePending,
    isConfirming,
    isSuccess,
    uploadError,
    writeError,
    isTxError,
    txHash,
  };
}

/**
 * Hook to read escrow balance for a job
 */
export function useJobEscrowBalance(jobId: string) {
  const chainId = useChainId();
  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const { data, isLoading, error, refetch } = useReadContract<{
    jobId: bigint;
    client: `0x${string}`;
    freelancer: `0x${string}`;
    budget: bigint;
    deadline: bigint;
    status: number;
    metadataURI: string;
    createdAt: bigint;
    deliveredAt: bigint;
    deliverableURI: string;
  }>({
    address: jobFactoryAddress ?? '0x0000000000000000000000000000000000000000',
    abi: JobFactoryABI,
    functionName: 'getJob',
    args: [BigInt(jobId)],
  });

  return {
    balance: data?.budget,
    status: data?.status,
    job: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read platform fee
 */
export function usePlatformFee() {
  const chainId = useChainId();
  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const { data, isLoading, error } = useReadContract<bigint>({
    address: jobFactoryAddress ?? '0x0000000000000000000000000000000000000000',
    abi: JobFactoryABI,
    functionName: 'platformFeeBps',
    args: [],
  });

  // Fee is in basis points (300 = 3%)
  const feePercentage = data ? Number(data) / 100 : 3;

  return {
    feeBps: data,
    feePercentage,
    isLoading,
    error,
  };
}

/**
 * Hook to read minimum budget
 */
export function useMinBudget() {
  const chainId = useChainId();
  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const { data, isLoading, error } = useReadContract<bigint>({
    address: jobFactoryAddress ?? '0x0000000000000000000000000000000000000000',
    abi: JobFactoryABI,
    functionName: 'minBudget',
    args: [],
  });

  return {
    minBudget: data,
    isLoading,
    error,
  };
}

interface UseSubmitDeliverableResult {
  submit: (deliverableURI: string) => Promise<void>;
  isSubmitting: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  txHash: `0x${string}` | null;
  error: string | null;
}

interface UseApproveDeliveryResult {
  approve: () => Promise<void>;
  isApproving: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  txHash: `0x${string}` | null;
  error: string | null;
}

/**
 * Hook for freelancer to submit deliverable for a job
 * Calls JobFactory.submitDeliverable(jobId, deliverableURI)
 */
export function useSubmitDeliverable(jobId: string): UseSubmitDeliverableResult {
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransaction({
    hash: txHash ?? undefined,
  });

  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const submit = useCallback(
    async (deliverableURI: string) => {
      setSubmitError(null);
      setTxHash(null);

      if (!chainId) {
        setSubmitError('Please connect your wallet first.');
        return;
      }

      if (!jobFactoryAddress) {
        setSubmitError(`JobFactory not deployed on chain ${chainId}.`);
        return;
      }

      if (!deliverableURI) {
        setSubmitError('Deliverable URI is required.');
        return;
      }

      try {
        console.log('[SubmitDeliverable] Submitting:', { jobId, deliverableURI });

        const hash = await writeContract({
          address: jobFactoryAddress,
          abi: JobFactoryABI,
          functionName: 'submitDeliverable',
          args: [BigInt(jobId), deliverableURI],
        });

        console.log('[SubmitDeliverable] Transaction sent:', hash);
        setTxHash(hash);
      } catch (err) {
        console.error('[SubmitDeliverable] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        const isUserRejection =
          errorMessage.toLowerCase().includes('reject') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.toLowerCase().includes('cancelled');
        setSubmitError(isUserRejection ? 'Transaction cancelled by user.' : errorMessage);
      }
    },
    [jobId, writeContract, jobFactoryAddress, chainId]
  );

  const isSubmitting = isPending;
  const error =
    submitError || (writeError?.message ?? null) || (isTxError ? 'Transaction failed.' : null);

  return { submit, isSubmitting, isConfirming, isSuccess, txHash, error };
}

/**
 * Hook for client to approve delivery and release funds
 * Calls JobFactory.approveDelivery(jobId)
 */
export function useApproveDelivery(jobId: string): UseApproveDeliveryResult {
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransaction({
    hash: txHash ?? undefined,
  });

  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const approve = useCallback(async () => {
    setApproveError(null);
    setTxHash(null);

    if (!chainId) {
      setApproveError('Please connect your wallet first.');
      return;
    }

    if (!jobFactoryAddress) {
      setApproveError(`JobFactory not deployed on chain ${chainId}.`);
      return;
    }

    try {
      console.log('[ApproveDelivery] Approving job:', jobId);

      const hash = await writeContract({
        address: jobFactoryAddress,
        abi: JobFactoryABI,
        functionName: 'approveDelivery',
        args: [BigInt(jobId)],
      });

      console.log('[ApproveDelivery] Transaction sent:', hash);
      setTxHash(hash);
    } catch (err) {
      console.error('[ApproveDelivery] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      const isUserRejection =
        errorMessage.toLowerCase().includes('reject') ||
        errorMessage.toLowerCase().includes('denied') ||
        errorMessage.toLowerCase().includes('cancelled');
      setApproveError(isUserRejection ? 'Transaction cancelled by user.' : errorMessage);
    }
  }, [jobId, writeContract, jobFactoryAddress, chainId]);

  const isApproving = isPending;
  const error =
    approveError || (writeError?.message ?? null) || (isTxError ? 'Transaction failed.' : null);

  return { approve, isApproving, isConfirming, isSuccess, txHash, error };
}

interface UseAssignFreelancerResult {
  assign: () => Promise<void>;
  isAssigning: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  txHash: `0x${string}` | null;
  error: string | null;
}

/**
 * Hook to assign a freelancer to a job (fix inconsistent state)
 * Calls JobFactory.assignFreelancer(jobId, freelancer)
 */
export function useAssignFreelancer(jobId: string, freelancerAddress: string): UseAssignFreelancerResult {
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransaction({
    hash: txHash ?? undefined,
  });

  const jobFactoryAddress = chainId ? getJobFactoryAddress(chainId) : undefined;

  const assign = useCallback(async () => {
    setAssignError(null);
    setTxHash(null);

    if (!chainId) {
      setAssignError('Please connect your wallet first.');
      return;
    }

    if (!jobFactoryAddress) {
      setAssignError(`JobFactory not deployed on chain ${chainId}.`);
      return;
    }

    if (!freelancerAddress) {
      setAssignError('Freelancer address is required.');
      return;
    }

    try {
      console.log('[AssignFreelancer] Assigning:', { jobId, freelancerAddress });

      const hash = await writeContract({
        address: jobFactoryAddress,
        abi: JobFactoryABI,
        functionName: 'assignFreelancer',
        args: [BigInt(jobId), freelancerAddress as `0x${string}`],
      });

      console.log('[AssignFreelancer] Transaction sent:', hash);
      setTxHash(hash);
    } catch (err) {
      console.error('[AssignFreelancer] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      const isUserRejection =
        errorMessage.toLowerCase().includes('reject') ||
        errorMessage.toLowerCase().includes('denied') ||
        errorMessage.toLowerCase().includes('cancelled');
      setAssignError(isUserRejection ? 'Transaction cancelled by user.' : errorMessage);
    }
  }, [jobId, freelancerAddress, writeContract, jobFactoryAddress, chainId]);

  const isAssigning = isPending;
  const error =
    assignError || (writeError?.message ?? null) || (isTxError ? 'Transaction failed.' : null);

  return { assign, isAssigning, isConfirming, isSuccess, txHash, error };
}
