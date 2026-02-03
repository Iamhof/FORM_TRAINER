import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router.js";
import { createContext } from "./trpc/create-context.js";
import { logger } from "../lib/logger.js";

// Note: Service keys are now validated lazily when Supabase client is first accessed
// This reduces cold start time significantly

logger.info('[Hono] Backend server initializing...');
logger.info('[Hono] App router loaded:', !!appRouter);
logger.info('[Hono] Create context loaded:', !!createContext);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Reject requests without origin (except same-origin)
      if (!origin) {
        // Allow same-origin requests (no origin header)
        return null;
      }

      const allowedOrigins = [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:3000',
        process.env.EXPO_PUBLIC_WEB_URL,
      ].filter(Boolean);

      // In development, allow localhost variants
      // Safe runtime check for __DEV__
      let isDev = false;
      try {
        const dev = (global as any).__DEV__;
        isDev = dev === true || process.env.NODE_ENV === 'development';
      } catch {
        isDev = process.env.NODE_ENV === 'development';
      }
      if (process.env.NODE_ENV === 'development' || isDev) {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return origin;
        }
      }

      // Allow all Vercel preview and production deployments
      if (origin.includes('.vercel.app')) {
        logger.debug('[CORS] Allowing Vercel origin:', origin);
        return origin;
      }

      // In production, only allow whitelisted origins
      const isAllowed = allowedOrigins.includes(origin);
      logger.debug('[CORS] Request from origin:', origin, isAllowed ? 'allowed' : 'blocked');
      return isAllowed ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600,
    credentials: true,
  })
);

// Request ID and performance monitoring middleware
app.use("*", async (c, next) => {
  // Generate unique request ID
  const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  (c as any).set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  
  // Performance tracking
  const startTime = Date.now();
  logger.debug('[Hono] Incoming request:', {
    requestId,
    method: c.req.method,
    url: c.req.url,
    path: c.req.path,
    origin: c.req.header('origin'),
  });
  
  try {
    await next();
    
    const duration = Date.now() - startTime;
    const status = c.res.status;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('[Hono] Slow request:', {
        requestId,
        path: c.req.path,
        method: c.req.method,
        duration: `${duration}ms`,
        status,
      });
    }
    
    // Log performance for all requests in debug mode
    logger.debug('[Hono] Request completed:', {
      requestId,
      path: c.req.path,
      method: c.req.method,
      duration: `${duration}ms`,
      status,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('[Hono] Request error:', {
      requestId,
      path: c.req.path,
      method: c.req.method,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      logger.error('[Hono tRPC] Error on path', path, ':', error);
    },
  })
);

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "API is running",
    availableRoutes: Object.keys(appRouter._def.procedures),
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (c) => {
  return c.json({ 
    status: "healthy", 
    procedures: Object.keys(appRouter._def.procedures)
  });
});

app.notFound((c) => {
  logger.error('[Hono] Route not found:', c.req.method, c.req.url);
  logger.error('[Hono] Request path:', c.req.path);
  logger.error('[Hono] Available routes: /trpc/*, /api/trpc/*');
  return c.json({ error: 'Not found', path: c.req.url, requestedPath: c.req.path }, 404);
});

export default app;

