import { logger } from '../../lib/logger.js';

// In-memory subscription cache: userId → { isPremium, expiresAt }
const subscriptionCache = new Map<string, { isPremium: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of subscriptionCache) {
    if (now > value.expiresAt) {
      subscriptionCache.delete(key);
    }
  }
}, 120_000);

/**
 * Check whether a user has an active premium subscription via RevenueCat REST API.
 * Returns `false` on API errors (fails open — doesn't block users on RC outage).
 */
export async function checkUserSubscription(userId: string): Promise<boolean> {
  // Check cache first
  const cached = subscriptionCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.isPremium;
  }

  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) {
    logger.error('[RevenueCat] REVENUECAT_SECRET_API_KEY is not set — failing open');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      logger.warn('[RevenueCat] API returned non-OK status', {
        status: response.status,
        userId,
      });
      return false;
    }

    const data = await response.json() as {
      subscriber?: {
        entitlements?: Record<string, { expires_date?: string | null }>;
      };
    };

    const entitlements = data.subscriber?.entitlements ?? {};
    const now = new Date();
    const isPremium = Object.values(entitlements).some((entitlement) => {
      // No expiry = lifetime entitlement
      if (!entitlement.expires_date) return true;
      return new Date(entitlement.expires_date) > now;
    });

    // Cache the result
    subscriptionCache.set(userId, {
      isPremium,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    logger.debug('[RevenueCat] Subscription check', { userId, isPremium });
    return isPremium;
  } catch (error) {
    logger.error('[RevenueCat] Failed to check subscription — failing open', { userId, error });
    return false;
  }
}
