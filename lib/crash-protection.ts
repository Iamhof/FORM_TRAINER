import { errorService } from '@/services/error.service';

import { logger } from './logger';

/**
 * Initialize production crash protection
 * Call this at app startup to catch unhandled errors
 */
export function initCrashProtection(): void {
  // Only in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Handle unhandled promise rejections
  // Type-safe global access via global.d.ts
  if (typeof global !== 'undefined') {
    global.onunhandledrejection = (event) => {
      const error = (event as PromiseRejectionEvent)?.reason || new Error('Unhandled rejection');
      logger.error('[CrashProtection] Unhandled rejection:', error);
      errorService.capture(error, { type: 'unhandledRejection' });
    };
  }

  logger.info('[CrashProtection] Initialized');
}
