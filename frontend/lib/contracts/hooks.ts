'use client';

import { useCallback } from 'react';
import { useReadContract, useWriteContract, useChainId } from '@/lib/web3';
import {
  JobFactoryABI,
  ApplicationRegistryABI,
  MilestoneManagerABI,
  ReviewRegistryABI,
  ArbitrationDAOABI,
} from '@/lib/web3/abis';
import { getPumasiContractAddress } from '@/lib/web3/addresses';
import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain';

// =============================================================================
// JobFactory Hooks
// =============================================================================

export function useJobFactoryContract() {
  const chainId = useChainId();
  const address = getPumasiContractAddress(chainId ?? VERYCHAIN_CHAIN_ID, 'JobFactory') as `0x${string}`;
  return { address, abi: JobFactoryABI };
}

export function useJobFactoryRead<T>(functionName: string, args: unknown[] = []) {
  const { address, abi } = useJobFactoryContract();
  return useReadContract<T>({
    address,
    abi,
    functionName,
    args,
  });
}

export function useJobFactoryWrite() {
  const { address, abi } = useJobFactoryContract();
  const { writeContract, isPending, error } = useWriteContract();

  const write = useCallback(
    async (functionName: string, args: unknown[], value?: bigint) => {
      return writeContract({
        address,
        abi,
        functionName,
        args,
        value,
      });
    },
    [writeContract, address, abi]
  );

  return { write, isPending, error };
}

// =============================================================================
// ApplicationRegistry Hooks
// =============================================================================

export function useApplicationRegistryContract() {
  const chainId = useChainId();
  const address = getPumasiContractAddress(chainId ?? VERYCHAIN_CHAIN_ID, 'ApplicationRegistry') as `0x${string}`;
  return { address, abi: ApplicationRegistryABI };
}

export function useApplicationRegistryRead<T>(functionName: string, args: unknown[] = []) {
  const { address, abi } = useApplicationRegistryContract();
  return useReadContract<T>({
    address,
    abi,
    functionName,
    args,
  });
}

export function useApplicationRegistryWrite() {
  const { address, abi } = useApplicationRegistryContract();
  const { writeContract, isPending, error } = useWriteContract();

  const write = useCallback(
    async (functionName: string, args: unknown[]) => {
      return writeContract({
        address,
        abi,
        functionName,
        args,
      });
    },
    [writeContract, address, abi]
  );

  return { write, isPending, error };
}

// =============================================================================
// MilestoneManager Hooks
// =============================================================================

export function useMilestoneManagerContract() {
  const chainId = useChainId();
  const address = getPumasiContractAddress(chainId ?? VERYCHAIN_CHAIN_ID, 'MilestoneManager') as `0x${string}`;
  return { address, abi: MilestoneManagerABI };
}

export function useMilestoneManagerRead<T>(functionName: string, args: unknown[] = []) {
  const { address, abi } = useMilestoneManagerContract();
  return useReadContract<T>({
    address,
    abi,
    functionName,
    args,
  });
}

export function useMilestoneManagerWrite() {
  const { address, abi } = useMilestoneManagerContract();
  const { writeContract, isPending, error } = useWriteContract();

  const write = useCallback(
    async (functionName: string, args: unknown[]) => {
      return writeContract({
        address,
        abi,
        functionName,
        args,
      });
    },
    [writeContract, address, abi]
  );

  return { write, isPending, error };
}

// =============================================================================
// ReviewRegistry Hooks
// =============================================================================

export function useReviewRegistryContract() {
  const chainId = useChainId();
  const address = getPumasiContractAddress(chainId ?? VERYCHAIN_CHAIN_ID, 'ReviewRegistry') as `0x${string}`;
  return { address, abi: ReviewRegistryABI };
}

export function useReviewRegistryRead<T>(functionName: string, args: unknown[] = []) {
  const { address, abi } = useReviewRegistryContract();
  return useReadContract<T>({
    address,
    abi,
    functionName,
    args,
  });
}

export function useReviewRegistryWrite() {
  const { address, abi } = useReviewRegistryContract();
  const { writeContract, isPending, error } = useWriteContract();

  const write = useCallback(
    async (functionName: string, args: unknown[]) => {
      return writeContract({
        address,
        abi,
        functionName,
        args,
      });
    },
    [writeContract, address, abi]
  );

  return { write, isPending, error };
}

// =============================================================================
// ArbitrationDAO Hooks
// =============================================================================

export function useArbitrationDAOContract() {
  const chainId = useChainId();
  const address = getPumasiContractAddress(chainId ?? VERYCHAIN_CHAIN_ID, 'ArbitrationDAO') as `0x${string}`;
  return { address, abi: ArbitrationDAOABI };
}

export function useArbitrationDAORead<T>(functionName: string, args: unknown[] = []) {
  const { address, abi } = useArbitrationDAOContract();
  return useReadContract<T>({
    address,
    abi,
    functionName,
    args,
  });
}

export function useArbitrationDAOWrite() {
  const { address, abi } = useArbitrationDAOContract();
  const { writeContract, isPending, error } = useWriteContract();

  const write = useCallback(
    async (functionName: string, args: unknown[], value?: bigint) => {
      return writeContract({
        address,
        abi,
        functionName,
        args,
        value,
      });
    },
    [writeContract, address, abi]
  );

  return { write, isPending, error };
}
