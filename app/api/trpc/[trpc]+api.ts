import honoApp from '@/backend/hono';

export async function GET(request: Request) {
  console.log('[API Handler] GET request:', request.url);
  const url = new URL(request.url);
  console.log('[API Handler] Original pathname:', url.pathname);
  
  url.pathname = url.pathname.replace(/^\/api/, '');
  console.log('[API Handler] Transformed pathname:', url.pathname);
  console.log('[API Handler] Search:', url.search);
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const response = await honoApp.fetch(honoRequest);
    console.log('[API Handler] GET response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Handler] GET error:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  console.log('[API Handler] POST request:', request.url);
  const url = new URL(request.url);
  console.log('[API Handler] Original pathname:', url.pathname);
  
  url.pathname = url.pathname.replace(/^\/api/, '');
  console.log('[API Handler] Transformed pathname:', url.pathname);
  console.log('[API Handler] Search:', url.search);
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const response = await honoApp.fetch(honoRequest);
    console.log('[API Handler] POST response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Handler] POST error:', error);
    throw error;
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
  
  return honoApp.fetch(honoRequest);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  return honoApp.fetch(honoRequest);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  return honoApp.fetch(honoRequest);
}

export async function OPTIONS(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, '');
  
  const honoRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  return honoApp.fetch(honoRequest);
}