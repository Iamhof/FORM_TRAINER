import { logger } from '@/lib/logger';

let honoApp: any = null;
let initializationError: Error | null = null;

async function getHonoApp() {
  if (initializationError) {
    throw initializationError;
  }
  
  if (!honoApp) {
    try {
      logger.info('[API Handler] Initializing Hono app...');
      const module = await import('@/backend/hono');
      honoApp = module.default;
      
      if (!honoApp) {
        throw new Error('Hono app is null after import');
      }
      
      logger.info('[API Handler] Hono app initialized successfully');
    } catch (error) {
      logger.error('[API Handler] Failed to initialize Hono app:', error);
      initializationError = error instanceof Error ? error : new Error(String(error));
      throw initializationError;
    }
  }
  return honoApp;
}

function createErrorResponse(error: unknown, status: number = 500): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error('[API Handler] Creating error response:', {
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

export async function GET(request: Request) {
  logger.debug('[API Handler] GET request:', request.url);
  const url = new URL(request.url);
  logger.debug('[API Handler] Original pathname:', url.pathname);
  
  url.pathname = url.pathname.replace(/^\/api/, '');
  logger.debug('[API Handler] Transformed pathname:', url.pathname);
  logger.debug('[API Handler] Search:', url.search);
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    logger.debug('[API Handler] GET response status:', response.status);
    logger.debug('[API Handler] GET response headers:', Object.fromEntries(response.headers.entries()));
    
    // Ensure response is JSON, not HTML
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.clone().text();
      logger.warn('[API Handler] Response is not JSON. Content-Type:', contentType);
      logger.warn('[API Handler] Response preview:', text.substring(0, 200));
      
      if (text.startsWith('<')) {
        return createErrorResponse(
          new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the route was not found or the backend failed to initialize.`),
          response.status
        );
      }
    }
    
    return response;
  } catch (error) {
    logger.error('[API Handler] GET error:', error);
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  logger.debug('[API Handler] POST request:', request.url);
  const url = new URL(request.url);
  logger.debug('[API Handler] Original pathname:', url.pathname);
  
  url.pathname = url.pathname.replace(/^\/api/, '');
  logger.debug('[API Handler] Transformed pathname:', url.pathname);
  logger.debug('[API Handler] Search:', url.search);
  logger.debug('[API Handler] Request headers:', Object.fromEntries(request.headers.entries()));
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    logger.debug('[API Handler] POST response status:', response.status);
    logger.debug('[API Handler] POST response headers:', Object.fromEntries(response.headers.entries()));
    
    // Ensure response is JSON, not HTML
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.clone().text();
      logger.warn('[API Handler] Response is not JSON. Content-Type:', contentType);
      logger.warn('[API Handler] Response preview:', text.substring(0, 200));
      
      if (text.startsWith('<')) {
        return createErrorResponse(
          new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the route was not found or the backend failed to initialize.`),
          response.status
        );
      }
    }
    
    return response;
  } catch (error) {
    logger.error('[API Handler] POST error:', error);
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  logger.debug('[API Handler] PUT request:', request.url);
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    logger.debug('[API Handler] PUT response status:', response.status);
    return response;
  } catch (error) {
    logger.error('[API Handler] PUT error:', error);
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  logger.debug('[API Handler] DELETE request:', request.url);
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    logger.debug('[API Handler] DELETE response status:', response.status);
    return response;
  } catch (error) {
    logger.error('[API Handler] DELETE error:', error);
    return createErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  logger.debug('[API Handler] PATCH request:', request.url);
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    logger.debug('[API Handler] PATCH response status:', response.status);
    return response;
  } catch (error) {
    logger.error('[API Handler] PATCH error:', error);
    return createErrorResponse(error);
  }
}

export async function OPTIONS(request: Request) {
  logger.debug('[API Handler] OPTIONS request:', request.url);
  const url = new URL(request.url);
  logger.debug('[API Handler] Original pathname:', url.pathname);
  
  url.pathname = url.pathname.replace(/^\/api/, '');
  logger.debug('[API Handler] Transformed pathname:', url.pathname);
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
  });
  
  try {
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    logger.debug('[API Handler] OPTIONS response status:', response.status);
    logger.debug('[API Handler] OPTIONS response headers:', Object.fromEntries(response.headers.entries()));
    return response;
  } catch (error) {
    logger.error('[API Handler] OPTIONS error:', error);
    return createErrorResponse(error);
  }
}
