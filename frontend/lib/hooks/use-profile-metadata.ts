'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileMetadata, ProfileFormData } from '@/lib/types/profile';
import { ipfsToHttp } from '@/lib/web3/ipfs';
import { useWriteContract, usePublicClient } from '@/lib/web3';
import { ProfileRegistryABI } from '@/lib/web3/abis/ProfileRegistry';
import { querySubgraph } from '@/lib/graphql/client';

const PROFILE_STORAGE_KEY = 'pumasi_profile_uri';
const PROFILE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS as `0x${string}` | undefined;

interface SaveProfileResult {
  uri: string;
  txHash?: `0x${string}`;
}

interface UseProfileMetadataResult {
  metadata: ProfileMetadata | null;
  isLoading: boolean;
  error: string | null;
  profileURI: string | null;
  saveProfile: (data: ProfileFormData, avatarFile?: File, coverFile?: File) => Promise<SaveProfileResult>;
  isSaving: boolean;
  refetch: () => void;
}

// Query to get profile URI from subgraph
const PROFILE_URI_QUERY = `
  query GetProfileURI($id: ID!) {
    user(id: $id) {
      profileURI
    }
  }
`;

/**
 * Get stored profile URI from localStorage (fallback before on-chain)
 */
function getStoredProfileURI(address: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${PROFILE_STORAGE_KEY}_${address.toLowerCase()}`);
}

/**
 * Store profile URI in localStorage (fallback before on-chain)
 */
function storeProfileURI(address: string, uri: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PROFILE_STORAGE_KEY}_${address.toLowerCase()}`, uri);
}

/**
 * Upload file to IPFS via API route
 */
async function uploadFileToIPFS(file: File, name: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);

  const response = await fetch('/api/ipfs/file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  const result = await response.json();
  return result.ipfsHash;
}

/**
 * Upload JSON metadata to IPFS via API route
 */
async function uploadJSONToIPFS(content: any, name: string): Promise<string> {
  const response = await fetch('/api/ipfs/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload metadata');
  }

  const result = await response.json();
  return result.ipfsHash;
}

/**
 * Fetch profile metadata from IPFS
 */
async function fetchProfileMetadata(uri: string): Promise<ProfileMetadata | null> {
  try {
    const url = ipfsToHttp(uri);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch profile metadata:', error);
    return null;
  }
}

/**
 * Hook to manage user profile metadata stored on IPFS and registered on-chain
 */
export function useProfileMetadata(address: string | undefined): UseProfileMetadataResult {
  const [metadata, setMetadata] = useState<ProfileMetadata | null>(null);
  const [profileURI, setProfileURI] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { publicClient } = usePublicClient();

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load profile metadata
  useEffect(() => {
    async function loadProfile() {
      if (!address) {
        setMetadata(null);
        setProfileURI(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let uri: string | null = null;

        // Try to get profile URI from subgraph first
        // Note: This may fail if ProfileRegistry contract isn't deployed yet
        try {
          const data = await querySubgraph<{ user: { profileURI: string | null } | null }>(
            PROFILE_URI_QUERY,
            { id: address.toLowerCase() },
            { silent: true } // Suppress errors - expected to fail until subgraph is redeployed
          );
          uri = data.user?.profileURI || null;
        } catch {
          // Subgraph query failed, continue with localStorage fallback
        }

        // Fall back to localStorage if no on-chain profile
        if (!uri) {
          uri = getStoredProfileURI(address);
        }

        setProfileURI(uri);

        if (uri) {
          const data = await fetchProfileMetadata(uri);
          setMetadata(data);
        } else {
          setMetadata(null);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [address, refreshKey]);

  // Save profile to IPFS and register on-chain
  const saveProfile = useCallback(
    async (data: ProfileFormData, avatarFile?: File, coverFile?: File): Promise<SaveProfileResult> => {
      if (!address) throw new Error('No address provided');

      setIsSaving(true);
      setError(null);

      try {
        let avatarHash = metadata?.avatarHash;
        let coverImageHash = metadata?.coverImageHash;

        // Upload avatar if provided
        if (avatarFile) {
          avatarHash = await uploadFileToIPFS(
            avatarFile,
            `avatar_${address.slice(0, 8)}_${Date.now()}`
          );
        }

        // Upload cover image if provided
        if (coverFile) {
          coverImageHash = await uploadFileToIPFS(
            coverFile,
            `cover_${address.slice(0, 8)}_${Date.now()}`
          );
        }

        // Create full metadata
        const fullMetadata: ProfileMetadata = {
          displayName: data.displayName,
          bio: data.bio,
          avatarHash,
          coverImageHash,
          title: data.title,
          location: data.location,
          website: data.website,
          skills: data.skills,
          languages: data.languages,
          socials: data.socials,
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          verychatHandle: data.verychatHandle,
          verychatVerified: data.verychatVerified,
          verychatVerifiedAt: data.verychatVerifiedAt,
          portfolioItems: metadata?.portfolioItems || [],
          createdAt: metadata?.createdAt || Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        };

        // Upload metadata to IPFS
        const metadataHash = await uploadJSONToIPFS(
          fullMetadata,
          `profile_${address.slice(0, 8)}_${Date.now()}`
        );

        const newURI = `ipfs://${metadataHash}`;
        let txHash: `0x${string}` | undefined;

        // Register on-chain if contract is deployed
        if (PROFILE_REGISTRY_ADDRESS && publicClient) {
          const hash = await writeContract({
            address: PROFILE_REGISTRY_ADDRESS,
            abi: ProfileRegistryABI,
            functionName: 'setProfile',
            args: [newURI],
          });
          txHash = hash;

          // Wait for transaction confirmation
          await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
        } else {
          // Fall back to localStorage if contract not deployed
          storeProfileURI(address, newURI);
        }

        // Update state after confirmation
        setProfileURI(newURI);
        setMetadata(fullMetadata);

        return { uri: newURI, txHash };
      } catch (err) {
        console.error('Failed to save profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
        setError(errorMessage);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [address, metadata, writeContract, publicClient]
  );

  return {
    metadata,
    isLoading,
    error,
    profileURI,
    saveProfile,
    isSaving: isSaving || isWritePending,
    refetch,
  };
}
