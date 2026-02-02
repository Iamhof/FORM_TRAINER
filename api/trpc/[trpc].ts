import { logger } from '../../lib/logger.js';

let honoApp: any = null;
let initializationError: Error | null = null;

// Helper function to safely get header value from various request types
function getHeader(request: any, headerName: string): string | null {
      // Try standard Headers API first (Web Request)
  if (request.headers && typeof request.headers.get === 'function') {
          return request.headers.get(headerName);
  }
      // Try object-style headers (Vercel/Node.js style)
  if (request.headers && typeof request.headers === 'object') {
          const value = request.headers[headerName] || request.headers[headerName.toLowerCase()];
          return Array.isArray(value) ? value[0] : value || null;
  }
      return null;
}

async function getHonoApp() {
      if (initializationError) {
              throw initializationError;
      }

  if (!honoApp) {
          try {
                    logger.info('[Serverless API] Initializing Hono app...');
                    const module = await import('../../backend/hono.js');
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

  return new Response(
      JSON.stringify({
                error: 'Internal Server Error',
                message: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      }),
      {
                status,
                headers: { 'Content-Type': 'application/json' }
      }
        );
}

export default async function handler(request: Request) {
      logger.debug('[Serverless API] Request received:', request.method);

  try {
          // Get host and protocol from headers using helper function
        // This works with both Web Request API and Vercel's request object
        const host = getHeader(request, 'host') || getHeader(request, 'x-forwarded-host') || 'localhost:3000';
          const protocol = getHeader(request, 'x-forwarded-proto') || 'https';

        // Get the URL path - handle both full URLs and relative paths
        let requestPath: string;
          if (typeof request.url === 'string') {
                    if (request.url.startsWith('http')) {
                                const urlObj = new URL(request.url);
                                requestPath = urlObj.pathname + urlObj.search;
                    } else {
                                requestPath = request.url;
                    }
          } else {
                    requestPath = '/';
          }

        const absoluteUrl = `${protocol}://${host}${requestPath}`;

        logger.debug('[Serverless API] Constructed URL:', {
                  host,
                  protocol,
                  requestPath,
                  absoluteUrl,
        });

        const url = new URL(absoluteUrl);
          const originalPath = url.pathname;

        // Transform URL to remove /api prefix (Vercel adds it automatically)
        url.pathname = url.pathname.replace(/^\/api/, '');

        logger.debug('[Serverless API] Path transform:', originalPath, '→', url.pathname);

        // Create a proper Request object for Hono
        const honoRequest = new Request(url.toString(), {
                  method: request.method,
                  headers: request.headers,
                  body: request.body,
        });

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
