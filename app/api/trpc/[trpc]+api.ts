import honoApp from '@/backend/hono';

export async function GET(request: Request) {
  console.log('[API Handler] GET request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Handler] GET response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Handler] GET error:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  console.log('[API Handler] POST request:', request.url);
  try {
    const response = await honoApp.fetch(request);
    console.log('[API Handler] POST response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Handler] POST error:', error);
    throw error;
  }
}

export async function PUT(request: Request) {
  return honoApp.fetch(request);
}

export async function DELETE(request: Request) {
  return honoApp.fetch(request);
}

export async function PATCH(request: Request) {
  return honoApp.fetch(request);
}

export async function OPTIONS(request: Request) {
  return honoApp.fetch(request);
}