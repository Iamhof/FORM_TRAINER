import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import superjson from "superjson";

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { errorService } from '@/services/error.service';

import type { AppRouter } from "@/backend/trpc/app-router";

// Timeout configuration for different network conditions
const TIMEOUT_CONFIG = {
  DEFAULT: 60000, // 60 seconds (doubled from 30s for slow networks)
  QUICK_OPERATION: 30000, // 30 seconds for lightweight operations
  HEAVY_OPERATION: 90000, // 90 seconds for data-intensive operations (workout uploads, analytics sync)
  BATCH_OPERATION: 120000, // 2 minutes for batch operations
} as const;

// Allow timeout override via environment variable
const getDefaultTimeout = (): number => {
  const envTimeout = process.env.EXPO_PUBLIC_TRPC_TIMEOUT;
  if (envTimeout && !isNaN(Number(envTimeout))) {
    return Number(envTimeout);
  }
  return TIMEOUT_CONFIG.DEFAULT;
};

export const trpc = createTRPCReact<AppRouter>();

/**
 * Helper to check if we're in development mode
 * Returns true in dev, false in production
 */
const isDevelopmentMode = (): boolean => {
  try {
    const dev = (global as any).__DEV__;
    return dev === true || process.env.NODE_ENV === 'development';
  } catch {
    return process.env.NODE_ENV === 'development';
  }
};

/**
 * Transform technical errors into user-friendly messages for production
 * while maintaining detailed logs for debugging
 * 
 * @param technicalError - The detailed error with full technical information
 * @param context - Additional context for error tracking
 * @returns User-friendly error for production, technical error for development
 */
const transformTRPCError = (technicalError: Error, context?: Record<string, any>): Error => {
  // Always log the full technical details for debugging
  logger.error('[TRPC] Error occurred:', {
    message: technicalError.message,
    stack: technicalError.stack,
    context,
  });
  
  // Capture in error service for monitoring
  errorService.capture(technicalError, {
    location: 'TRPC Client',
    ...context,
  });
  
  // In development, show full technical details to help developers
  if (isDevelopmentMode()) {
    return technicalError;
  }
  
  // In production, return user-friendly message
  const userMessage = errorService.getUserMessage(technicalError);
  return new Error(userMessage);
};

const getBaseUrl = () => {
  // Priority 1: Explicit environment variable (highest priority)
  const apiBaseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (apiBaseUrl) {
    const cleanUrl = apiBaseUrl.replace(/\/+$/, '');
    // If it's not localhost, use it directly
    if (!cleanUrl.includes('localhost')) {
      logger.debug('[TRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', cleanUrl);
      return cleanUrl;
    }
    // If localhost, fall through to use hostUri
    logger.warn('[TRPC] EXPO_PUBLIC_RORK_API_BASE_URL is localhost, using hostUri instead');
  }

  // Priority 2: Use Expo hostUri directly (for native development)
  if (Constants.expoConfig?.hostUri) {
    const hostUri = Constants.expoConfig.hostUri;
    
    // CRITICAL: Detect tunnel mode - API routes don't work through tunnels
    // Tunnel URLs contain patterns like ".exp.direct", "ngrok", "tunnel"
    const isTunnelMode = hostUri.includes('.exp.direct') || 
                         hostUri.includes('ngrok') || 
                         hostUri.includes('tunnel') ||
                         hostUri.includes('cloudflare');
    
    if (isTunnelMode) {
      logger.error('[TRPC] ⚠️ TUNNEL MODE DETECTED - API routes will NOT work!');
      logger.error('[TRPC] Expo Router API routes (+api.ts files) are not available through tunnel mode.');
      logger.error('[TRPC] To fix this, try one of these options:');
      logger.error('[TRPC] 1. Use LAN mode: Run "npx expo start" without --tunnel (device must be on same WiFi)');
      logger.error('[TRPC] 2. Use simulator/emulator instead of physical device');
      logger.error('[TRPC] 3. Set EXPO_PUBLIC_RORK_API_BASE_URL to a deployed backend URL');
      
      // Still return the URL so the error message is more informative
      const url = `http://${hostUri}`;
      return url;
    }
    
    // Use hostUri directly - it already has the correct port (Metro port = Backend port)
    const url = `http://${hostUri}`;
    logger.debug('[TRPC] Using native dev URL from Expo hostUri:', url);
    logger.debug('[TRPC] Note: Backend runs on same port as Metro bundler');
    return url;
  }
  
  // Priority 3: For web, use window.location
  // CRITICAL FIX: Use typeof check to safely detect window without throwing ReferenceError
  // Direct access to 'window' throws in React Native where it's not defined
  try {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      logger.debug('[TRPC] Using local web URL:', origin);
      return origin;
    }
  } catch {
    // window not available, continue to fallback
    logger.debug('[TRPC] Window not available (React Native), continuing to fallback');
  }
  
  // Priority 4: Fallback (only works in simulator/emulator)
  const fallbackUrl = 'http://localhost:8081';
  logger.warn('[TRPC] No hostUri found, using fallback:', fallbackUrl);
  logger.warn('[TRPC] This will only work in simulator/emulator, not on physical devices.');
  return fallbackUrl;
};

let trpcClient: ReturnType<typeof trpc.createClient>;
try {
  const baseUrl = getBaseUrl();
  
  trpcClient = trpc.createClient({
    links: [
      httpLink({
        url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      async headers() {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            logger.error('[tRPC] Failed to get auth session:', sessionError.message);
            // Still return empty - let backend handle UNAUTHORIZED
            return {
              authorization: '',
            };
          }

          if (!session) {
            logger.warn('[tRPC] No active session, request will be unauthenticated');
            return {
              authorization: '',
            };
          }

          const token = session.access_token;
          logger.debug('[tRPC] Request headers - Token present:', !!token);

          return {
            authorization: token ? `Bearer ${token}` : '',
          };
        } catch (error) {
          logger.error('[tRPC] Unexpected error getting session for headers:', error);
          return {
            authorization: '',
          };
        }
      },
      async fetch(url, options) {
        const baseUrl = getBaseUrl();
        
        // Check for operation-specific timeout in headers
        // This allows routes to specify custom timeouts for heavy operations
        const customTimeout = (options?.headers as Record<string, string> | undefined)?.['x-trpc-timeout'];
        const REQUEST_TIMEOUT = customTimeout && !isNaN(Number(customTimeout))
          ? Number(customTimeout)
          : getDefaultTimeout();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, REQUEST_TIMEOUT);
        
        logger.debug('[TRPC] Making request to:', url);
        logger.debug('[TRPC] Base URL:', baseUrl);
        logger.debug('[TRPC] Request method:', options?.method || 'GET');
        logger.debug('[TRPC] Request headers:', JSON.stringify(options?.headers || {}));
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          logger.debug('[TRPC] Response status:', response.status, response.statusText);
          logger.debug('[TRPC] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
          
          // Check content type before reading body
          const contentType = response.headers.get('content-type');
          logger.debug('[TRPC] Response content-type:', contentType);
          
          if (!response.ok) {
            const text = await response.text();
            logger.error('[TRPC] HTTP error:', response.status, response.statusText);
            logger.error('[TRPC] Response body preview:', text.substring(0, 500));
            
            if (text.startsWith('<')) {
              // Create detailed technical error for logging
              const technicalError = new Error(`Server returned HTML instead of JSON. Status: ${response.status}. 
This usually means:
1. The API route was not found (check that /api/trpc/* routes are configured)
2. The backend failed to initialize (check server logs for errors)
3. The request is hitting a wrong endpoint

Base URL: ${baseUrl}
Request URL: ${url}
Expected endpoint: ${baseUrl}/api/trpc/...`);
              
              // Transform to user-friendly error
              throw transformTRPCError(technicalError, {
                url,
                baseUrl,
                status: response.status,
                statusText: response.statusText,
                responseType: 'HTML',
              });
            }
            
            // Try to parse as JSON for better error message
            let errorMessage = `HTTP ${response.status}: ${text.substring(0, 200)}`;
            try {
              const json = JSON.parse(text);
              if (json.error || json.message) {
                errorMessage = `HTTP ${response.status}: ${json.message || json.error || text.substring(0, 200)}`;
              }
            } catch {
              // Not JSON, use text
            }
            
            // Create technical error and transform it
            const technicalError = new Error(errorMessage);
            throw transformTRPCError(technicalError, {
              url,
              baseUrl,
              status: response.status,
              statusText: response.statusText,
              responsePreview: text.substring(0, 200),
            });
          }
          
          // Verify response is JSON
          if (contentType && !contentType.includes('application/json')) {
            const text = await response.clone().text();
            logger.warn('[TRPC] Response is not JSON. Content-Type:', contentType);
            logger.warn('[TRPC] Response preview:', text.substring(0, 200));
            
            if (text.startsWith('<')) {
              // Check if this is likely a tunnel mode issue
              const isTunnelUrl = String(url).includes('.exp.direct') || 
                                  String(url).includes('ngrok') || 
                                  String(url).includes('tunnel');
              
              const tunnelWarning = isTunnelUrl 
                ? `\n\n⚠️ You appear to be using TUNNEL MODE. Expo Router API routes do NOT work through tunnels.
FIX: Run "npx expo start" (without --tunnel) with your device on the same WiFi network.`
                : '';
              
              // Create detailed technical error for logging
              const technicalError = new Error(`Server returned HTML instead of JSON. Content-Type: ${contentType}.
This usually means the API route was not found or the backend failed to initialize.
Base URL: ${baseUrl}
Request URL: ${url}${tunnelWarning}`);
              
              // Transform to user-friendly error
              throw transformTRPCError(technicalError, {
                url,
                baseUrl,
                contentType,
                responsePreview: text.substring(0, 200),
                isTunnelMode: isTunnelUrl,
              });
            }
          }
          
          logger.debug('[TRPC] Request successful');
          return response;
        } catch (error: any) {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            const timeoutSeconds = REQUEST_TIMEOUT / 1000;
            // Create detailed technical error for logging
            const technicalError = new Error(
              `Request timeout after ${timeoutSeconds}s. This may indicate a slow network connection. Please check your internet and try again.`
            );
            
            logger.warn('[TRPC] Request timed out after', timeoutSeconds, 'seconds');
            
            // Transform to user-friendly error (errorService.capture called inside transformTRPCError)
            throw transformTRPCError(technicalError, {
              url,
              baseUrl,
              timeout: REQUEST_TIMEOUT,
              timeoutSeconds,
            });
          }
          
          if (error instanceof Error && error.message.includes('HTML instead of JSON')) {
            // Already transformed earlier, just throw it
            throw error;
          }
          
          // Create technical error with full details for logging
          const technicalError = error instanceof Error 
            ? new Error(`${error.message}\n\nTroubleshooting:\n- Base URL: ${baseUrl}\n- Request URL: ${url}\n- Check server logs for backend initialization errors`)
            : new Error(`Network error: ${String(error)}\n\nBase URL: ${baseUrl}\nRequest URL: ${url}`);
          
          // Transform to user-friendly error (errorService.capture called inside transformTRPCError)
          throw transformTRPCError(technicalError, {
            url,
            baseUrl,
            originalError: error instanceof Error ? error.message : String(error),
          });
        }
      },
    }),
  ],
  });
} catch (error) {
  logger.error('[TRPC] Failed to create trpcClient:', error);
  // Create a minimal fallback client to prevent app crash
  // This client won't work, but it allows the app to start and show error messages
  trpcClient = trpc.createClient({
    links: [
      httpLink({
        url: 'http://localhost:8081/api/trpc',
        transformer: superjson,
        async headers() {
          return { authorization: '' };
        },
      }),
    ],
  });
  (trpcClient as any).__isInvalid = true;
}

export { trpcClient };

// Export timeout configuration for use in other parts of the app
export { TIMEOUT_CONFIG };

/**
 * Retry configuration for React Query / TRPC operations
 * Use this in your TRPC hooks to enable automatic retries on slow networks
 * 
 * Example usage:
 * const { data } = trpc.workouts.create.useMutation({
 *   retry: getRetryConfig('heavy'),
 * });
 */
export const getRetryConfig = (operationType: 'quick' | 'default' | 'heavy' = 'default') => {
  const configs = {
    quick: {
      retry: 1,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    default: {
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    heavy: {
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
    },
  };
  
  return configs[operationType];
};

/**
 * Helper to determine if an error is a timeout error
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('timeout') || error.message.includes('timed out');
  }
  return false;
};
