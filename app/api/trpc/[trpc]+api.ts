let honoApp: any = null;
let initError: Error | null = null;

async function getHonoApp() {
  if (initError) {
    throw initError;
  }
  
  if (!honoApp) {
    try {
      console.log('[API Handler] Initializing Hono app...');
      // Use relative path for better compatibility
      const module = await import('../../../backend/hono');
      honoApp = module.default;
      
      if (!honoApp || typeof honoApp.fetch !== 'function') {
        throw new Error('Invalid Hono app: missing fetch method');
      }
      
      console.log('[API Handler] Hono app initialized successfully');
    } catch (error) {
      console.error('[API Handler] Failed to initialize Hono app:', error);
      initError = error instanceof Error ? error : new Error(String(error));
      throw initError;
    }
  }
  return honoApp;
}

export async function GET(request: Request) {
  console.log('[API Handler] GET request:', request.url);
  const url = new URL(request.url);
  console.log('[API Handler] Original pathname:', url.pathname);
  
  try {
    url.pathname = url.pathname.replace(/^\/api/, '');
    console.log('[API Handler] Transformed pathname:', url.pathname);
    console.log('[API Handler] Search:', url.search);
    
    const honoRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    console.log('[API Handler] GET response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Handler] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: errorMessage,
        path: url.pathname,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function POST(request: Request) {
  console.log('[API Handler] POST request:', request.url);
  const url = new URL(request.url);
  console.log('[API Handler] Original pathname:', url.pathname);
  
  try {
    url.pathname = url.pathname.replace(/^\/api/, '');
    console.log('[API Handler] Transformed pathname:', url.pathname);
    console.log('[API Handler] Search:', url.search);
    
    const honoRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const app = await getHonoApp();
    const response = await app.fetch(honoRequest);
    console.log('[API Handler] POST response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Handler] POST error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: errorMessage,
        path: url.pathname,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  const app = await getHonoApp();
  return app.fetch(honoRequest);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  const app = await getHonoApp();
  return app.fetch(honoRequest);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  const app = await getHonoApp();
  return app.fetch(honoRequest);
}

export async function OPTIONS(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  const app = await getHonoApp();
  return app.fetch(honoRequest);
}