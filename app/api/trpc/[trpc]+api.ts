import honoApp from '@/backend/hono';

export async function GET(request: Request) {
  return honoApp.fetch(request);
}

export async function POST(request: Request) {
  return honoApp.fetch(request);
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