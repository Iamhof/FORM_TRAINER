import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';


import { logger } from '@/lib/logger';
import {
  addCustomerInfoListener,
  checkSubscription,
  configureRevenueCat,
  getOfferings,
  identifyUser,
  logoutRevenueCat,
  purchasePackage,
  restorePurchases,
  ENTITLEMENT_ID,
} from '@/lib/revenuecat';

import { useUser } from './UserContext';

import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

const [SubscriptionProviderRaw, useSubscription] = createContextHook(() => {
  const { user, isAuthenticated } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const hasInitialized = useRef(false);

  // Initialize RevenueCat when user authenticates (with 5s timeout guard)
  useEffect(() => {
    const RC_TIMEOUT_MS = 5_000;

    const init = async () => {
      if (!isAuthenticated || !user || hasInitialized.current) return;

      try {
        const rcTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RevenueCat timed out')), RC_TIMEOUT_MS),
        );

        await Promise.race([
          (async () => {
            await configureRevenueCat(user.id);
            await identifyUser(user.id);

            const [premium, currentOfferings] = await Promise.all([
              checkSubscription(),
              getOfferings(),
            ]);

            setIsPremium(premium);
            setOfferings(currentOfferings);
            hasInitialized.current = true;
            logger.info('[Subscription] Initialized, premium:', premium);
          })(),
          rcTimeout,
        ]);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('timed out')) {
          logger.warn('[Subscription] Init timed out after', RC_TIMEOUT_MS, 'ms — continuing with defaults');
        } else {
          logger.error('[Subscription] Init failed:', error);
        }
        // isPremium defaults to false, offerings stay null.
        // The customerInfo listener will update when RevenueCat eventually responds.
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isAuthenticated, user]);

  // Listen for subscription status changes
  useEffect(() => {
    if (!hasInitialized.current) return;

    const remove = addCustomerInfoListener((info) => {
      const premium = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(premium);
      logger.debug('[Subscription] Status updated, premium:', premium);
    });

    return remove;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hasInitialized is a ref; we intentionally re-run when it changes
  }, [hasInitialized.current]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated && hasInitialized.current) {
      logoutRevenueCat();
      setIsPremium(false);
      setOfferings(null);
      hasInitialized.current = false;
      setIsLoading(true);
    }
  }, [isAuthenticated]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        setIsPremium(true);
        return { success: true as const };
      }
      if (result.error === 'cancelled') {
        return { success: false as const, cancelled: true };
      }
      return { success: false as const, error: result.error };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.isPremium) {
        setIsPremium(true);
        Alert.alert('Restored', 'Your premium subscription has been restored.');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found for this account.');
      }
      return result;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const openManageSubscriptions = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }, []);

  return useMemo(
    () => ({
      isPremium,
      offerings,
      isLoading,
      isRestoring,
      isPurchasing,
      purchase,
      restore,
      openManageSubscriptions,
    }),
    [isPremium, offerings, isLoading, isRestoring, isPurchasing, purchase, restore, openManageSubscriptions],
  );
});

export const SubscriptionProvider = React.memo(SubscriptionProviderRaw);
export { useSubscription };
