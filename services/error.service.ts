import { logger } from '@/lib/logger';

type ErrorContext = Record<string, any>;

/**
 * ErrorService handles application error logging and tracking.
 * 
 * Sentry Integration: ✅ ENABLED
 * - Automatically initializes in production when EXPO_PUBLIC_SENTRY_DSN is set
 * - Captures exceptions with context
 * - Sanitizes sensitive data before sending
 * - Works with logger service for comprehensive debugging
 * 
 * Setup:
 * 1. ✅ @sentry/react-native installed
 * 2. Set EXPO_PUBLIC_SENTRY_DSN in your .env file
 * 3. Test in production mode to verify errors are captured
 */
class ErrorService {
  private initialized = false;
  private sentryAvailable = false;

  init() {
    if (this.initialized) return;
    
    this.initialized = true;
    logger.info('[ErrorService] Initialized');

    // Safe runtime check for __DEV__
    let isDev = false;
    try {
      const dev = (global as any).__DEV__;
      isDev = dev === true || process.env.NODE_ENV === 'development';
    } catch {
      isDev = process.env.NODE_ENV === 'development';
    }
    const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    
    // Only initialize Sentry in production with DSN configured
    if (!isDev && sentryDsn) {
      try {
        const Sentry = require('@sentry/react-native');
        
        // Check if Sentry is already initialized (by logger service)
        const existingClient = (Sentry as any).getCurrentHub?.()?.getClient();
        if (existingClient) {
          this.sentryAvailable = true;
          logger.info('[ErrorService] Using existing Sentry instance from logger');
          return;
        }

        // Initialize Sentry
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV || 'production',
          tracesSampleRate: 0.1,
          // Enable automatic error tracking
          enableAutoSessionTracking: true,
          sessionTrackingIntervalMillis: 30000,
          // Capture unhandled promise rejections
          enableNative: true,
          beforeSend(event: any) {
            // Sanitize sensitive data
            if (event.request?.headers) {
              delete event.request.headers.authorization;
            }
            // Remove sensitive query params
            if (event.request?.query_string) {
              event.request.query_string = event.request.query_string.replace(
                /([?&])(token|key|password|secret)=[^&]*/gi,
                '$1$2=[REDACTED]'
              );
            }
            return event;
          },
        });
        
        this.sentryAvailable = true;
        logger.info('[ErrorService] Sentry initialized successfully');
      } catch (error) {
        logger.warn('[ErrorService] Failed to initialize Sentry:', error);
      }
    } else if (isDev) {
      logger.info('[ErrorService] Sentry disabled in development mode');
    } else {
      logger.info('[ErrorService] Sentry disabled - no DSN configured');
    }
  }

  capture(error: unknown, context?: ErrorContext) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const sanitizedContext = context ? logger.sanitize(context) : undefined;

    // Always log errors locally
    logger.error(`[Error] ${message}`, {
      context: sanitizedContext,
      stack,
      originalError: error
    });

    // Send to Sentry in production if available
    if (this.sentryAvailable) {
      try {
        const Sentry = require('@sentry/react-native');
        
        // Add context as tags and extras
        if (sanitizedContext) {
          Sentry.withScope((scope: any) => {
            // Add relevant context as tags for better filtering
            if (sanitizedContext.userId) {
              scope.setUser({ id: sanitizedContext.userId });
            }
            if (sanitizedContext.route) {
              scope.setTag('route', sanitizedContext.route);
            }
            if (sanitizedContext.action) {
              scope.setTag('action', sanitizedContext.action);
            }
            
            // Add all context as extra data
            scope.setExtras(sanitizedContext);
            
            // Capture the exception
            Sentry.captureException(error);
          });
        } else {
          // Capture without context
          Sentry.captureException(error);
        }
      } catch (err) {
        // Silently fail - already logged locally
        logger.warn('[ErrorService] Failed to send to Sentry:', err);
      }
    }
  }

  // Helper for user-facing messages
  getUserMessage(error: unknown): string {
    if (error instanceof Error) {
      // Don't expose technical error messages in production
      // Safe runtime check for __DEV__
      let isDev = false;
      try {
        const dev = (global as any).__DEV__;
        isDev = dev === true || process.env.NODE_ENV === 'development';
      } catch {
        isDev = process.env.NODE_ENV === 'development';
      }
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

