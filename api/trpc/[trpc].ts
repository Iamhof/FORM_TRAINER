import { logger } from '../../lib/logger';

let honoApp: any = null;
let initializationError: Error | null = null;

async function getHonoApp() {
  if (initializationError) {
    throw initializationError;
  }

  if (!honoApp) {
    try {
      logger.info('[Serverless API] Initializing Hono app...');
      const module = await import('../../backend/hono');
      honoApp = module.default;

      if (!honoApp) {
        throw new Error('Hono app is null after import');
      }

      logger.info('[Serverless API] Hono app initialized successfully');
    } catch (error) {
      logger.error('[Serverless API] Failed to initialize Hono app:', error);
      initializationError = error instanceof Error ? error : new Error(String(error));
      throw initializationError;
    }
  }
  return honoApp;
}

function createErrorResponse(error: unknown, status: number = 500): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error('[Serverless API] Creating error response:', {
    status,
    message: errorMessage,
    stack: errorStack,
  });

  return Response.json(
    {
      error: 'Internal Server Error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
    },
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

export default async function handler(request: Request) {
  logger.debug('[Serverless API] Request:', request.method, request.url);

  // Transform URL to remove /api prefix (Vercel adds it automatically)
  const url = new URL(request.url);
  const originalPath = url.pathname;
  url.pathname = url.pathname.replace(/^\/api/, '');

  logger.debug('[Serverless API] Path transform:', originalPath, '→', url.pathname);

  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);

    logger.debug('[Serverless API] Response status:', response.status);

    // Verify response is JSON (tRPC expects JSON)
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.clone().text();
      logger.warn('[Serverless API] Non-JSON response. Content-Type:', contentType);
      logger.warn('[Serverless API] Response preview:', text.substring(0, 200));

      if (text.startsWith('<')) {
        return createErrorResponse(
          new Error(`Backend returned HTML instead of JSON. Status: ${response.status}. Route may not exist.`),
          response.status
        );
      }
    }

    return response;
  } catch (error) {
    logger.error('[Serverless API] Handler error:', error);
    return createErrorResponse(error);
  }
}

// Vercel Serverless Function configuration
export const config = {
  maxDuration: 30,
};
