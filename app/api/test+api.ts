export function GET(request: Request) {
  console.log('[Test API] GET request received');
  return Response.json({ message: 'Test API works', url: request.url });
}
