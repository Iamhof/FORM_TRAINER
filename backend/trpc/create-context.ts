import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { logger } from '../../lib/logger.js';
import { supabaseAdmin } from '../lib/auth.js';

// Type guard for Zod errors
function isZodError(cause: unknown): cause is ZodError {
  return cause instanceof ZodError || (
    typeof cause === 'object' &&
    cause !== null &&
    'issues' in cause &&
    Array.isArray((cause as Record<string, unknown>).issues)
  );
}

const resolveUserFromToken = async (token?: string | null) => {
  if (!token) {
    logger.debug('[Auth] No token provided, request will be unauthenticated');
    return { userId: null, userEmail: null };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      logger.warn('[Auth] Token validation failed:', { error: error.message });
      return { userId: null, userEmail: null };
    }

    if (!user) {
      logger.warn('[Auth] Token valid but no user returned');
      return { userId: null, userEmail: null };
    }

    logger.debug('[Auth] User authenticated:', { userId: user.id });
    return {
      userId: user.id,
      userEmail: user.email ?? null,
    };
  } catch (error) {
    logger.error('[Auth] Unexpected error resolving user from token:', error);
    return { userId: null, userEmail: null };
  }
};

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || null;
  const requestId = opts.req.headers.get('x-request-id') || 'unknown';

  const { userId, userEmail } = await resolveUserFromToken(token);

  return {
    req: opts.req,
    requestId,
    userId,
    userEmail,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error, path }) {
    // Log detailed error info for debugging
    const zodError = error.code === 'BAD_REQUEST' && isZodError(error.cause) ? error.cause : null;

    logger.error('[tRPC] Error occurred', {
      code: shape.code,
      message: shape.message,
      path,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
      } : error.cause,
      // Include Zod validation details if present
      zodErrors: zodError?.issues,
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        // Include validation errors in response for debugging
        zodError: zodError?.flatten() ?? null,
      },
    };
  },
});

// Sanitized value type - represents what sanitizeInput can return
type SanitizedValue =
  | null
  | undefined
  | string
  | number
  | boolean
  | SanitizedValue[]
  | { [key: string]: SanitizedValue };

// Input sanitization function
// IMPORTANT: Uses `typeof` checks instead of `constructor` checks to ensure
// consistent behavior across dev and production (minified) builds. The previous
// `input.constructor === Object` pattern fails when superjson or other
// deserializers produce objects whose constructor chain differs in minified code.
function sanitizeInput(input: unknown): SanitizedValue {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    // Limit string length and trim
    return input.trim().slice(0, 10000);
  }

  if (typeof input === 'number') {
    // Validate number ranges
    if (!isFinite(input)) return 0;
    if (input > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    if (input < Number.MIN_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
    return input;
  }

  if (typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    // Limit array size and sanitize each element
    return input.slice(0, 1000).map(sanitizeInput);
  }

  // Plain object check using typeof — works reliably across all JS runtimes
  // regardless of minification, bundling, or serializer behaviour
  if (typeof input === 'object') {
    // Limit object keys and sanitize values
    const sanitized: Record<string, SanitizedValue> = {};
    let keyCount = 0;
    for (const [key, value] of Object.entries(input)) {
      if (keyCount++ >= 100) break; // Limit object keys
      // Sanitize key (remove special chars, limit length)
      const sanitizedKey = String(key).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100);
      sanitized[sanitizedKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input as SanitizedValue;
}

// Validated procedure with input sanitization and logging
export const validatedProcedure = t.procedure.use(async ({ input, next, path, ctx }) => {
  // Sanitize input
  const sanitizedInput = input ? sanitizeInput(input) : input;
  
  // Log request (sanitized) in debug mode
  logger.debug(`[tRPC] ${path}`, {
    requestId: ctx.requestId,
    userId: ctx.userId,
    input: sanitizedInput,
  });
  
  // Continue with sanitized input
  return next({
    input: sanitizedInput,
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = validatedProcedure;

export const protectedProcedure = validatedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    logger.warn(`[tRPC] Unauthorized access attempt`, {
      requestId: ctx.requestId,
      path: ctx.req.url,
    });
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

