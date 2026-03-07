import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

import { logger } from './logger';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const ENTITLEMENT_ID = 'premium';

let isConfigured = false;

export async function configureRevenueCat(userId?: string): Promise<void> {
  if (isConfigured) return;

  if (!REVENUECAT_API_KEY) {
    logger.warn('[RevenueCat] API key not set, skipping configuration');
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId ?? null,
    });

    isConfigured = true;
    logger.info('[RevenueCat] Configured successfully');
  } catch (error) {
    logger.error('[RevenueCat] Configuration failed:', error);
  }
}

export async function checkSubscription(): Promise<boolean> {
  if (!isConfigured) return false;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    logger.error('[RevenueCat] Failed to check subscription:', error);
    return false;
  }
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    logger.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'RevenueCat not configured' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (isPremium) {
      logger.info('[RevenueCat] Purchase successful, premium entitlement active');
    }

    return { success: isPremium, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      logger.debug('[RevenueCat] Purchase cancelled by user');
      return { success: false, error: 'cancelled' };
    }
    logger.error('[RevenueCat] Purchase failed:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  if (!isConfigured) {
    return { success: false, isPremium: false, error: 'RevenueCat not configured' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    logger.info('[RevenueCat] Restore complete, premium:', isPremium);
    return { success: true, isPremium };
  } catch (error: any) {
    logger.error('[RevenueCat] Restore failed:', error);
    return { success: false, isPremium: false, error: error.message || 'Restore failed' };
  }
}

export async function identifyUser(userId: string): Promise<void> {
  if (!isConfigured) return;

  try {
    await Purchases.logIn(userId);
    logger.debug('[RevenueCat] User identified:', userId);
  } catch (error) {
    logger.error('[RevenueCat] Failed to identify user:', error);
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!isConfigured) return;

  try {
    await Purchases.logOut();
    logger.debug('[RevenueCat] User logged out');
  } catch (error) {
    logger.error('[RevenueCat] Failed to log out:', error);
  }
}

export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void,
): () => void {
  if (!isConfigured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    // RevenueCat SDK manages listener cleanup internally
  };
}

export { ENTITLEMENT_ID };
