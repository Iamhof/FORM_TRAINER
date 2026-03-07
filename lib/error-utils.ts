/**
 * Error Narrowing Utilities
 *
 * Provides type-safe error handling by narrowing `unknown` errors
 * to structured, typed error objects.
 *
 * Usage:
 * ```typescript
 * try {
 *   await supabase.auth.signIn({ email, password });
 * } catch (error: unknown) {
 *   const typed = narrowError(error);
 *   logger.error('Auth failed', { message: typed.message, code: typed.code });
 * }
 * ```
 */

import { z } from 'zod';

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

/**
 * Supabase Error Schema
 * Matches errors from @supabase/supabase-js
 */
export const SupabaseErrorSchema = z.object({
  message: z.string(),
  details: z.string().optional(),
  hint: z.string().optional(),
  code: z.string().optional(),
  status: z.number().optional(),
});

export type SupabaseError = z.infer<typeof SupabaseErrorSchema>;

/**
 * tRPC Error Schema
 * Matches errors from @trpc/server
 */
export const TRPCErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  data: z.object({
    code: z.string(),
    httpStatus: z.number().optional(),
    path: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
});

export type TRPCError = z.infer<typeof TRPCErrorSchema>;

/**
 * Auth Error Schema
 * Covers authentication-specific errors
 */
export const AuthErrorSchema = z.object({
  message: z.string(),
  name: z.string().optional(),
  status: z.union([z.number(), z.string()]).optional(),
  __isAuthError: z.boolean().optional(),
});

export type AuthError = z.infer<typeof AuthErrorSchema>;

/**
 * Network Error Schema
 * Covers fetch/network failures
 */
export const NetworkErrorSchema = z.object({
  message: z.string(),
  name: z.literal('TypeError').or(z.literal('NetworkError')),
  cause: z.unknown().optional(),
});

export type NetworkError = z.infer<typeof NetworkErrorSchema>;

// ============================================================================
// NORMALIZED ERROR TYPE
// ============================================================================

/**
 * Normalized error structure
 * All errors are narrowed to this common shape
 *
 * Note: With exactOptionalPropertyTypes: true, we must explicitly
 * include | undefined for fields that can be undefined in return values.
 */
export type NarrowedError = {
  message: string;
  code?: string | undefined;
  details?: string | undefined;
  status?: number | undefined;
  originalError?: unknown;
};

// ============================================================================
// ERROR NARROWING FUNCTION
// ============================================================================

/**
 * Narrows an unknown error to a typed, structured error object
 *
 * @param error - The unknown error to narrow
 * @returns A normalized error object with guaranteed `message` field
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error: unknown) {
 *   const typed = narrowError(error);
 *   console.error(typed.message); // ✅ Type-safe access
 * }
 * ```
 */
export function narrowError(error: unknown): NarrowedError {
  // 1. Try Supabase error
  const supabaseResult = SupabaseErrorSchema.safeParse(error);
  if (supabaseResult.success) {
    return {
      message: supabaseResult.data.message,
      code: supabaseResult.data.code,
      details: supabaseResult.data.details || supabaseResult.data.hint,
      status: supabaseResult.data.status,
      originalError: error,
    };
  }

  // 2. Try tRPC error
  const trpcResult = TRPCErrorSchema.safeParse(error);
  if (trpcResult.success) {
    return {
      message: trpcResult.data.message,
      code: trpcResult.data.code,
      status: trpcResult.data.data?.httpStatus,
      originalError: error,
    };
  }

  // 3. Try Auth error
  const authResult = AuthErrorSchema.safeParse(error);
  if (authResult.success) {
    return {
      message: authResult.data.message,
      code: authResult.data.name || 'AUTH_ERROR',
      status: typeof authResult.data.status === 'number' ? authResult.data.status : undefined,
      originalError: error,
    };
  }

  // 4. Try Network error
  const networkResult = NetworkErrorSchema.safeParse(error);
  if (networkResult.success) {
    return {
      message: networkResult.data.message,
      code: 'NETWORK_ERROR',
      originalError: error,
    };
  }

  // 5. Standard JavaScript Error
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name || 'ERROR',
      details: error.stack,
      originalError: error,
    };
  }

  // 6. String error
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'STRING_ERROR',
      originalError: error,
    };
  }

  // 7. Null/undefined
  if (error === null) {
    return {
      message: 'Null error',
      code: 'NULL_ERROR',
      originalError: error,
    };
  }

  if (error === undefined) {
    return {
      message: 'Undefined error',
      code: 'UNDEFINED_ERROR',
      originalError: error,
    };
  }

  // 8. Object with message property
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    const errorWithMessage = error as Record<string, unknown>;
    const message = typeof errorWithMessage.message === 'string'
      ? errorWithMessage.message
      : String(errorWithMessage.message);

    return {
      message,
      code: 'UNKNOWN_OBJECT_ERROR',
      details: JSON.stringify(error),
      originalError: error,
    };
  }

  // 9. Fallback for anything else
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    details: typeof error === 'object' ? JSON.stringify(error) : undefined,
    originalError: error,
  };
}

// ============================================================================
// TESTS
// ============================================================================
// See tests/lib/error-utils.test.ts for unit tests
// Run verification: node tests/lib/error-utils-verify.mjs
