import { logger } from '@/lib/logger';
import { isDevelopmentMode } from '@/lib/runtime-utils';

type ErrorContext = Record<string, any>;

/**
 * ErrorService handles application error logging and tracking.
 *
 * Logs errors locally via the logger service.
 * Remote error tracking (e.g. Sentry) has been removed.
 */
class ErrorService {
  private initialized = false;

  init() {
    if (this.initialized) return;

    this.initialized = true;
    logger.info('[ErrorService] Initialized');
  }

  capture(error: unknown, context?: ErrorContext) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const sanitizedContext = context ? logger.sanitize(context) : undefined;

    // Log errors locally
    logger.error(`[Error] ${message}`, {
      context: sanitizedContext,
      stack,
      originalError: error
    });
  }

  // Helper for user-facing messages
  getUserMessage(error: unknown): string {
    if (error instanceof Error) {
      // Don't expose technical error messages in production
      const isDev = isDevelopmentMode();
      if (isDev) {
        return error.message;
      }
      // In production, return generic messages
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        return 'Connection error. Please check your internet connection.';
      }
      if (error.message.includes('UNAUTHORIZED') || error.message.includes('FORBIDDEN')) {
        return 'You are not authorized to perform this action.';
      }
      return 'An unexpected error occurred. Please try again.';
    }
    return 'An unexpected error occurred';
  }
}

export const errorService = new ErrorService();
// Initialize on import
errorService.init();

