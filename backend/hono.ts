import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

console.log('[Hono] Backend server initializing...');
console.log('[Hono] App router loaded:', !!appRouter);
console.log('[Hono] Create context loaded:', !!createContext);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600,
    credentials: true,
  })
);

app.use("*", async (c, next) => {
  console.log('[Hono] Incoming request:', c.req.method, c.req.url);
  console.log('[Hono] Request path:', c.req.path);
  console.log('[Hono] Request pathname:', new URL(c.req.url).pathname);
  console.log('[Hono] Request query:', new URL(c.req.url).search);
  await next();
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error('[Hono tRPC] Error on path', path, ':', error);
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
  console.error('[Hono] Route not found:', c.req.method, c.req.url);
  console.error('[Hono] Request path:', c.req.path);
  console.error('[Hono] Available routes: /trpc/*, /api/trpc/*');
  return c.json({ error: 'Not found', path: c.req.url, requestedPath: c.req.path }, 404);
});

export default app;
