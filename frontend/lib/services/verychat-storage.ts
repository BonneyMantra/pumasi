// VeryChat verification browser storage helpers
// Stores verification state until saved on-chain with profile

const VERYCHAT_STORAGE_KEY = 'pumasi_verychat_verification';

export interface VeryChatVerificationData {
  handleId: string;
  verifiedAt: number;
}

/**
 * Get stored VeryChat verification from localStorage
 */
export function getStoredVerification(address: string): VeryChatVerificationData | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(`${VERYCHAT_STORAGE_KEY}_${address.toLowerCase()}`);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Store VeryChat verification in localStorage
 */
export function storeVerification(address: string, handleId: string): void {
  if (typeof window === 'undefined') return;
  const data: VeryChatVerificationData = {
    handleId,
    verifiedAt: Math.floor(Date.now() / 1000),
  };
  localStorage.setItem(
    `${VERYCHAT_STORAGE_KEY}_${address.toLowerCase()}`,
    JSON.stringify(data)
  );
}

/**
 * Clear VeryChat verification from localStorage
 */
export function clearStoredVerification(address: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${VERYCHAT_STORAGE_KEY}_${address.toLowerCase()}`);
}
