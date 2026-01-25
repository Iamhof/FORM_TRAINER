import { logger } from './logger';
import { errorService } from '@/services/error.service';

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
  if (typeof global !== 'undefined') {
    (global as any).onunhandledrejection = (event: any) => {
      const error = event?.reason || new Error('Unhandled rejection');
      logger.error('[CrashProtection] Unhandled rejection:', error);
      errorService.capture(error, { type: 'unhandledRejection' });
    };
  }

  logger.info('[CrashProtection] Initialized');
}
