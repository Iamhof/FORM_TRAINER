/**
 * Global Type Definitions
 *
 * Provides strict type safety for global runtime variables.
 * Eliminates need for `(global as any)` type assertions.
 */

declare global {
  /**
   * React Native / Expo development mode flag
   * True in development, false in production
   */
  var __DEV__: boolean | undefined;

  /**
   * Application start timestamp for performance tracking
   * Set in app entry point (_layout.tsx)
   */
  var __APP_START_TIME: number | undefined;

  /**
   * React Native unhandled rejection handler
   * Used for production crash protection
   */
  var onunhandledrejection: ((event: PromiseRejectionEvent) => void) | undefined;

  // Extend globalThis interface to include runtime flags
  interface Window {
    __DEV__?: boolean;
    __APP_START_TIME?: number;
  }
}

/**
 * tRPC Client Type Augmentation
 * Allows type-safe access to custom client properties
 */
declare module '@trpc/client' {
  interface TRPCClient {
    /**
     * Flag indicating if the client is in an invalid/fallback state
     * Set to true when client initialization fails
     */
    __isInvalid?: boolean;
  }
}

/**
 * Supabase Client Type Augmentation
 * Allows type-safe access to custom client properties
 */
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    /**
     * Flag indicating if the client is in an invalid/fallback state
     * Set to true when client initialization fails
     */
    __isInvalid?: boolean;
  }
}

// Export empty object to make this a module
export {};
