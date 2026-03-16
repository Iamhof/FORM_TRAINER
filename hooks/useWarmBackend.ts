import { useEffect } from 'react';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Fire-and-forget health ping to wake Railway backend from cold sleep.
 * Runs once on app mount, in parallel with the auth flow, so tRPC queries
 * hit a warm server by the time they fire.
 */
export function useWarmBackend(): void {
  useEffect(() => {
    const baseUrl = env.EXPO_PUBLIC_RORK_API_BASE_URL;
    if (!baseUrl || baseUrl.includes('localhost')) return;

    fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    })
      .then(() => logger.debug('[WarmBackend] Backend is warm'))
      .catch(() => {
        // Swallow errors — this is best-effort
      });
  }, []);
}
