import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { supabaseAdmin } from '../lib/auth';
import { logger } from '@/lib/logger';

const resolveUserFromToken = async (token?: string | null) => {
  if (!token) {
    return { userId: null, userEmail: null };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { userId: null, userEmail: null };
  }

  return {
    userId: user.id,
    userEmail: user.email ?? null,
  };
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
});

// Input sanitization function
function sanitizeInput(input: any): any {
  if (input === null || input === undefined) return input;
  
  // Type checking without typeof - check for string by trying string methods
  if (input !== null && input !== undefined && input.constructor === String) {
    // Limit string length and trim
    const str = String(input);
    return str.trim().slice(0, 10000);
  }
  
  // Type checking without typeof - check for number using Number.isFinite
  if (input !== null && input !== undefined && Number.isFinite(input) && !Array.isArray(input)) {
    // Validate number ranges
    const num = Number(input);
    if (!isFinite(num)) return 0;
    if (num > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    if (num < Number.MIN_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
    return num;
  }
  
  if (Array.isArray(input)) {
    // Limit array size and sanitize each element
    return input.slice(0, 1000).map(sanitizeInput);
  }
  
  // Type checking without typeof - check for object by checking it's not a primitive
  if (input !== null && input !== undefined && input.constructor === Object) {
    // Limit object keys and sanitize values
    const sanitized: any = {};
    let keyCount = 0;
    for (const [key, value] of Object.entries(input)) {
      if (keyCount++ >= 100) break; // Limit object keys
      // Sanitize key (remove special chars, limit length)
      const sanitizedKey = String(key).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100);
      sanitized[sanitizedKey] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
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

