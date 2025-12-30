'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileMetadata } from '@/lib/types/profile';
import { ipfsToHttp } from '@/lib/web3/ipfs';
import { querySubgraph } from '@/lib/graphql/client';
import { cn } from '@/lib/utils';

// Query to get profile URI from subgraph
const PROFILE_URI_QUERY = `
  query GetProfileURI($id: ID!) {
    user(id: $id) {
      profileURI
    }
  }
`;

// Cache for profile metadata to avoid repeated fetches
const profileCache = new Map<string, ProfileMetadata | null>();
const fetchingAddresses = new Set<string>();

interface UserAvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showAddress?: boolean;
  linkToProfile?: boolean;
  className?: string;
  nameClassName?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const fallbackIconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

/**
 * Fetch profile metadata from IPFS
 */
async function fetchProfileMetadata(uri: string): Promise<ProfileMetadata | null> {
  try {
    const url = ipfsToHttp(uri);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch profile metadata:', error);
    return null;
  }
}

/**
 * Get stored profile URI from localStorage (fallback)
 */
function getStoredProfileURI(address: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`pumasi_profile_uri_${address.toLowerCase()}`);
}

export function UserAvatar({
  address,
  size = 'md',
  showName = false,
  showAddress = false,
  linkToProfile = false,
  className,
  nameClassName,
}: UserAvatarProps) {
  const [metadata, setMetadata] = useState<ProfileMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      const lowerAddress = address.toLowerCase();

      // Check cache first
      if (profileCache.has(lowerAddress)) {
        setMetadata(profileCache.get(lowerAddress) || null);
        setIsLoading(false);
        return;
      }

      // Avoid duplicate fetches for same address
      if (fetchingAddresses.has(lowerAddress)) {
        // Wait a bit and check cache again
        await new Promise((r) => setTimeout(r, 500));
        if (profileCache.has(lowerAddress)) {
          setMetadata(profileCache.get(lowerAddress) || null);
        }
        setIsLoading(false);
        return;
      }

      fetchingAddresses.add(lowerAddress);

      try {
        let uri: string | null = null;

        // Try subgraph first
        try {
          const data = await querySubgraph<{ user: { profileURI: string | null } | null }>(
            PROFILE_URI_QUERY,
            { id: lowerAddress },
            { silent: true }
          );
          uri = data.user?.profileURI || null;
        } catch {
          // Subgraph query failed
        }

        // Fall back to localStorage
        if (!uri) {
          uri = getStoredProfileURI(address);
        }

        if (uri) {
          const data = await fetchProfileMetadata(uri);
          profileCache.set(lowerAddress, data);
          setMetadata(data);
        } else {
          profileCache.set(lowerAddress, null);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        profileCache.set(lowerAddress, null);
      } finally {
        fetchingAddresses.delete(lowerAddress);
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [address]);

  const avatarUrl = metadata?.avatarHash ? ipfsToHttp(metadata.avatarHash) : null;
  const displayName = metadata?.displayName || null;
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const fallback = address.slice(2, 4).toUpperCase();

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar className={sizeClasses[size]}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName || shortAddress} /> : null}
        <AvatarFallback className="bg-sky/20 text-sky">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-full" />
          ) : avatarUrl ? null : (
            <User className={fallbackIconSizes[size]} />
          )}
        </AvatarFallback>
      </Avatar>
      {(showName || showAddress) && (
        <div className="flex flex-col">
          {showName && displayName && (
            <span className={cn('font-medium', textSizeClasses[size], nameClassName)}>
              {displayName}
            </span>
          )}
          {showAddress && (
            <span className={cn('text-muted-foreground font-mono', textSizeClasses[size])}>
              {shortAddress}
            </span>
          )}
          {showName && !displayName && !showAddress && (
            <span className={cn('font-mono', textSizeClasses[size], nameClassName)}>
              {shortAddress}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link href={`/profile/${address}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function UserAvatarSkeleton({
  size = 'md',
  showName = false,
  showAddress = false,
}: Pick<UserAvatarProps, 'size' | 'showName' | 'showAddress'>) {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className={cn('rounded-full', sizeClasses[size])} />
      {(showName || showAddress) && (
        <div className="flex flex-col gap-1">
          {showName && <Skeleton className="h-4 w-24" />}
          {showAddress && <Skeleton className="h-3 w-20" />}
        </div>
      )}
    </div>
  );
}
