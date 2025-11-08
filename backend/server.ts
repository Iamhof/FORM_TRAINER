import app from "./hono";

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`[Server] Starting Hono server on port ${port}...`);
console.log(`[Server] Environment:`, {
  NODE_ENV: process.env.NODE_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set',
});

// Use Bun's built-in server
export default {
  port,
  fetch: app.fetch,
};

console.log(`[Server] ✅ Server configured to run on port ${port}`);
console.log(`[Server] Health check: http://localhost:${port}/health`);
console.log(`[Server] TRPC endpoint: http://localhost:${port}/trpc`);
