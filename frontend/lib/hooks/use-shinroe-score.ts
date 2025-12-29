'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShinroeScore } from '@/lib/types/shinroe';
import { getShinroeScore } from '@/lib/services/shinroe';

interface UseShinroeScoreResult {
  score: ShinroeScore | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: ShinroeScore; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(address: string): ShinroeScore | null {
  const cached = cache.get(address.toLowerCase());
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(address.toLowerCase());
    return null;
  }
  return cached.data;
}

function setCache(address: string, data: ShinroeScore): void {
  cache.set(address.toLowerCase(), { data, timestamp: Date.now() });
}

/**
 * Hook to fetch Shinroe reputation score for an address
 */
export function useShinroeScore(address: string | undefined): UseShinroeScoreResult {
  const [score, setScore] = useState<ShinroeScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchScore = useCallback(async () => {
    if (!address) {
      setScore(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCached(address);
    if (cached) {
      setScore(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getShinroeScore(address);
      if (result) {
        setCache(address, result);
      }
      setScore(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch score'));
      setScore(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    score,
    loading,
    error,
    refetch: fetchScore,
  };
}

/**
 * Hook to fetch Shinroe scores for multiple addresses
 */
export function useShinroeScores(
  addresses: string[]
): Map<string, UseShinroeScoreResult> {
  const [results, setResults] = useState<Map<string, UseShinroeScoreResult>>(
    new Map()
  );

  useEffect(() => {
    const fetchAll = async () => {
      const newResults = new Map<string, UseShinroeScoreResult>();

      for (const address of addresses) {
        const cached = getCached(address);
        if (cached) {
          newResults.set(address.toLowerCase(), {
            score: cached,
            loading: false,
            error: null,
            refetch: async () => {},
          });
        } else {
          newResults.set(address.toLowerCase(), {
            score: null,
            loading: true,
            error: null,
            refetch: async () => {},
          });
        }
      }
      setResults(new Map(newResults));

      // Fetch uncached addresses IN PARALLEL
      const uncachedAddresses = addresses.filter((addr) => !getCached(addr));

      if (uncachedAddresses.length > 0) {
        const fetchPromises = uncachedAddresses.map(async (address) => {
          try {
            const result = await getShinroeScore(address);
            if (result) {
              setCache(address, result);
            }
            return { address, score: result, error: null };
          } catch (err) {
            return {
              address,
              score: null,
              error: err instanceof Error ? err : new Error('Failed')
            };
          }
        });

        const results = await Promise.all(fetchPromises);

        for (const { address, score, error } of results) {
          newResults.set(address.toLowerCase(), {
            score,
            loading: false,
            error,
            refetch: async () => {},
          });
        }
        setResults(new Map(newResults));
      }
    };

    if (addresses.length > 0) {
      fetchAll();
    }
  }, [addresses.join(',')]);

  return results;
}
