import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log('[Hono] Incoming request:', c.req.method, c.req.url);
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  await next();
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error('[Hono tRPC] Error on path', path, ':', error);
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.notFound((c) => {
  console.error('[Hono] Route not found:', c.req.method, c.req.url);
  return c.json({ error: 'Not found', path: c.req.url }, 404);
});

export default app;
